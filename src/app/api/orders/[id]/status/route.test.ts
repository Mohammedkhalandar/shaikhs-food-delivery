vi.mock('@/lib/inventory',()=>({reserveStock:vi.fn(),restoreStock:vi.fn(),validateStock:vi.fn()}));
vi.mock('@/lib/commissions',()=>({snapshotCommission:vi.fn(),reverseCommission:vi.fn()}));
vi.mock('@/lib/notifications',()=>({notifyOrder:vi.fn()}));
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/auth", () => ({ currentUser: mocks.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => true }));
import { PATCH } from "./route";

function request(status = "PICKED_UP") {
  return new Request("http://localhost/api/orders/order-1/status", { method: "PATCH", body: JSON.stringify({ status, verificationCode: "123456" }) });
}
const params = { params: Promise.resolve({ id: "order-1" }) };

describe("status API with mocked database", () => {
  const order = { id: "order-1", status: "READY_FOR_PICKUP", restaurantId: "restaurant-1", deliveryPartnerId: "rider-1", riderAcceptedAt: new Date(), pickupCode: "123456", operationsVersion: 0 };
  let updateMany: ReturnType<typeof vi.fn>;
  let event: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ id: "rider-1", role: "DELIVERY" });
    updateMany = vi.fn().mockResolvedValue({ count: 1 });
    event = vi.fn().mockResolvedValue({});
    mocks.transaction.mockImplementation(async (run: (tx: unknown) => Promise<unknown>) => run({ order: { findUnique: vi.fn().mockResolvedValue(order), updateMany }, orderStatusEvent: { create: event }, restaurant: { findUnique: vi.fn().mockResolvedValue({ ownerId: "owner-1" }) } }));
  });
  it("denies another rider without writing", async () => {
    mocks.user.mockResolvedValue({ id: "other-rider", role: "DELIVERY" });
    expect((await PATCH(request(), params)).status).toBe(403);
    expect(updateMany).not.toHaveBeenCalled();
    expect(event).not.toHaveBeenCalled();
  });
  it("denies another restaurant's owner", async () => {
    mocks.user.mockResolvedValue({ id: "other-owner", role: "RESTAURANT" });
    expect((await PATCH(request("CANCELLED"), params)).status).toBe(403);
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("rejects a concurrent assignment or status change without recording false history", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect((await PATCH(request(), params)).status).toBe(409);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "order-1", status: "READY_FOR_PICKUP", deliveryPartnerId: "rider-1", operationsVersion: 0 }, data: { status: "PICKED_UP", operationsVersion: { increment: 1 }, deliveryCode: expect.stringMatching(/^\d{6}$/) } });
    expect(event).not.toHaveBeenCalled();
  });
  it("records the actor and status only after a successful compare-and-set", async () => {
    expect((await PATCH(request(), params)).status).toBe(200);
    expect(event).toHaveBeenCalledWith({ data: { orderId: "order-1", status: "PICKED_UP", actorId: "rider-1" } });
  });
  it("allows only the owning customer to cancel a placed order", async () => {
    mocks.user.mockResolvedValue({ id: "customer-1", role: "CUSTOMER" });
    const placed = { ...order, status: "PLACED", customerId: "customer-1" };
    mocks.transaction.mockImplementation(async run => run({ order: { findUnique: vi.fn().mockResolvedValue(placed), updateMany }, orderStatusEvent: { create: event } }));
    expect((await PATCH(request("CANCELLED"), params)).status).toBe(200);
    expect(event).toHaveBeenCalledWith({ data: { orderId: "order-1", status: "CANCELLED", actorId: "customer-1" } });
    mocks.user.mockResolvedValue({ id: "another-customer", role: "CUSTOMER" });
    updateMany.mockClear();
    expect((await PATCH(request("CANCELLED"), params)).status).toBe(403);
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("blocks customer cancellation after acceptance and all other customer transitions", async () => {
    mocks.user.mockResolvedValue({ id: "customer-1", role: "CUSTOMER" });
    mocks.transaction.mockImplementation(async run => run({ order: { findUnique: vi.fn().mockResolvedValue({ ...order, customerId: "customer-1", status: "ACCEPTED" }), updateMany } }));
    expect((await PATCH(request("CANCELLED"), params)).status).toBe(409);
    expect((await PATCH(request("PREPARING"), params)).status).toBe(403);
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("rejects cancellation racing with acceptance without writing history", async () => {
    mocks.user.mockResolvedValue({ id: "customer-1", role: "CUSTOMER" });
    updateMany.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation(async run => run({ order: { findUnique: vi.fn().mockResolvedValue({ ...order, status: "PLACED", customerId: "customer-1" }), updateMany }, orderStatusEvent: { create: event } }));
    expect((await PATCH(request("CANCELLED"), params)).status).toBe(409);
    expect(event).not.toHaveBeenCalled();
  });
  it("records a refund obligation without inventing a refund for a verified paid cancellation", async () => {
    mocks.user.mockResolvedValue({ id: "customer-1", role: "CUSTOMER" });
    const audit = vi.fn().mockResolvedValue({});
    const paid = { ...order, status: "PLACED", customerId: "customer-1", paymentMethod: "ONLINE", paymentStatus: "PAID" };
    mocks.transaction.mockImplementation(async run => run({ order: { findUnique: vi.fn().mockResolvedValue(paid), updateMany }, orderStatusEvent: { create: event }, onlinePayment: { findUnique: vi.fn().mockResolvedValue({ id: "payment-1" }) }, paymentAudit: { create: audit } }));
    expect((await PATCH(request("CANCELLED"), params)).status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "order-1", status: "PLACED", deliveryPartnerId: "rider-1", paymentStatus: "PAID", operationsVersion: 0 }, data: { status: "CANCELLED", operationsVersion: { increment: 1 } } });
    expect(audit).toHaveBeenCalledWith({ data: { paymentId: "payment-1", action: "CANCELLED_REFUND_REQUIRED", actorId: "customer-1" } });
  });
});
