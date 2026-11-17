-- Indexed lookup for immutable order-to-settlement allocations; no data changes.
CREATE INDEX "RestaurantSettlementLine_snapshotId_idx" ON "RestaurantSettlementLine"("snapshotId");
