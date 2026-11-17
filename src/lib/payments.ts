import {eventCase,resolvedEventCases} from './review-cases';
import {restoreStock} from './inventory';
import {reverseCommission} from '@/lib/commissions';
import { createHash } from "node:crypto";
import { Prisma, type OnlinePayment } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createProviderOrder, recoverProviderOrder, fetchOrderPayments, fetchRefunds, createProviderRefund, PaymentError, testPaymentConfig, toPaise, type ProviderPayment, type ProviderRefund } from "@/lib/razorpay";

type Tx = Prisma.TransactionClient;
type Actor = { id: string; role: string };
export const paymentDTO = (p: OnlinePayment) => ({ id: p.id, orderId: p.orderId, amount: Number(p.amountPaise), currency: "INR", providerOrderId: p.providerOrderId, state: p.state, needsReview: p.needsReview });

async function lock(tx: Tx, paymentId: string) {
  await tx.$queryRaw`SELECT id FROM "OnlinePayment" WHERE id = ${paymentId} FOR UPDATE`;
  const payment = await tx.onlinePayment.findUniqueOrThrow({ where: { id: paymentId } });
  await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${payment.orderId} FOR UPDATE`;
  const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
  return { payment, order };
}
async function audit(tx: Tx, paymentId: string, action: string, actorId?: string) {
  await tx.paymentAudit.create({ data: { paymentId, action, actorId } });
  if(action.includes('REVIEW')||action.endsWith('REFUND_REQUESTED')||action.endsWith('REFUND_FAILED')||action==='ORDER_CREATION_UNRESOLVED'){const payment=await tx.onlinePayment.findUniqueOrThrow({where:{id:paymentId}});await eventCase(tx,{orderId:payment.orderId,kind:action==='ORDER_CREATION_UNRESOLVED'?'ORDER_DISPUTE':'REFUND_REQUEST',sourceKey:'payment-review:'+paymentId+':'+action,summary:'Verified payment evidence requires operator review',evidence:['PAYMENT:'+paymentId]});}
}
async function review(tx: Tx, paymentId: string, action: string) {
  await tx.onlinePayment.update({ where: { id: paymentId }, data: { needsReview: true } });
  await audit(tx, paymentId, action);
  return "REVIEW_REQUIRED";
}
async function unresolvedCreation(paymentId: string, actorId: string) {
  await prisma.$transaction(async tx => {
    const changed = await tx.onlinePayment.updateMany({ where: { id: paymentId, state: "CREATING", needsReview: false }, data: { needsReview: true } });
    if (changed.count) await audit(tx, paymentId, "ORDER_CREATION_UNRESOLVED", actorId);
  });
}

export async function accessiblePayment(id: string, actor: Actor) {
  if (!["ADMIN", "CUSTOMER"].includes(actor.role)) throw new PaymentError(403, "Payment access denied");
  const payment = await prisma.onlinePayment.findFirst({ where: { id, ...(actor.role === "ADMIN" ? {} : { order: { customerId: actor.id } }) } });
  if (!payment) throw new PaymentError(404, "Payment not found");
  return payment;
}

export async function openPayment(orderId: string, actor: Actor) {
  const config = testPaymentConfig();
  if (actor.role !== "CUSTOMER") throw new PaymentError(403, "Customer access required");
  let isNew = false;
  const payment = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findFirst({ where: { id: orderId, customerId: actor.id } });
    if (!order) throw new PaymentError(404, "Order not found");
    if (order.paymentMethod !== "ONLINE" || order.status !== "PLACED" || order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED") throw new PaymentError(409, "Order is not eligible for payment");
    const existing = await tx.onlinePayment.findUnique({ where: { orderId } });
    if (existing) return existing;
    const created = await tx.onlinePayment.create({ data: { orderId, amountPaise: BigInt(toPaise(order.total)) } });
    await audit(tx, created.id, "ORDER_CREATION_STARTED", actor.id);
    isNew = true;
    return created;
  });
  if (payment.state === "EXPIRED" || payment.state === "REFUNDED") throw new PaymentError(409, "Payment is no longer payable");
  if (payment.providerOrderId) return { ...paymentDTO(payment), keyId: config.keyId };
  try {
  // Never blindly POST again after an ambiguous create/timeout. Recover the durable receipt.
  const remote = isNew ? await createProviderOrder(payment.id, Number(payment.amountPaise)) : await recoverProviderOrder(payment.id);
  if (remote.receipt !== payment.id || remote.amount !== Number(payment.amountPaise)) throw new PaymentError(409, "Provider order does not match the payment");
  const result = await prisma.$transaction(async tx => {
    const { payment: latest } = await lock(tx, payment.id);
    if (latest.providerOrderId && latest.providerOrderId !== remote.id) throw new PaymentError(409, "Provider order binding conflict");
    const updated = await tx.onlinePayment.update({ where: { id: payment.id }, data: { providerOrderId: remote.id, ...(latest.state === "CREATING" ? { state: "PENDING", needsReview: false } : {}) } });
    await audit(tx, payment.id, isNew ? "ORDER_CREATED" : "ORDER_RECOVERED", actor.id);
    return updated;
  });
  return { ...paymentDTO(result), keyId: config.keyId };
  } catch (error) { await unresolvedCreation(payment.id, actor.id); throw error; }
}

async function matchPayment(tx: Tx, entity: ProviderPayment) {
  const found = await tx.onlinePayment.findUnique({ where: { providerOrderId: entity.order_id } });
  if (!found) throw new PaymentError(503, "Payment order is unresolved; retry after reconciliation");
  const result = await lock(tx, found.id);
  if (entity.amount !== Number(result.payment.amountPaise) || entity.currency !== "INR" || result.order.paymentMethod !== "ONLINE" || toPaise(result.order.total) !== entity.amount) throw new PaymentError(409, "Payment amount or order mismatch");
  return result;
}

export async function applyPayment(tx: Tx, entity: ProviderPayment, actorId?: string) {
  const { payment, order } = await matchPayment(tx, entity);
  if (entity.status === "captured" || entity.status === "refunded") {
    if (payment.providerPaymentId && payment.providerPaymentId !== entity.id) return review(tx, payment.id, "ADDITIONAL_CAPTURE_REQUIRES_REVIEW");
    if (payment.state === "REFUNDED" || payment.state === "CAPTURED") return "UNCHANGED";
    await tx.onlinePayment.update({ where: { id: payment.id }, data: { providerPaymentId: entity.id, state: "CAPTURED", needsReview: payment.needsReview || order.status === "CANCELLED" } });
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
    await audit(tx, payment.id, order.status === "CANCELLED" ? "LATE_CAPTURE_REQUIRES_REFUND_REVIEW" : "CAPTURED", actorId);
    return "CAPTURED";
  }
  if (entity.status === "failed" && ["CREATING", "PENDING", "FAILED"].includes(payment.state)) {
    await tx.onlinePayment.update({ where: { id: payment.id }, data: { state: "FAILED" } });
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    await audit(tx, payment.id, "ATTEMPT_FAILED", actorId);
    return "FAILED";
  }
  return "UNCHANGED"; // authorized is not captured; late failures cannot undo captured/refunded money.
}

export async function applyRefund(tx: Tx, entity: ProviderRefund, providerPayment: ProviderPayment, actorId?: string) {
  const { payment, order } = await matchPayment(tx, providerPayment);
  if (entity.payment_id !== providerPayment.id) throw new PaymentError(409, "Refund payment mismatch");
  if (entity.amount !== Number(payment.amountPaise)) return review(tx, payment.id, "PARTIAL_REFUND_REQUIRES_REVIEW");
  if (payment.providerPaymentId && payment.providerPaymentId !== entity.payment_id) return review(tx, payment.id, "REFUND_PAYMENT_REQUIRES_REVIEW");
  const previous = await tx.paymentRefund.findUnique({ where: { paymentId: payment.id } });
  if (previous?.providerRefundId && previous.providerRefundId !== entity.id) return review(tx, payment.id, "ADDITIONAL_REFUND_REQUIRES_REVIEW");
  if (previous?.state === "PROCESSED") return "UNCHANGED";
  const state = entity.status === "processed" ? "PROCESSED" : entity.status === "failed" ? "FAILED" : "REQUESTED";
  if (previous?.state === "FAILED" && state === "REQUESTED") return "UNCHANGED";
  await tx.paymentRefund.upsert({ where: { paymentId: payment.id }, create: { paymentId: payment.id, amountPaise: payment.amountPaise, providerRefundId: entity.id, state }, update: { providerRefundId: entity.id, state } });
  if (state === "PROCESSED") {
    await tx.onlinePayment.update({ where: { id: payment.id }, data: { state: "REFUNDED", providerPaymentId: entity.payment_id } });
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED" } });
    await reverseCommission(tx,order.id,"REFUNDED",actorId);
    await restoreStock(tx,order.id,order.status,actorId??"SYSTEM","Verified full refund before acceptance");
  }
  await audit(tx, payment.id, `${!["captured", "refunded"].includes(providerPayment.status) ? "AUTO_" : ""}REFUND_${state}`, actorId);
  if(state==='PROCESSED')await resolvedEventCases(tx,order.id,'REFUND_REQUEST','VERIFIED_FULL_REFUND');
  return `REFUND_${state}`;
}

export async function refundPayment(id: string, actor: Actor) {
  testPaymentConfig();
  if (actor.role !== "ADMIN") throw new PaymentError(403, "Admin access required");
  const reserved = await prisma.$transaction(async tx => {
    const { payment } = await lock(tx, id);
    const previous = await tx.paymentRefund.findUnique({ where: { paymentId: id } });
    if (previous?.state === "REQUESTED" && payment.needsReview) throw new PaymentError(409, "Refund requires manual review");
    if (previous) return { payment, refund: previous };
    if (payment.state !== "CAPTURED" || !payment.providerPaymentId || payment.needsReview) throw new PaymentError(409, "Payment is not eligible for automatic full refund");
    const refund = await tx.paymentRefund.create({ data: { paymentId: id, amountPaise: payment.amountPaise } });
    await audit(tx, id, "REFUND_REQUESTED", actor.id);
    return { payment, refund };
  });
  if (reserved.refund.state !== "REQUESTED") return { id: reserved.refund.id, state: reserved.refund.state };
  if (!reserved.payment.providerPaymentId || !reserved.payment.providerOrderId) throw new PaymentError(409, "Missing provider payment");
  const remote = await createProviderRefund(reserved.payment.providerPaymentId, Number(reserved.refund.amountPaise), reserved.refund.id);
  const entity: ProviderPayment = { id: reserved.payment.providerPaymentId, order_id: reserved.payment.providerOrderId, amount: Number(reserved.payment.amountPaise), currency: "INR", status: "captured" };
  await prisma.$transaction(tx => applyRefund(tx, remote, entity, actor.id));
  const latest = await prisma.paymentRefund.findUniqueOrThrow({ where: { id: reserved.refund.id } });
  return { id: latest.id, state: latest.state };
}

export async function reconcilePayment(id: string, actor: Actor) {
  const payment = await accessiblePayment(id, actor);
  if (!payment.providerOrderId) {
    if (payment.state !== "CREATING") throw new PaymentError(409, "Unbound payment requires manual review");
    try {
    const remote = await recoverProviderOrder(payment.id);
    if (remote.receipt !== payment.id || remote.amount !== Number(payment.amountPaise)) throw new PaymentError(409, "Provider receipt mismatch");
    await prisma.onlinePayment.updateMany({ where: { id, providerOrderId: null, state: "CREATING" }, data: { providerOrderId: remote.id, state: "PENDING", needsReview: false } });
    return reconcilePayment(id, actor);
    } catch (error) { await unresolvedCreation(id, actor.id); throw error; }
  }
  const entities = await fetchOrderPayments(payment.providerOrderId);
  if (entities.some(entity => entity.order_id !== payment.providerOrderId)) throw new PaymentError(409, "Provider returned payments for another order");
  const captured = entities.filter(p => ["captured", "refunded"].includes(p.status));
  for (const entity of captured.length ? captured : entities.filter(p => p.status === "failed")) {
    // Fetch refund state before applying captures, so an old capture cannot undo a refund.
    const refunds = captured.includes(entity) ? await fetchRefunds(entity.id) : [];
    await prisma.$transaction(async tx => {
      await applyPayment(tx, entity, actor.id);
      for (const refund of refunds) await applyRefund(tx, refund, entity, actor.id);
    });
  }
  if (captured.length === 0 && !entities.some(entity=>["authorized","created"].includes(entity.status)) && payment.createdAt.getTime() < Date.now() - 30 * 60 * 1000) {
    await prisma.$transaction(async tx => {
      const { payment: latest, order } = await lock(tx, id);
      if (!["CREATING", "PENDING", "FAILED"].includes(latest.state)) return;
      await tx.onlinePayment.update({ where: { id }, data: { state: "EXPIRED" } });
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", ...(order.status === "PLACED" ? { status: "CANCELLED", statusHistory: { create: { status: "CANCELLED", actorId: actor.id } } } : {}) } });
      await restoreStock(tx,order.id,order.status,actor.id,"Verified unpaid expiry before acceptance");
      if(order.status==="PLACED")await reverseCommission(tx,order.id,"CANCELLED",actor.id);
      await audit(tx, id, "ABANDONED_EXPIRED", actor.id);
    });
  }
  return { ...paymentDTO(await prisma.onlinePayment.findUniqueOrThrow({ where: { id } })), awaitingCapture: entities.some(entity => ["authorized", "created"].includes(entity.status)) };
}

export async function processPaymentEvent(eventId: string, raw: Buffer, kind: string, entity?: ProviderPayment, refund?: ProviderRefund) {
  const bodyHash = createHash("sha256").update(raw).digest("hex");
  try {
    return await prisma.$transaction(async tx => {
      await tx.paymentEvent.create({ data: { eventId, bodyHash, kind, outcome: "PROCESSING" } });
      let outcome = "IGNORED";
      if (entity && refund) outcome = await applyRefund(tx, refund, entity);
      else if (entity) outcome = await applyPayment(tx, entity);
      const payment = entity ? await tx.onlinePayment.findUnique({ where: { providerOrderId: entity.order_id } }) : null;
      await tx.paymentEvent.update({ where: { eventId }, data: { outcome, paymentId: payment?.id } });
      return { duplicate: false, outcome };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const previous = await prisma.paymentEvent.findFirst({ where: { OR: [{ eventId }, { bodyHash }] } });
      if (previous?.bodyHash === bodyHash) return { duplicate: true, outcome: previous.outcome };
      throw new PaymentError(409, "Webhook event identifier conflict");
    }
    throw error;
  }
}

export async function processedPaymentEvent(eventId: string, raw: Buffer) {
  const bodyHash = createHash("sha256").update(raw).digest("hex");
  const previous = await prisma.paymentEvent.findFirst({ where: { OR: [{ eventId }, { bodyHash }] } });
  if (!previous) return null;
  if (previous.bodyHash !== bodyHash) throw new PaymentError(409, "Webhook event identifier conflict");
  return { duplicate: true, outcome: previous.outcome };
}
