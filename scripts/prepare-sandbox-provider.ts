// Trusted operator bootstrap while public checkout stays disabled. TEST MODE ONLY.
import type { PrismaClient } from "@prisma/client";
const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname) || !new URL(url).pathname.startsWith("/shaikhs_disposable_")) throw new Error("Explicit local disposable TEST_DATABASE_URL required");
const orderId = process.env.SANDBOX_ORDER_ID;
if (!orderId) throw new Error("SANDBOX_ORDER_ID from sandbox:prepare is required");
process.env.DATABASE_URL = url;
let db: PrismaClient | undefined;
async function main() {
  const [{ prisma }, { openPayment }, { testPaymentConfig }] = await Promise.all([import("../src/lib/prisma"), import("../src/lib/payments"), import("../src/lib/razorpay")]);
  db = prisma;
  testPaymentConfig();
  const order = await prisma.order.findUnique({ where: { id: orderId! }, include: { customer: { select: { id: true, role: true, active: true } } } });
  if (!order || !order.orderNumber.startsWith("SANDBOX-") || order.paymentMethod !== "ONLINE" || order.customer.role !== "CUSTOMER" || !order.customer.active) throw new Error("Synthetic sandbox fixture required");
  const payment = await openPayment(order.id, order.customer);
  console.log(JSON.stringify({ payment, note: "Public test key/IDs only; public checkout gate unchanged" }));
}
main().catch(() => { console.error("Sandbox provider preparation failed. Check TEST configuration and reconcile the same fixture if creation is unresolved; no secret is logged."); process.exitCode = 1; }).finally(async () => db?.$disconnect());
