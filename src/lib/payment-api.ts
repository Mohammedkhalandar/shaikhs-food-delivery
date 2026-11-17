import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { PaymentError } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { HttpError } from "@/lib/http-body";
import { logFailure } from "@/lib/monitoring";
export { limitedBody } from "@/lib/http-body";

export async function paymentRequest(run: (actor: { id: string; role: string }) => Promise<unknown>) {
  try {
    const actor = await currentUser();
    if (!actor) throw new PaymentError(401, "Sign in required");
    if (!["CUSTOMER", "ADMIN"].includes(actor.role)) throw new PaymentError(403, "Payment access denied");
    if (!await rateLimit("payment", actor.id, 30, 60)) return NextResponse.json({ error: "Too many payment requests" }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json(await run(actor), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentFailure(error); }
}

export function paymentFailure(error: unknown) {
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (error instanceof HttpError) return NextResponse.json({ error: error.message, ...(error.code >= 500 ? { reportId: logFailure("payment") } : {}) }, { status: error.code, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ error: "Unable to process payment; retry or reconcile", reportId: logFailure("payment") }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
