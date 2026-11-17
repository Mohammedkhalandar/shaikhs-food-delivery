import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

type CheckoutInput = {
  restaurantId: string;
  deliveryAddress?: string;
  savedAddressId?: string;
  addressVersion?: number;
  postalCode?: string;
  notes?: string;
  couponCode?: string;
  paymentMethod: string;
  items: { productId: string; quantity: number; variantId?: string; addonIds?: string[] }[];
  policyVersion?: number;
};

/** Hash normalized intent, never client prices. Array order does not change intent. */
export function checkoutHash(input: CheckoutInput) {
  return createHash("sha256").update(JSON.stringify({
    restaurantId: input.restaurantId,
    deliveryAddress: input.savedAddressId ? `saved:${input.savedAddressId}` : input.deliveryAddress ?? "",
    notes: input.notes ?? "",
    paymentMethod: input.paymentMethod,
    ...(input.couponCode?{couponCode:input.couponCode}:{}),
    ...(input.policyVersion!==undefined?{policyVersion:input.policyVersion}:{}),
    ...(input.savedAddressId?{savedAddressId:input.savedAddressId,...(input.addressVersion!==undefined?{addressVersion:input.addressVersion}:{})}:input.postalCode?{postalCode:input.postalCode}:{}),
    items: input.items.map(i=>({productId:i.productId,quantity:i.quantity,...(i.variantId?{variantId:i.variantId}:{}),...(i.addonIds?.length?{addonIds:[...i.addonIds].sort()}:{} )})).sort((a,b)=>JSON.stringify([a.productId,a.variantId??'',a.addonIds??[]]).localeCompare(JSON.stringify([b.productId,b.variantId??'',b.addonIds??[]]))),
  })).digest("hex");
}

export function orderNumber() {
  return `SH-${randomUUID().toUpperCase()}`;
}

/** All authoritative arithmetic stays decimal; round tax once, half up, to paise. */
export function checkoutTotals(lines: { price: Prisma.Decimal; quantity: number }[], policy?: { deliveryFee: Prisma.Decimal; freeThreshold: Prisma.Decimal }) {
  const subtotal = lines.reduce((sum, line) => sum.plus(line.price.times(line.quantity)), new Prisma.Decimal(0));
  const deliveryFee = new Prisma.Decimal(subtotal.greaterThanOrEqualTo(policy?.freeThreshold??499) ? 0 : policy?.deliveryFee??35);
  const tax = subtotal.times("0.05").toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return { subtotal, deliveryFee, tax, total: subtotal.plus(deliveryFee).plus(tax) };
}
