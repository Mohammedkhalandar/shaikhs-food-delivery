vi.mock('@/lib/inventory',()=>({reserveStock:vi.fn(),restoreStock:vi.fn(),validateStock:vi.fn()}));
vi.mock('@/lib/commissions',()=>({snapshotCommission:vi.fn(),reverseCommission:vi.fn()}));
vi.mock('@/lib/notifications',()=>({notifyOrder:vi.fn()}));
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { checkoutHash } from "@/lib/checkout";

const mocks = vi.hoisted(() => ({ user: vi.fn(), findUnique: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/auth", () => ({ currentUser: mocks.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findUnique: mocks.findUnique }, $transaction: mocks.transaction } }));
import { POST } from "./route";

const input = { postalCode:"584101", restaurantId: "restaurant-1", deliveryAddress: "12 Market Road", paymentMethod: "CASH_ON_DELIVERY", items: [{ productId: "product-1", quantity: 2 }] };
function request(body = input, key: string | null = "checkout-123") {
  return new Request("http://localhost/api/orders", { method: "POST", headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, body: JSON.stringify(body) });
}

describe("checkout API with mocked database", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user.mockResolvedValue({ id: "customer-1", role: "CUSTOMER" });
    mocks.findUnique.mockResolvedValue(null);
  });
  it("requires customer authentication and a retry key", async () => {
    expect((await POST(request(input, null))).status).toBe(400);
    mocks.user.mockResolvedValue({ id: "owner", role: "RESTAURANT" });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("bounds option-rich checkout bodies before parsing",async()=>{
    const response=await POST(new Request("http://localhost/api/orders",{method:"POST",body:"x".repeat(65537)}));
    expect(response.status).toBe(413);expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("replays the same customer's identical checkout without another write", async () => {
    mocks.findUnique.mockResolvedValue({ id: "order-1", requestHash: checkoutHash(input) });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { customerId_idempotencyKey: { customerId: "customer-1", idempotencyKey: "checkout-123" } } }));
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects reusing a key with changed intent", async () => {
    mocks.findUnique.mockResolvedValue({ id: "order-1", requestHash: "different" });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("returns the winning order after a concurrent unique-key conflict", async () => {
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "winning-order", requestHash: checkoutHash(input) });
    mocks.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "6" }));
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).order.id).toBe("winning-order");
  });
  it("writes exact server prices and initial history in a serializable transaction", async () => {
    const create = vi.fn().mockResolvedValue({ id: "created" });
    mocks.transaction.mockImplementation(async (run: (tx: unknown) => Promise<unknown>) => run({ user:{findUnique:vi.fn().mockResolvedValue({role:'CUSTOMER',active:true,authVersion:0})},deliveryZone:{findMany:vi.fn().mockResolvedValue([{id:'zone-fixture',priority:0,version:0,deliveryFee:new Prisma.Decimal(35),minimumOrder:new Prisma.Decimal(0),freeThreshold:null}])},deliveryPolicy:{findUnique:vi.fn().mockResolvedValue({deliveryFee:new Prisma.Decimal(35),freeThreshold:new Prisma.Decimal(499),riderBase:new Prisma.Decimal(25),riderFeeShareBps:0,version:0})},restaurant: { findUnique: vi.fn().mockResolvedValue({ id: "restaurant-1", isOpen: true }) }, product: { findMany: vi.fn().mockResolvedValue([{ id: "product-1", name: "Dish", price: new Prisma.Decimal("100.05") }]) }, order: { create } }));
    expect((await POST(request())).status).toBe(201);
    const data = create.mock.calls[0][0].data;
    expect(data.subtotal.toFixed(2)).toBe("200.10");
    expect(data.tax.toFixed(2)).toBe("10.01");
    expect(data.total.toFixed(2)).toBe("245.11");
    expect(data.statusHistory.create).toEqual({ status: "PLACED", actorId: "customer-1" });
    expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
  });
});
