import { prisma } from "@/lib/prisma";
import { paymentRequest } from "@/lib/payment-api";
import { paymentDTO } from "@/lib/payments";
import { PaymentError } from "@/lib/razorpay";

export async function GET(req: Request) {
  return paymentRequest(async actor => {
    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId || orderId.length > 100) throw new PaymentError(400, "Valid orderId required");
    const order = await prisma.order.findFirst({ where: { id: orderId, ...(actor.role === "ADMIN" ? {} : { customerId: actor.id }) }, include: { onlinePayment: true } });
    if (!order) throw new PaymentError(404, "Order not found");
    return { order: { id: order.id, status: order.status, paymentStatus: order.paymentStatus }, payment: order.onlinePayment ? paymentDTO(order.onlinePayment) : null };
  });
}
