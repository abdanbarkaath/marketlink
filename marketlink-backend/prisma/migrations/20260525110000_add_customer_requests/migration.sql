-- CreateEnum
CREATE TYPE "CustomerRequestStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "CustomerRequest" (
    "id" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "customerProfileId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterBusinessName" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "marketingSubjectId" TEXT NOT NULL,
    "serviceTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "zip" TEXT NOT NULL,
    "budgetLabel" TEXT,
    "timelineLabel" TEXT,
    "status" "CustomerRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerRequest_customerUserId_createdAt_idx" ON "CustomerRequest"("customerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerRequest_status_createdAt_idx" ON "CustomerRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerRequest_marketingSubjectId_status_idx" ON "CustomerRequest"("marketingSubjectId", "status");

-- CreateIndex
CREATE INDEX "CustomerRequest_zip_status_idx" ON "CustomerRequest"("zip", "status");

-- AddForeignKey
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "CustomerRequest_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "CustomerRequest_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
