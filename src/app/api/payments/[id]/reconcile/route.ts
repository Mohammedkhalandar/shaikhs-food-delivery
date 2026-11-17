import { paymentRequest } from "@/lib/payment-api";
import { reconcilePayment } from "@/lib/payments";
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return paymentRequest(async actor => ({ payment: await reconcilePayment((await params).id, actor) }));
}
