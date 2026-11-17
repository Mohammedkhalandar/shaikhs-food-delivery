import { paymentRequest } from "@/lib/payment-api";
import { accessiblePayment, refundPayment } from "@/lib/payments";
import { PaymentError } from "@/lib/razorpay";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return paymentRequest(async actor => {
    if (actor.role !== "ADMIN") throw new PaymentError(403, "Admin access required");
    const id = (await params).id;
    await accessiblePayment(id, actor);
    return { refund: await refundPayment(id, actor) };
  });
}
