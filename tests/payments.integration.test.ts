import { createHmac, randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Prisma, OnlinePayment } from "@prisma/client";

const mocks = vi.hoisted(() => ({ actor: { id: "", role: "CUSTOMER" } as { id: string; role: string } | null }));
vi.mock("@/lib/auth", () => ({ currentUser: async () => mocks.actor, createSession: vi.fn() }));
vi.mock("@/lib/prisma", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const url = process.env.TEST_DATABASE_URL;
  if (url) {
    const target = new URL(url);
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || !target.pathname.startsWith("/shaikhs_disposable_")) throw new Error("Disposable local database required");
  }
  return { prisma: new PrismaClient({ datasourceUrl: url || "postgresql://disabled@127.0.0.1:1/shaikhs_disposable_disabled" }) };
});
import { prisma } from "@/lib/prisma";
import { openPayment, reconcilePayment, refundPayment, applyPayment } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { POST as webhook } from "@/app/api/webhooks/razorpay/route";
import { POST as verify } from "@/app/api/payments/[id]/verify/route";
import { POST as createPayment } from "@/app/api/payments/orders/route";
import { POST as refundRoute } from "@/app/api/payments/[id]/refund/route";
import { PATCH as statusRoute } from "@/app/api/orders/[id]/status/route";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { GET as adminUsers } from "@/app/api/admin/users/route";
import { POST as placeOrder } from "@/app/api/orders/route";
import { GET as paymentStatus } from "@/app/api/payments/status/route";
import type { ProviderPayment, ProviderRefund } from "@/lib/razorpay";

const suite = describe.skipIf(!process.env.TEST_DATABASE_URL);
const secret = "fixture-webhook-secret-not-a-real-credential";
const keySecret = "fixture-api-key-not-a-real-credential";
let customer: { id: string; role: string };
let otherCustomer: { id: string; role: string };
let admin: { id: string; role: string };
let owner: { id: string; role: string };
let restaurantId: string;
const run = randomUUID().replaceAll("-", "");
let serial = 0;
let createCalls = 0;
let refundCreates = 0;
let loseCreateResponse = false;
let loseRefundResponse = false;
let providerDown = false;
let refundState: ProviderRefund["status"] = "processed";
const orders = new Map<string, { id: string; amount: number; currency: string; receipt: string; status: string }>();
const payments = new Map<string, ProviderPayment>();
const refunds = new Map<string, ProviderRefund>();

async function fixture() {
  const order = await prisma.order.create({ data: { orderNumber: `TEST-${randomUUID()}`, customerId: customer.id, restaurantId, paymentMethod: "ONLINE", subtotal: "200.10", tax: "10.01", deliveryFee: 35, total: "245.11", deliveryAddress: "Disposable test address", statusHistory: { create: { status: "PLACED", actorId: customer.id } } } });
  const dto = await openPayment(order.id, customer);
  return { order, payment: await prisma.onlinePayment.findUniqueOrThrow({ where: { id: dto.id } }) };
}
function entity(payment: OnlinePayment, status: ProviderPayment["status"] = "captured", id = `pay_test${run}${++serial}`): ProviderPayment {
  const value: ProviderPayment = { id, order_id: payment.providerOrderId!, amount: Number(payment.amountPaise), currency: "INR", status, amount_refunded: 0 };
  payments.set(id, value); return value;
}
function request(body: unknown) { return new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }); }
function event(kind: string, value: ProviderPayment | ProviderRefund, eventId = `evt_${randomUUID()}`, signature?: string) {
  const body = JSON.stringify({ event: kind, payload: { [kind.startsWith("refund") ? "refund" : "payment"]: { entity: value } } });
  return { eventId, body, req: new Request("http://localhost/api/webhooks/razorpay", { method: "POST", body, headers: { "x-razorpay-event-id": eventId, "x-razorpay-signature": signature ?? createHmac("sha256", secret).update(body).digest("hex") } }) };
}
async function deliver(kind: string, value: ProviderPayment | ProviderRefund) { return webhook(event(kind, value).req); }
async function getOrder(id: string) { return prisma.order.findUniqueOrThrow({ where: { id } }); }
function verifyRequest(payment: OnlinePayment, value: ProviderPayment, bad = false) {
  return verify(request({ razorpay_order_id: payment.providerOrderId, razorpay_payment_id: value.id, razorpay_signature: bad ? "0".repeat(64) : createHmac("sha256", keySecret).update(`${payment.providerOrderId}|${value.id}`).digest("hex") }), { params: Promise.resolve({ id: payment.id }) });
}

