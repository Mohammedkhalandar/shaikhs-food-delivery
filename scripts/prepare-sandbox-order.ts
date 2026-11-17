// Explicit local disposable data only. No provider calls, .env loading or credential output.
import { randomUUID } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { checkoutTotals } from "../src/lib/checkout";

const url = process.env.TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname) || !new URL(url).pathname.startsWith("/shaikhs_disposable_")) throw new Error("Explicit local disposable TEST_DATABASE_URL required");
const email = process.env.SANDBOX_CUSTOMER_EMAIL;
const password = process.env.SANDBOX_CUSTOMER_PASSWORD;
if (!email || !/^[A-Za-z0-9._+-]+@example\.test$/.test(email) || !password || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) throw new Error("Use a NEW @example.test fixture email and 12+ character password (max 72 UTF-8 bytes), via environment only");
const db = new PrismaClient({ datasourceUrl: url });
async function main() {
  const [customerHash, ownerHash] = await Promise.all([bcrypt.hash(password!, 12), bcrypt.hash(randomUUID(), 12)]);
  const order = await db.$transaction(async tx => {
    const customer = await tx.user.create({ data: { email: email!, name: "Sandbox customer fixture", passwordHash: customerHash, role: "CUSTOMER" } });
    const owner = await tx.user.create({ data: { email: `sandbox-owner-${randomUUID()}@example.test`, name: "Sandbox kitchen fixture", passwordHash: ownerHash, role: "RESTAURANT" } });
    const restaurant = await tx.restaurant.create({ data: { ownerId: owner.id, name: "Sandbox verification fixture", address: "Disposable Test Road" } });
    const product = await tx.product.create({ data: { restaurantId: restaurant.id, name: "Sandbox fixture dish", category: "Test", price: "100.05" } });
    return tx.order.create({ data: { orderNumber: `SANDBOX-${randomUUID()}`, customerId: customer.id, restaurantId: restaurant.id, paymentMethod: "ONLINE", deliveryAddress: "Disposable sandbox test address", ...checkoutTotals([{ price: product.price, quantity: 2 }]), items: { create: { productId: product.id, nameSnapshot: product.name, quantity: 2, unitPrice: product.price, lineTotal: product.price.times(2) } }, statusHistory: { create: { status: "PLACED", actorId: customer.id } } } });
  });
  if (!new Prisma.Decimal(order.total).equals("245.11")) throw new Error("Unexpected fixture total");
  console.log(JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, amountPaise: 24511, note: "Synthetic ONLINE fixture; public checkout gate unchanged; no provider request made" }));
}
main().catch(() => { console.error("Fixture preparation failed; check disposable migrations and use a new fixture email. No password or database URL is logged."); process.exitCode = 1; }).finally(() => db.$disconnect());
