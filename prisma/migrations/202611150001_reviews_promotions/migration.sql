-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "promotionSnapshot" JSONB;

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "restaurantId" TEXT,
    "funding" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "maxDiscount" DECIMAL(10,2) NOT NULL,
    "minimumSubtotal" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "usageLimit" INTEGER NOT NULL,
    "perCustomerLimit" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "funding" TEXT NOT NULL,
    "commissionRuleId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "productId" TEXT,
    "targetKey" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderationReason" TEXT,
    "flags" INTEGER NOT NULL DEFAULT 0,
    "editUntil" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceAudit" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommerceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRedemption_orderId_key" ON "PromotionRedemption"("orderId");

-- CreateIndex
CREATE INDEX "PromotionRedemption_promotionId_customerId_idx" ON "PromotionRedemption"("promotionId", "customerId");

-- CreateIndex
CREATE INDEX "PurchaseReview_restaurantId_status_createdAt_idx" ON "PurchaseReview"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseReview_productId_status_idx" ON "PurchaseReview"("productId", "status");

-- CreateIndex
CREATE INDEX "PurchaseReview_customerId_createdAt_idx" ON "PurchaseReview"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReview_orderId_targetKey_key" ON "PurchaseReview"("orderId", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceAudit_eventKey_key" ON "CommerceAudit"("eventKey");

-- CreateIndex
CREATE INDEX "CommerceAudit_entity_entityId_createdAt_idx" ON "CommerceAudit"("entity", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "CommissionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReview" ADD CONSTRAINT "PurchaseReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReview" ADD CONSTRAINT "PurchaseReview_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReview" ADD CONSTRAINT "PurchaseReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReview" ADD CONSTRAINT "PurchaseReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "Order" ADD CONSTRAINT "Order_discount_check" CHECK(discount>=0 AND discount<=subtotal+"deliveryFee");
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_rules_check" CHECK(code ~ '^[A-Z0-9_-]{3,30}$' AND funding IN ('PLATFORM','RESTAURANT') AND target IN ('ITEMS','DELIVERY') AND kind IN ('FIXED','PERCENT') AND value>0 AND (kind<>'PERCENT' OR value<=100) AND "maxDiscount">0 AND "minimumSubtotal">=0 AND "endsAt">"startsAt" AND "usageLimit">0 AND "perCustomerLimit">0 AND "usedCount">=0 AND "usedCount"<="usageLimit" AND version>=0 AND (funding<>'RESTAURANT' OR "restaurantId" IS NOT NULL));
ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_amount_check" CHECK(amount>0 AND funding IN ('PLATFORM','RESTAURANT'));
ALTER TABLE "PurchaseReview" ADD CONSTRAINT "PurchaseReview_rules_check" CHECK(rating BETWEEN 1 AND 5 AND status IN ('PENDING','APPROVED','REJECTED','WITHDRAWN') AND flags>=0 AND version>=0 AND (("productId" IS NULL AND "targetKey"='RESTAURANT') OR ("productId" IS NOT NULL AND "targetKey"='PRODUCT:'||"productId")));
ALTER TABLE "OrderCommission" DROP CONSTRAINT "OrderCommission_money_check";
ALTER TABLE "OrderCommission" ADD CONSTRAINT "OrderCommission_money_check" CHECK("rateBps" BETWEEN 0 AND 10000 AND subtotal>=0 AND discount>=0 AND commission>=0 AND net>=0 AND commission+net=subtotal-discount AND "taxExcluded">=0 AND "deliveryExcluded">=0 AND ((policy='ITEMS_ONLY_V1' AND discount=0) OR policy='POST_TAX_CREDIT_V1'));
CREATE TRIGGER "PromotionRedemption_immutable" BEFORE UPDATE OR DELETE ON "PromotionRedemption" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
CREATE TRIGGER "CommerceAudit_immutable" BEFORE UPDATE OR DELETE ON "CommerceAudit" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
