import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Atomic fixed-window counters shared across instances. Never trust client forwarded IPs. */
export async function rateLimit(scope: string, identity: string, limit: number, windowSeconds = 900) {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = `${scope}:${createHash("sha256").update(identity).digest("hex")}:${window}`;
  const expiresAt = new Date((window + 1) * windowSeconds * 1000);
  const [bucket] = await prisma.$queryRaw<{ hits: number }[]>`
    INSERT INTO "RateLimitBucket" (id, hits, "expiresAt") VALUES (${id}, 1, ${expiresAt})
    ON CONFLICT (id) DO UPDATE SET hits = LEAST("RateLimitBucket".hits + 1, 1000000)
    RETURNING hits`;
  return bucket.hits <= limit;
}
