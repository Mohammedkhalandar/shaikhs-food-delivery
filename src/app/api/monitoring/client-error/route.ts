import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonBody, HttpError } from "@/lib/http-body";
import { rateLimit } from "@/lib/rate-limit";
import { allowFallbackReport, logFailure } from "@/lib/monitoring";
const schema = z.object({ area: z.enum(["route", "root"]), fingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict();
export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await jsonBody(req));
    if (!parsed.success) return NextResponse.json({ error: "Invalid diagnostic event" }, { status: 400 });
    let allowed;
    try { allowed = await rateLimit("client-error-global", "all", 30, 60); }
    catch { allowed = allowFallbackReport(); } // Outage reporting remains bounded without PostgreSQL.
    if (!allowed) return NextResponse.json({ error: "Diagnostic limit reached" }, { status: 429, headers: { "Retry-After": "60" } });
    const reportId = logFailure(parsed.data.area, parsed.data.fingerprint);
    return NextResponse.json({ reportId }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return NextResponse.json({ error: "Invalid diagnostic event" }, { status: error instanceof HttpError ? error.code : 400 }); }
}
