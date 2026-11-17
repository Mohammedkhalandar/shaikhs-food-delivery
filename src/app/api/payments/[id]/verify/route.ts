import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { limitedBody, paymentRequest } from "@/lib/payment-api";
import { accessiblePayment, applyPayment, applyRefund, paymentDTO } from "@/lib/payments";
import { fetchProviderPayment, fetchRefunds, PaymentError, testPaymentConfig, validSignature } from "@/lib/razorpay";

const schema = z.object({ razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().length(64) });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return paymentRequest(async actor => {
    const config = testPaymentConfig();
    const payment = await accessiblePayment((await params).id, actor);
    const parsed = schema.safeParse(JSON.parse((await limitedBody(req)).toString("utf8")));
    if (!parsed.success) throw new PaymentError(400, "Invalid payment callback");
    const input = parsed.data;
    if (!payment.providerOrderId || input.razorpay_order_id !== payment.providerOrderId || !validSignature(`${payment.providerOrderId}|${input.razorpay_payment_id}`, input.razorpay_signature, config.keySecret)) {
      await prisma.paymentAudit.create({ data: { paymentId: payment.id, action: "CALLBACK_SIGNATURE_REJECTED", actorId: actor.id } });
      throw new PaymentError(401, "Invalid payment signature");
    }
    const entity = await fetchProviderPayment(input.razorpay_payment_id);
    if (entity.id !== input.razorpay_payment_id || entity.order_id !== payment.providerOrderId) throw new PaymentError(409, "Provider payment mismatch");
    const refunds = entity.status === "refunded" || entity.amount_refunded ? await fetchRefunds(entity.id) : [];
    await prisma.$transaction(async tx => {
      await applyPayment(tx, entity, actor.id);
      for (const refund of refunds) await applyRefund(tx, refund, entity, actor.id);
    });
    return { payment: { ...paymentDTO(await prisma.onlinePayment.findUniqueOrThrow({ where: { id: payment.id } })), awaitingCapture: ["authorized", "created"].includes(entity.status) } };
  });
}
