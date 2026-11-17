import { z } from "zod";
import { limitedBody, paymentRequest } from "@/lib/payment-api";
import { openPayment } from "@/lib/payments";
import { PaymentError } from "@/lib/razorpay";
import { onlineCheckoutEnabled } from "@/lib/checkout-gate";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  return paymentRequest(async actor => {
    const parsed = z.object({ orderId: z.string().min(1).max(100) }).safeParse(JSON.parse((await limitedBody(req)).toString("utf8")));
    if (!parsed.success) throw new PaymentError(400, "Valid orderId required");
    if (actor.role !== "CUSTOMER") throw new PaymentError(403, "Customer access required");
    const owned = await prisma.order.findFirst({ where: { id: parsed.data.orderId, customerId: actor.id }, select: { id: true } });
    if (!owned) throw new PaymentError(404, "Order not found");
    if (!onlineCheckoutEnabled()) throw new PaymentError(503, "Online checkout is currently unavailable. Your order is saved.");
    return { payment: await openPayment(parsed.data.orderId, actor) };
  });
}
