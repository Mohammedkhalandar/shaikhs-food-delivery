-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmailOutbox" ADD COLUMN     "verificationTokenId" TEXT,
ALTER COLUMN "resetTokenId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "originalEmail" TEXT NOT NULL,
    "authVersion" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountSecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_purpose_expiresAt_idx" ON "EmailVerificationToken"("userId", "purpose", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSecurityEvent_eventKey_key" ON "AccountSecurityEvent"("eventKey");

-- CreateIndex
CREATE INDEX "AccountSecurityEvent_userId_createdAt_idx" ON "AccountSecurityEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_verificationTokenId_key" ON "EmailOutbox"("verificationTokenId");

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_verificationTokenId_fkey" FOREIGN KEY ("verificationTokenId") REFERENCES "EmailVerificationToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSecurityEvent" ADD CONSTRAINT "AccountSecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_one_token" CHECK(("resetTokenId" IS NULL)<>("verificationTokenId" IS NULL));
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_valid" CHECK(purpose IN ('VERIFY','CHANGE') AND "authVersion">=0 AND "tokenHash" ~ '^[a-f0-9]{64}$');
CREATE TRIGGER "AccountSecurityEvent_immutable" BEFORE UPDATE OR DELETE ON "AccountSecurityEvent" FOR EACH ROW EXECUTE FUNCTION shaikhs_financial_immutable();
