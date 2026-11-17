-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "restaurantId" TEXT,
    "rateBps" INTEGER,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCommission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "net" DECIMAL(10,2) NOT NULL,
    "taxExcluded" DECIMAL(10,2) NOT NULL,
    "deliveryExcluded" DECIMAL(10,2) NOT NULL,
    "policy" TEXT NOT NULL DEFAULT 'ITEMS_ONLY_V1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionState" (
    "snapshotId" TEXT NOT NULL,
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommissionState_pkey" PRIMARY KEY ("snapshotId")
);

-- CreateTable
CREATE TABLE "CommissionAdjustment" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "netDelta" DECIMAL(10,2) NOT NULL,
    "commissionDelta" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantSettlement" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "reference" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestaurantSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantSettlementLine" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "RestaurantSettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRule_scopeKey_effectiveAt_key" ON "CommissionRule"("scopeKey", "effectiveAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCommission_orderId_key" ON "OrderCommission"("orderId");

-- CreateIndex
CREATE INDEX "OrderCommission_restaurantId_createdAt_idx" ON "OrderCommission"("restaurantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionAdjustment_eventKey_key" ON "CommissionAdjustment"("eventKey");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_snapshotId_createdAt_idx" ON "CommissionAdjustment"("snapshotId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettlement_reversalOfId_key" ON "RestaurantSettlement"("reversalOfId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettlement_reference_key" ON "RestaurantSettlement"("reference");

-- CreateIndex
CREATE INDEX "RestaurantSettlement_restaurantId_createdAt_idx" ON "RestaurantSettlement"("restaurantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettlementLine_settlementId_snapshotId_key" ON "RestaurantSettlementLine"("settlementId", "snapshotId");

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCommission" ADD CONSTRAINT "OrderCommission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCommission" ADD CONSTRAINT "OrderCommission_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCommission" ADD CONSTRAINT "OrderCommission_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CommissionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionState" ADD CONSTRAINT "CommissionState_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "OrderCommission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "OrderCommission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSettlement" ADD CONSTRAINT "RestaurantSettlement_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSettlementLine" ADD CONSTRAINT "RestaurantSettlementLine_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "RestaurantSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantSettlementLine" ADD CONSTRAINT "RestaurantSettlementLine_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "OrderCommission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Append-only financial evidence; no legacy orders are repriced/backfilled.
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_scope_check" CHECK (("restaurantId" IS NULL AND "scopeKey"='PLATFORM' AND "rateBps" IS NOT NULL) OR ("restaurantId" IS NOT NULL AND "scopeKey"="restaurantId")), ADD CONSTRAINT "CommissionRule_rate_check" CHECK("rateBps" BETWEEN 0 AND 10000);
ALTER TABLE "OrderCommission" ADD CONSTRAINT "OrderCommission_money_check" CHECK("rateBps" BETWEEN 0 AND 10000 AND subtotal>=0 AND discount=0 AND commission>=0 AND net>=0 AND commission+net=subtotal-discount AND "taxExcluded">=0 AND "deliveryExcluded">=0 AND policy='ITEMS_ONLY_V1');
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_kind_check" CHECK(kind IN ('MANUAL','CANCELLED','REFUNDED','DISPUTE_OPEN','DISPUTE_RESOLVE'));
ALTER TABLE "RestaurantSettlement" ADD CONSTRAINT "RestaurantSettlement_kind_check" CHECK(mode IN ('SIMULATED','MANUAL_RECEIPT') AND direction IN ('RECORD','REVERSE') AND amount>=0 AND ((direction='RECORD' AND "reversalOfId" IS NULL) OR (direction='REVERSE' AND "reversalOfId" IS NOT NULL)));
ALTER TABLE "RestaurantSettlement" ADD CONSTRAINT "RestaurantSettlement_reversal_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "RestaurantSettlement"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE FUNCTION shaikhs_financial_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Financial evidence is append-only'; END $$;
CREATE TRIGGER "CommissionRule_immutable" BEFORE UPDATE OR DELETE ON "CommissionRule" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
CREATE TRIGGER "OrderCommission_immutable" BEFORE UPDATE OR DELETE ON "OrderCommission" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
CREATE TRIGGER "CommissionAdjustment_immutable" BEFORE UPDATE OR DELETE ON "CommissionAdjustment" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
CREATE TRIGGER "RestaurantSettlement_immutable" BEFORE UPDATE OR DELETE ON "RestaurantSettlement" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
CREATE TRIGGER "RestaurantSettlementLine_immutable" BEFORE UPDATE OR DELETE ON "RestaurantSettlementLine" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
INSERT INTO "CommissionRule" (id,"scopeKey","rateBps","effectiveAt",reason,"actorId") VALUES ('platform-commission-zero-v1','PLATFORM',0,'1970-01-01','Unconfigured commercial rate: zero until explicitly scheduled','SYSTEM');
