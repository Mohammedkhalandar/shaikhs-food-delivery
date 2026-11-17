-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockTracked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "stockQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockTracked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stockKey" TEXT NOT NULL,
    "productId" TEXT,
    "optionId" TEXT,
    "quantity" INTEGER NOT NULL,
    "restoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "productId" TEXT,
    "optionId" TEXT,
    "orderId" TEXT,
    "eventKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "beforeQuantity" INTEGER NOT NULL,
    "afterQuantity" INTEGER NOT NULL,
    "beforeTracked" BOOLEAN NOT NULL,
    "afterTracked" BOOLEAN NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_orderId_stockKey_key" ON "StockReservation"("orderId", "stockKey");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_eventKey_key" ON "StockMovement"("eventKey");

-- CreateIndex
CREATE INDEX "StockMovement_restaurantId_createdAt_idx" ON "StockMovement"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_optionId_createdAt_idx" ON "StockMovement"("optionId", "createdAt");

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_check" CHECK("stockQuantity">=0 AND "stockVersion">=0);
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_stock_check" CHECK("stockQuantity">=0 AND "stockVersion">=0);
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_quantity_check" CHECK(quantity>0 AND (("productId" IS NOT NULL AND "optionId" IS NULL AND "stockKey"='P:'||"productId") OR ("productId" IS NULL AND "optionId" IS NOT NULL AND "stockKey"='O:'||"optionId")));
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_quantity_check" CHECK("beforeQuantity">=0 AND "afterQuantity">=0 AND "afterQuantity"="beforeQuantity"+delta AND (("productId" IS NULL)<>("optionId" IS NULL)) AND kind IN ('SET','RESERVE','RESTORE'));
CREATE TRIGGER "StockMovement_immutable" BEFORE UPDATE OR DELETE ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
