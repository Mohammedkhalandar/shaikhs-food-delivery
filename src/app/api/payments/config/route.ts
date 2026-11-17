import { NextResponse } from "next/server";
import { onlineCheckoutEnabled } from "@/lib/checkout-gate";
export async function GET() {
  return NextResponse.json({ enabled: onlineCheckoutEnabled(), mode: "test" }, { headers: { "Cache-Control": "no-store" } });
}
