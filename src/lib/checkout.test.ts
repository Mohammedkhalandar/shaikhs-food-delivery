import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { checkoutHash, checkoutTotals, orderNumber } from "./checkout";

describe("checkout integrity", () => {
  it("calculates paise exactly and rounds half-up once", () => {
    const totals = checkoutTotals([{ price: new Prisma.Decimal("0.10"), quantity: 3 }]);
    expect(totals.subtotal.toFixed(2)).toBe("0.30");
    expect(totals.tax.toFixed(2)).toBe("0.02");
    expect(totals.total.toFixed(2)).toBe("35.32");
  });

  it("applies free delivery at the configured threshold", () => {
    expect(checkoutTotals([{ price: new Prisma.Decimal("498.99"), quantity: 1 }]).deliveryFee.toString()).toBe("35");
    expect(checkoutTotals([{ price: new Prisma.Decimal("499.00"), quantity: 1 }]).total.toFixed(2)).toBe("523.95");
  });

  it("binds keys to all checkout intent while ignoring item order", () => {
    const input = { restaurantId: "r", deliveryAddress: "address", paymentMethod: "CASH_ON_DELIVERY", items: [{ productId: "a", quantity: 1 }, { productId: "b", quantity: 2 }] };
    expect(checkoutHash(input)).toBe(checkoutHash({ ...input, items: [...input.items].reverse() }));
    expect(checkoutHash(input)).not.toBe(checkoutHash({ ...input, deliveryAddress: "other address" }));
    expect(checkoutHash(input)).not.toBe(checkoutHash({ ...input, notes: "allergy" }));
    expect(checkoutHash(input)).not.toBe(checkoutHash({ ...input, items: [{ productId: "a", quantity: 2 }] }));
  });

  it("uses UUID-based identifiers rather than clock precision", () => {
    const ids = Array.from({ length: 1000 }, orderNumber);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toMatch(/^SH-[A-F0-9]{8}-[A-F0-9]{4}-4[A-F0-9]{3}-[89AB][A-F0-9]{3}-[A-F0-9]{12}$/);
  });
});
