-- CreateTable
CREATE TABLE "ReviewCase" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reporterId" TEXT,
    "assigneeId" TEXT,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "version" INTEGER NOT NULL DEFAULT 0,
    "resolution" TEXT,
    "publicReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "note" TEXT NOT NULL,
    "evidence" TEXT[],
    "simulatedCredit" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewCaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCase_sourceKey_key" ON "ReviewCase"("sourceKey");

-- CreateIndex
CREATE INDEX "ReviewCase_status_priority_createdAt_idx" ON "ReviewCase"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewCase_orderId_createdAt_idx" ON "ReviewCase"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewCase_reporterId_createdAt_idx" ON "ReviewCase"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewCase_assigneeId_status_idx" ON "ReviewCase"("assigneeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCaseEvent_eventKey_key" ON "ReviewCaseEvent"("eventKey");

-- CreateIndex
CREATE INDEX "ReviewCaseEvent_caseId_createdAt_idx" ON "ReviewCaseEvent"("caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReviewCase" ADD CONSTRAINT "ReviewCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCaseEvent" ADD CONSTRAINT "ReviewCaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ReviewCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "ReviewCase" ADD CONSTRAINT "ReviewCase_state_check" CHECK(status IN ('OPEN','IN_REVIEW','WAITING','RESOLVED','REJECTED') AND priority IN ('LOW','NORMAL','HIGH','URGENT') AND kind IN ('DELIVERY_EXCEPTION','CUSTOMER_COMPLAINT','ORDER_DISPUTE','SETTLEMENT_DISPUTE','REFUND_REQUEST') AND version>=0);
ALTER TABLE "ReviewCaseEvent" ADD CONSTRAINT "ReviewCaseEvent_credit_check" CHECK("simulatedCredit" IS NULL OR ("simulatedCredit">0 AND action='RESOLVE'));
CREATE TRIGGER "ReviewCaseEvent_immutable" BEFORE UPDATE OR DELETE ON "ReviewCaseEvent" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
