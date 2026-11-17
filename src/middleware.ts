import { NextRequest, NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Reject cross-origin browser writes to cookie-authenticated API routes. */
export function middleware(request: NextRequest) {
  // Only this exact server-to-server endpoint authenticates its bounded raw body with HMAC.
  if (request.nextUrl.pathname === "/api/webhooks/razorpay" && request.method === "POST") return noStore(NextResponse.next());
  if (!request.nextUrl.pathname.startsWith("/api/") || !MUTATING.has(request.method)) {
    return noStore(NextResponse.next());
  }

  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : request.nextUrl.origin;

  // Browsers send Origin on cross-origin and same-origin POST/PATCH requests.
  // Permit missing Origin only outside production for local scripts and tests.
  if ((!origin && process.env.NODE_ENV === "production") || (origin && origin !== configuredOrigin)) {
    return noStore(NextResponse.json({ error: "Request origin is not allowed" }, { status: 403 }));
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
