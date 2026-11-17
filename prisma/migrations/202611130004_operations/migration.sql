-- Additive operations metadata; existing rows retain all original values.
ALTER TABLE "Restaurant" ADD COLUMN "weeklyHours" JSONB, ADD COLUMN "closedUntil" TIMESTAMP(3), ADD COLUMN "operationsVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "preparationMinutes" INTEGER, ADD COLUMN "expectedReadyAt" TIMESTAMP(3), ADD COLUMN "riderAcceptedAt" TIMESTAMP(3), ADD COLUMN "pickupCode" TEXT, ADD COLUMN "deliveryCode" TEXT, ADD COLUMN "deliveryIssue" TEXT, ADD COLUMN "operationsVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD CONSTRAINT "Order_preparationMinutes_check" CHECK ("preparationMinutes" IS NULL OR "preparationMinutes" BETWEEN 5 AND 180), ADD CONSTRAINT "Order_verificationCodes_check" CHECK (("pickupCode" IS NULL OR "pickupCode" ~ '^[0-9]{6}$') AND ("deliveryCode" IS NULL OR "deliveryCode" ~ '^[0-9]{6}$')), ADD CONSTRAINT "Order_deliveryIssue_check" CHECK ("deliveryIssue" IS NULL OR "deliveryIssue" IN ('CUSTOMER_UNAVAILABLE','ADDRESS_ISSUE','FAILED_DELIVERY'));
ALTER TABLE "OrderStatusEvent" ADD COLUMN "note" TEXT;
CREATE TABLE "OrderOperationEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderOperationEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderOperationEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "OrderOperationEvent_orderId_createdAt_idx" ON "OrderOperationEvent"("orderId", "createdAt");