suite("real PostgreSQL payments, signed fixtures and mocked Razorpay HTTP (no provider contact)", () => {
  beforeAll(async () => {
    for (const role of ["CUSTOMER", "CUSTOMER", "ADMIN", "RESTAURANT"] as const) {
      const user = await prisma.user.create({ data: { email: `payments-${randomUUID()}@example.test`, name: `Fixture ${role}`, role, passwordHash: "invalid-fixture-hash" } });
      if (role === "ADMIN") admin = user;
      else if (role === "RESTAURANT") owner = user;
      else if (!customer) customer = user;
      else otherCustomer = user;
    }
    restaurantId = (await prisma.restaurant.create({ data: { ownerId: owner.id, name: "Disposable Payment Kitchen", address: "Test Road" } })).id;
 await prisma.deliveryZone.create({data:{restaurantId,name:'Synthetic postal service area',postalCode:'584101',deliveryFee:'35.00',minimumOrder:0}});

  });
  beforeEach(() => {
    mocks.actor = customer;
    orders.clear(); payments.clear(); refunds.clear(); createCalls = 0; refundCreates = 0;
    loseCreateResponse = false; loseRefundResponse = false; providerDown = false; refundState = "processed";
    vi.stubEnv("RAZORPAY_TEST_ENABLED", "true"); vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
    vi.stubEnv("RAZORPAY_SANDBOX_VERIFIED", "false");
    vi.stubEnv("RAZORPAY_KEY_SECRET", keySecret); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    vi.stubGlobal("fetch", vi.fn(async (input: string, options: RequestInit) => {
      expect(input.startsWith("https://api.razorpay.com/v1/")).toBe(true);
      expect(options.redirect).toBe("error");
      if (providerDown) throw new Error("Fixture provider unavailable");
      const url = new URL(input);
      const path = url.pathname.replace("/v1/", "");
      if (path === "orders" && options.method === "POST") {
        createCalls++;
        const body = JSON.parse(options.body as string);
        const remote = { id: `order_test${run}${++serial}`, ...body, status: "created" };
        orders.set(remote.id, remote);
        if (loseCreateResponse) { loseCreateResponse = false; throw new Error("Response lost after remote commit"); }
        return Response.json(remote);
      }
      if (path === "orders") return Response.json({ items: [...orders.values()].filter(o => o.receipt === url.searchParams.get("receipt")) });
      if (/^orders\/[^/]+\/payments$/.test(path)) return Response.json({ items: [...payments.values()].filter(p => p.order_id === path.split("/")[1]) });
      if (/^payments\/[^/]+\/refunds$/.test(path)) return Response.json({ items: [...refunds.values()].filter(r => r.payment_id === path.split("/")[1]) });
      if (/^payments\/[^/]+\/refund$/.test(path)) {
        const key = (options.headers as Record<string, string>)["X-Refund-Idempotency"];
        expect(key.length).toBeGreaterThanOrEqual(10);
        let value = refunds.get(key);
        if (!value) { refundCreates++; value = { id: `rfnd_test${run}${++serial}`, payment_id: path.split("/")[1], amount: JSON.parse(options.body as string).amount, currency: "INR", status: refundState }; refunds.set(key, value); }
        if (loseRefundResponse) { loseRefundResponse = false; throw new Error("Refund response lost"); }
        return Response.json(value);
      }
      if (/^payments\/[^/]+$/.test(path)) return Response.json(payments.get(path.split("/")[1]) ?? {}, { status: payments.has(path.split("/")[1]) ? 200 : 404 });
      throw new Error(`Unmocked provider path ${path}`);
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  afterAll(async () => prisma.$disconnect());

  it("creates one provider order with authoritative integer paise across duplicate calls", async () => {
    const { order, payment } = await fixture();
    expect(payment.amountPaise).toBe(BigInt(24511));
    const results = await Promise.all([openPayment(order.id, customer), openPayment(order.id, customer)]);
    expect(results[0].id).toBe(results[1].id); expect(createCalls).toBe(1);
  });
  it("recovers provider order creation after a lost response without another POST", async () => {
    const order = await prisma.order.create({ data: { orderNumber: randomUUID(), customerId: customer.id, restaurantId, paymentMethod: "ONLINE", subtotal: 100, tax: 5, deliveryFee: 35, total: 140, deliveryAddress: "Test address" } });
    loseCreateResponse = true;
    await expect(openPayment(order.id, customer)).rejects.toThrow("unavailable");
    const recovered = await openPayment(order.id, customer);
    expect(recovered.providerOrderId).not.toBeNull(); expect(createCalls).toBe(1); expect(recovered.needsReview).toBe(false);
  });
  it("rejects invalid webhook signatures and oversized bodies before storing events", async () => {
    const { payment } = await fixture();
    const bad = event("payment.captured", entity(payment), undefined, "0".repeat(64));
    expect((await webhook(bad.req)).status).toBe(401);
    expect(await prisma.paymentEvent.count({ where: { eventId: bad.eventId } })).toBe(0);
    expect((await webhook(new Request("http://localhost/api", { method: "POST", body: "x".repeat(65537) }))).status).toBe(413);
  });
  it("deduplicates concurrent webhook delivery and body replay with a changed header", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    const original = event("payment.captured", value);
    const results = await Promise.all([webhook(original.req.clone()), webhook(original.req.clone()), webhook(original.req.clone())]);
    expect(results.map(r => r.status)).toEqual([200, 200, 200]);
    expect((await deliver("payment.captured", value)).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("PAID");
    expect(await prisma.paymentEvent.count({ where: { eventId: original.eventId } })).toBe(1);
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "CAPTURED" } })).toBe(1);
  });
  it("does not let reused event identifiers replace an already processed payload", async () => {
    const { payment } = await fixture(); const value = entity(payment);
    const original = event("payment.captured", value); expect((await webhook(original.req)).status).toBe(200);
    expect((await webhook(event("payment.failed", { ...value, status: "failed" }, original.eventId).req)).status).toBe(409);
  });
  it("rolls back event/payment writes on amount mismatch and processes a corrected retry", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    const mismatch = event("payment.captured", { ...value, amount: 1 });
    expect((await webhook(mismatch.req)).status).toBe(409);
    expect(await prisma.paymentEvent.findUnique({ where: { eventId: mismatch.eventId } })).toBeNull();
    expect((await getOrder(order.id)).paymentStatus).toBe("PENDING");
    expect((await webhook(event("payment.captured", value, mismatch.eventId).req)).status).toBe(200);
  });
  it("handles failure then capture and ignores stale failure after capture", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    expect((await deliver("payment.failed", { ...value, status: "failed" })).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("FAILED");
    expect((await deliver("payment.captured", value)).status).toBe(200);
    expect((await deliver("payment.failed", { ...value, status: "failed" })).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("PAID");
  });
  it("requires captured money, not just a valid callback signature, and safely retries interruptions", async () => {
    const { order, payment } = await fixture(); const value = entity(payment, "authorized");
    expect((await verifyRequest(payment, value, true)).status).toBe(401);
    expect((await verifyRequest(payment, value)).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("PENDING");
    payments.set(value.id, { ...value, status: "captured" }); providerDown = true;
    expect((await verifyRequest(payment, value)).status).toBe(503); providerDown = false;
    expect((await verifyRequest(payment, value)).status).toBe(200);
    expect((await verifyRequest(payment, value)).status).toBe(200);
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "CAPTURED" } })).toBe(1);
  });
  it("denies other customers, riders and unauthenticated payment/refund access", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    mocks.actor = otherCustomer; expect((await verifyRequest(payment, value)).status).toBe(404);
    expect((await createPayment(request({ orderId: order.id }))).status).toBe(404);
    mocks.actor = { id: owner.id, role: "DELIVERY" }; expect((await verifyRequest(payment, value)).status).toBe(403);
    mocks.actor = customer; expect((await refundRoute(request({}), { params: Promise.resolve({ id: payment.id }) })).status).toBe(403);
    mocks.actor = null; expect((await verifyRequest(payment, value)).status).toBe(401);
  });
  it("blocks kitchen acceptance until online payment is captured", async () => {
    const { order } = await fixture(); mocks.actor = owner;
    expect((await statusRoute(new Request("http://localhost/api", { method: "PATCH", body: JSON.stringify({ status: "ACCEPTED" }) }), { params: Promise.resolve({ id: order.id }) })).status).toBe(409);
  });
  it("recovers full refunds after a lost provider response without double refund or credit", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    await deliver("payment.captured", value); loseRefundResponse = true;
    await expect(refundPayment(payment.id, admin)).rejects.toThrow("unavailable");
    expect((await getOrder(order.id)).paymentStatus).toBe("PAID");
    const results = await Promise.all([refundPayment(payment.id, admin), refundPayment(payment.id, admin)]);
    expect(results.every(r => r.state === "PROCESSED")).toBe(true); expect(refundCreates).toBe(1);
    expect(await prisma.paymentRefund.count({ where: { paymentId: payment.id } })).toBe(1);
    expect((await getOrder(order.id)).paymentStatus).toBe("REFUNDED");
    await deliver("payment.captured", value); expect((await getOrder(order.id)).paymentStatus).toBe("REFUNDED");
  });
  it("applies refund-before-capture and does not regress after late capture/failed refund", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    const refund: ProviderRefund = { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: value.amount, currency: "INR", status: "processed" };
    expect((await deliver("refund.processed", refund)).status).toBe(200);
    await deliver("payment.captured", value); await deliver("refund.failed", { ...refund, status: "failed" });
    expect((await getOrder(order.id)).paymentStatus).toBe("REFUNDED");
  });
  it("retains PAID while refund is pending or failed", async () => {
    const { order, payment } = await fixture(); const value = entity(payment); await deliver("payment.captured", value);
    refundState = "pending"; const refund = await refundPayment(payment.id, admin); expect(refund.state).toBe("REQUESTED");
    const remote = [...refunds.values()][0]; await deliver("refund.failed", { ...remote, status: "failed" });
    await deliver("refund.created", remote);
    expect((await getOrder(order.id)).paymentStatus).toBe("PAID");
    expect((await prisma.paymentRefund.findUniqueOrThrow({ where: { paymentId: payment.id } })).state).toBe("FAILED");
  });
  it("reconciles missed capture/refund events and accurate admin revenue", async () => {
    const { payment } = await fixture(); const value = entity(payment); mocks.actor = admin;
    const before = (await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics.revenue;
    expect((await reconcilePayment(payment.id, customer)).state).toBe("CAPTURED");
    const after = (await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics.revenue;
    const { Decimal } = (await import("@prisma/client")).Prisma;
    expect(new Decimal(after).minus(before).toFixed(2)).toBe("245.11");
    refunds.set("dashboard", { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: value.amount, currency: "INR", status: "processed" });
    expect((await reconcilePayment(payment.id, customer)).state).toBe("REFUNDED");
    expect((await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics.revenue).toBe(before);
  });
  it("expires abandoned payments and flags late capture without reviving cancelled orders", async () => {
    const { order, payment } = await fixture();
    await prisma.onlinePayment.update({ where: { id: payment.id }, data: { createdAt: new Date(Date.now() - 31 * 60 * 1000) } });
    expect((await reconcilePayment(payment.id, customer)).state).toBe("EXPIRED");
    expect((await getOrder(order.id)).status).toBe("CANCELLED");
    await deliver("payment.captured", entity(payment));
    const latest = await prisma.onlinePayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(latest.needsReview).toBe(true); expect(latest.state).toBe("CAPTURED");
    expect((await getOrder(order.id)).status).toBe("CANCELLED");
  });
  it("flags additional captures and partial refunds without double-crediting", async () => {
    const { order, payment } = await fixture(); const value = entity(payment); await deliver("payment.captured", value);
    await deliver("payment.captured", entity(payment));
    await deliver("refund.processed", { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: 1, currency: "INR", status: "processed" });
    expect((await getOrder(order.id)).paymentStatus).toBe("PAID");
    expect((await prisma.onlinePayment.findUniqueOrThrow({ where: { id: payment.id } })).needsReview).toBe(true);
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "CAPTURED" } })).toBe(1);
    await expect(refundPayment(payment.id, admin)).rejects.toThrow("eligible");
  });
  it("rolls back a capture and audit together when the transaction is interrupted", async () => {
    const { order, payment } = await fixture();
    await expect(prisma.$transaction(async (tx: Prisma.TransactionClient) => { await applyPayment(tx, entity(payment)); throw new Error("Fixture interruption"); })).rejects.toThrow("interruption");
    expect((await getOrder(order.id)).paymentStatus).toBe("PENDING");
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "CAPTURED" } })).toBe(0);
  });
  it("enforces durable counters under concurrency and login throttling", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => rateLimit("fixture", randomIdentity, 5, 60)));
    expect(results.filter(Boolean)).toHaveLength(5);
    const email = `throttle-${randomUUID()}@example.test`;
    for (let i = 0; i < 10; i++) expect((await loginRoute(request({ email, password: "not-a-real-password" }))).status).toBe(401);
    expect((await loginRoute(request({ email, password: "not-a-real-password" }))).status).toBe(429);
    expect((await registerRoute(request({ name: "Test", email, password: "☕".repeat(30) }))).status).toBe(400);
  }, 10000); // Ten deliberate bcrypt comparisons need a bounded allowance on slower CI/Windows CPUs.
  it("retries unresolved webhook orders after binding without losing the event", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    await prisma.onlinePayment.update({ where: { id: payment.id }, data: { providerOrderId: null } });
    const pending = event("payment.captured", value);
    expect((await webhook(pending.req.clone())).status).toBe(503);
    expect(await prisma.paymentEvent.count({ where: { eventId: pending.eventId } })).toBe(0);
    await prisma.onlinePayment.update({ where: { id: payment.id }, data: { providerOrderId: value.order_id } });
    expect((await webhook(pending.req.clone())).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("PAID");
  });
  it("acknowledges a processed refund replay even while the provider is unavailable", async () => {
    const { payment } = await fixture(); const value = entity(payment);
    const refund: ProviderRefund = { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: value.amount, currency: "INR", status: "processed" };
    const sent = event("refund.processed", refund);
    expect((await webhook(sent.req.clone())).status).toBe(200); providerDown = true;
    expect((await webhook(sent.req.clone())).status).toBe(200);
  });
  it("refuses to blindly recreate a provider order when receipt recovery finds none", async () => {
    const order = await prisma.order.create({ data: { orderNumber: randomUUID(), customerId: customer.id, restaurantId, paymentMethod: "ONLINE", subtotal: 100, tax: 5, deliveryFee: 35, total: 140, deliveryAddress: "Test address" } });
    loseCreateResponse = true;
    await expect(openPayment(order.id, customer)).rejects.toThrow(); orders.clear();
    await expect(openPayment(order.id, customer)).rejects.toThrow("unresolved");
    expect(createCalls).toBe(1);
    expect((await prisma.onlinePayment.findUniqueOrThrow({ where: { orderId: order.id } })).needsReview).toBe(true);
    const unbound = await prisma.onlinePayment.findUniqueOrThrow({ where: { orderId: order.id } });
    await prisma.onlinePayment.update({ where: { id: unbound.id }, data: { state: "EXPIRED" } });
    await expect(reconcilePayment(unbound.id, customer)).rejects.toThrow("manual review");
  });
  it("rejects cross-order reconciliation responses and leaves the target unpaid", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ items: [{ ...value, order_id: "order_wrong" }] }));
    await expect(reconcilePayment(payment.id, customer)).rejects.toThrow("another order");
    expect((await getOrder(order.id)).paymentStatus).toBe("PENDING");
  });
  it("never credits a provider payment ID to two application orders", async () => {
    const first = await fixture(); const second = await fixture();
    const firstValue = entity(first.payment); await deliver("payment.captured", firstValue);
    const secondValue = { ...firstValue, order_id: second.payment.providerOrderId! };
    expect((await deliver("payment.captured", secondValue)).status).toBe(409);
    expect((await getOrder(second.order.id)).paymentStatus).toBe("PENDING");
  });
  it("excludes ambiguous partial-refund balances from verified admin revenue", async () => {
    const { payment } = await fixture(); const value = entity(payment); mocks.actor = admin;
    const before = (await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics;
    await deliver("payment.captured", value);
    await deliver("refund.processed", { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: 1, currency: "INR", status: "processed" });
    const after = (await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics;
    expect(after.revenue).toBe(before.revenue); expect(after.paymentReviews).toBe(before.paymentReviews + 1);
  });
  it("rejects disabled payment webhooks and malformed callback JSON", async () => {
    const { payment } = await fixture();
    expect((await verify(new Request("http://localhost/api", { method: "POST", body: "{" }), { params: Promise.resolve({ id: payment.id }) })).status).toBe(400);
    vi.stubEnv("RAZORPAY_TEST_ENABLED", "false");
    expect((await webhook(event("payment.captured", entity(payment)).req)).status).toBe(503);
  });
  it("bounds authentication request bodies before hashing or database work", async () => {
    for (const handler of [loginRoute, registerRoute]) {
      expect((await handler(new Request("http://localhost/api", { method: "POST", body: "x".repeat(16385) }))).status).toBe(413);
      expect((await handler(new Request("http://localhost/api", { method: "POST", body: "{" }))).status).toBe(400);
    }
  });
  it("surfaces paid cancellations as refund obligations until the refund is processed", async () => {
    const { order, payment } = await fixture(); await deliver("payment.captured", entity(payment)); mocks.actor = admin;
    const before = (await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics.pendingRefunds;
    expect((await statusRoute(new Request("http://localhost/api", { method: "PATCH", body: JSON.stringify({ status: "CANCELLED", reason: "Kitchen unable to fulfil test order" }) }), { params: Promise.resolve({ id: order.id }) })).status).toBe(200);
    expect((await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics.pendingRefunds).toBe(before + 1);
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "CANCELLED_REFUND_REQUIRED" } })).toBe(1);
    await refundPayment(payment.id, admin);
    expect((await (await adminUsers(new Request("http://localhost/api/admin/users"))).json()).metrics.pendingRefunds).toBe(before);
  });
  it("accepts refund.created events whose entity is already processed", async () => {
    const { order, payment } = await fixture(); const value = entity(payment);
    expect((await deliver("refund.created", { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: value.amount, currency: "INR", status: "processed" })).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("REFUNDED");
  });
  it("records full automatic refunds of uncaptured attempts without ever crediting revenue", async () => {
    const { order, payment } = await fixture(); const value = entity(payment, "failed");
    expect((await deliver("refund.processed", { id: `rfnd_test${run}${++serial}`, payment_id: value.id, amount: value.amount, currency: "INR", status: "processed" })).status).toBe(200);
    await deliver("payment.failed", value);
    expect((await getOrder(order.id)).paymentStatus).toBe("REFUNDED");
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "CAPTURED" } })).toBe(0);
    expect(await prisma.paymentAudit.count({ where: { paymentId: payment.id, action: "AUTO_REFUND_PROCESSED" } })).toBe(1);
  });
  it("gates new ONLINE orders but safely replays an existing order after the gate closes", async () => {
    const product = await prisma.product.create({ data: { restaurantId, name: "Online checkout fixture", category: "Fixture", price: "100.05" } });
    const key = `online-${randomUUID()}`;
    const input = { restaurantId, postalCode: "584101", deliveryAddress: "Disposable test address", paymentMethod: "ONLINE", items: [{ productId: product.id, quantity: 2, price: 0 }], total: 0 };
    const req = (id = key) => new Request("http://localhost/api/orders", { method: "POST", headers: { "Idempotency-Key": id }, body: JSON.stringify(input) });
    expect((await placeOrder(req())).status).toBe(422);
    vi.stubEnv("RAZORPAY_SANDBOX_VERIFIED", "true"); // Synthetic acceptance only; no real configuration is changed.
    const created = await placeOrder(req()); expect(created.status).toBe(201);
    const order = (await created.json()).order; expect(order.total).toBe("245.11"); expect(order.paymentStatus).toBe("PENDING");
    vi.stubEnv("RAZORPAY_SANDBOX_VERIFIED", "false");
    const replay = await placeOrder(req()); expect(replay.status).toBe(200); expect((await replay.json()).order.id).toBe(order.id);
    expect((await placeOrder(req(`new-${randomUUID()}`))).status).toBe(422);
    expect(await prisma.order.count({ where: { customerId: customer.id, idempotencyKey: key } })).toBe(1);
  });
  it("exposes only owner-scoped server payment status and blocks duplicate authorization", async () => {
    const { order, payment } = await fixture(); const value = entity(payment, "authorized");
    const result = await reconcilePayment(payment.id, customer); expect(result.awaitingCapture).toBe(true); expect(result.state).toBe("PENDING");
    const req = new Request(`http://localhost/api/payments/status?orderId=${order.id}`);
    expect((await paymentStatus(req.clone())).status).toBe(200);
    mocks.actor = otherCustomer; expect((await paymentStatus(req.clone())).status).toBe(404);
    mocks.actor = null; expect((await paymentStatus(req.clone())).status).toBe(401);
    mocks.actor = customer; expect((await verifyRequest(payment, value)).status).toBe(200);
    expect((await getOrder(order.id)).paymentStatus).toBe("PENDING");
  });
  it("gates direct provider preparation as well as public order creation", async () => {
    const { order, payment } = await fixture();
    const before = vi.mocked(fetch).mock.calls.length;
    expect((await createPayment(request({ orderId: order.id }))).status).toBe(503);
    expect(vi.mocked(fetch).mock.calls.length).toBe(before);
    vi.stubEnv("RAZORPAY_SANDBOX_VERIFIED", "true");
    const prepared = await createPayment(request({ orderId: order.id }));
    expect(prepared.status).toBe(200); expect((await prepared.json()).payment.id).toBe(payment.id);
    expect(createCalls).toBe(1);
  });
});
const randomIdentity = randomUUID();
