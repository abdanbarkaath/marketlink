-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('pending', 'active', 'disabled');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('APPROVE', 'VERIFY_ON', 'VERIFY_OFF', 'DISABLE', 'ENABLE', 'EDIT');

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "disabledReason" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "ProviderStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "providerId" TEXT NOT NULL,
    "type" "AdminActionType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAction_providerId_createdAt_idx" ON "AdminAction"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "Provider_status_idx" ON "Provider"("status");

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
