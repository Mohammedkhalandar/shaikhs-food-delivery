-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "lifecycle" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "lifecycleReason" TEXT,
ADD COLUMN     "lifecycleVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RestaurantApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" VARCHAR(6) NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantApplication_applicantId_key" ON "RestaurantApplication"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantApplication_restaurantId_key" ON "RestaurantApplication"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantApplication_status_createdAt_idx" ON "RestaurantApplication"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAction_eventKey_key" ON "AdminAction"("eventKey");

-- CreateIndex
CREATE INDEX "AdminAction_targetType_targetId_createdAt_idx" ON "AdminAction"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");

-- AddForeignKey
ALTER TABLE "RestaurantApplication" ADD CONSTRAINT "RestaurantApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantApplication" ADD CONSTRAINT "RestaurantApplication_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "User" ADD CONSTRAINT "User_adminVersion_check" CHECK("adminVersion">=0);
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_lifecycle_check" CHECK(lifecycle IN ('ACTIVE','INACTIVE','SUSPENDED') AND "lifecycleVersion">=0);
ALTER TABLE "RestaurantApplication" ADD CONSTRAINT "RestaurantApplication_state_check" CHECK(status IN ('PENDING','APPROVED','REJECTED') AND version>=0 AND "postalCode" ~ '^[1-9][0-9]{5}$' AND ((status='APPROVED' AND "restaurantId" IS NOT NULL) OR (status<>'APPROVED' AND "restaurantId" IS NULL)));
CREATE TRIGGER "AdminAction_immutable" BEFORE UPDATE OR DELETE ON "AdminAction" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
