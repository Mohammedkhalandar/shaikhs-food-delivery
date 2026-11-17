import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { migrationsReady } from "@/lib/schema-readiness";
export async function GET() {
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]>`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    if (!migrationsReady(rows)) throw new Error("Migrations incomplete");
    return NextResponse.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  }
  catch { return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
