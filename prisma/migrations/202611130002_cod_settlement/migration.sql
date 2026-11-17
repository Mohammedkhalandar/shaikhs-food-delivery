-- Additive receipt ledger. Delivery alone does not mark cash as received.
CREATE TABLE "CodSettlement" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "receivedById" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CodSettlement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CodSettlement_amount_check" CHECK ("amount" > 0)
);
CREATE UNIQUE INDEX "CodSettlement_orderId_key" ON "CodSettlement"("orderId");
CREATE UNIQUE INDEX "CodSettlement_reference_key" ON "CodSettlement"("reference");
ALTER TABLE "CodSettlement" ADD CONSTRAINT "CodSettlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
