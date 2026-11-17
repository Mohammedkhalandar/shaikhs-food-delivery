import { NextResponse } from "next/server";
import { z } from "zod";
import { limitedBody, paymentFailure } from "@/lib/payment-api";
import { processPaymentEvent, processedPaymentEvent } from "@/lib/payments";
import { fetchProviderPayment, PaymentError, providerPaymentSchema, providerRefundSchema, testPaymentConfig, validSignature } from "@/lib/razorpay";

const envelopeSchema = z.object({ event: z.string().min(1).max(80), payload: z.object({ payment: z.object({ entity: z.unknown() }).optional(), refund: z.object({ entity: z.unknown() }).optional() }) });
export async function POST(req: Request) {
  try {
    const config = testPaymentConfig();
    const raw = await limitedBody(req, 65536);
    if (!validSignature(raw, req.headers.get("x-razorpay-signature"), config.webhookSecret)) throw new PaymentError(401, "Invalid webhook signature");
    const eventId = req.headers.get("x-razorpay-event-id");
    if (!eventId || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) throw new PaymentError(400, "Webhook event identifier required");
    const previous = await processedPaymentEvent(eventId, raw);
    if (previous) return NextResponse.json(previous);
    const parsed = envelopeSchema.safeParse(JSON.parse(raw.toString("utf8")));
    if (!parsed.success) throw new PaymentError(400, "Invalid webhook payload");
    const event = parsed.data;
    if (["payment.captured", "payment.failed"].includes(event.event)) {
      const entity = providerPaymentSchema.parse(event.payload.payment?.entity);
      if (entity.status !== event.event.split(".")[1]) throw new PaymentError(400, "Webhook state mismatch");
      return NextResponse.json(await processPaymentEvent(eventId, raw, event.event, entity));
    }
    if (["refund.processed", "refund.failed", "refund.created"].includes(event.event)) {
      const refund = providerRefundSchema.parse(event.payload.refund?.entity);
      // Creation events can already contain a processed entity (including auto-refunds).
      if (event.event !== "refund.created" && refund.status !== event.event.split(".")[1]) throw new PaymentError(400, "Webhook refund state mismatch");
      const payment = await fetchProviderPayment(refund.payment_id);
      return NextResponse.json(await processPaymentEvent(eventId, raw, event.event, payment, refund));
    }
    return NextResponse.json(await processPaymentEvent(eventId, raw, event.event));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    return paymentFailure(error);
  }
}
