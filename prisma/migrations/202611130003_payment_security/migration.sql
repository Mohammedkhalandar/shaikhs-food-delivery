-- Additive payment inbox, receipt state and security counters; no legacy rows rewritten.
CREATE TABLE "OnlinePayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "amountPaise" BIGINT NOT NULL CHECK ("amountPaise" > 0 AND "amountPaise" <= 9999999999),
  "providerOrderId" TEXT UNIQUE,
  "providerPaymentId" TEXT UNIQUE,
  "state" TEXT NOT NULL DEFAULT 'CREATING' CHECK ("state" IN ('CREATING','PENDING','FAILED','EXPIRED','CAPTURED','REFUNDED')),
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "PaymentRefund" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL UNIQUE REFERENCES "OnlinePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "amountPaise" BIGINT NOT NULL CHECK ("amountPaise" > 0 AND "amountPaise" <= 9999999999),
  "providerRefundId" TEXT UNIQUE,
  "state" TEXT NOT NULL DEFAULT 'REQUESTED' CHECK ("state" IN ('REQUESTED','PROCESSED','FAILED')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "PaymentEvent" (
  "eventId" TEXT NOT NULL PRIMARY KEY,
  "bodyHash" TEXT NOT NULL UNIQUE,
  "kind" TEXT NOT NULL,
  "paymentId" TEXT,
  "outcome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "PaymentAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PaymentAudit_paymentId_createdAt_idx" ON "PaymentAudit"("paymentId","createdAt");
CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "hits" INTEGER NOT NULL CHECK ("hits" > 0),
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
