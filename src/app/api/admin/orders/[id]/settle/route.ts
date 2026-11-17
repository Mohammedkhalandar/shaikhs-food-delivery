import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  amount: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/),
  reference: z.string().trim().min(8).max(100).regex(/^[A-Za-z0-9_-]+$/),
});

/** Admin attests that cash was received; this does not move money or contact a provider. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter an exact cash amount and a receipt reference (8–100 letters, digits, hyphens or underscores)" }, { status: 400 });
  const { id } = await params;
  const amount = new Prisma.Decimal(parsed.data.amount);
  try {
    const result = await prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({ where: { id }, include: { codSettlement: true } });
      if (!order) return { error: "Order not found", code: 404 };
      if (order.codSettlement) {
        if (order.codSettlement.reference === parsed.data.reference && order.codSettlement.amount.equals(amount)) return { settlement: order.codSettlement };
        return { error: "This order already has a different cash receipt", code: 409 };
      }
      if (order.paymentMethod !== "CASH_ON_DELIVERY" || order.status !== "DELIVERED" || order.paymentStatus !== "PENDING") return { error: "Only delivered, unpaid COD orders can be reconciled", code: 409 };
      if (!order.total.equals(amount)) return { error: "Cash received must match the order total", code: 409 };
      const changed = await tx.order.updateMany({ where: { id, status: "DELIVERED", paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING" }, data: { paymentStatus: "PAID" } });
      if (changed.count !== 1) return { error: "Order changed. Refresh and retry.", code: 409 };
      const settlement = await tx.codSettlement.create({ data: { orderId: id, amount: order.total, receivedById: user.id, reference: parsed.data.reference } });
      return { settlement };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.code });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Receipt reference or order already reconciled. Refresh and retry." }, { status: 409 });
    console.error("cod.settlement.failed", { orderId: id, error: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Unable to record cash receipt" }, { status: 503 });
  }
}
