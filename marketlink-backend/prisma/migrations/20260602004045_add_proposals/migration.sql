-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priceLabel" TEXT,
    "timelineLabel" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_requestId_status_createdAt_idx" ON "Proposal"("requestId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_expertId_status_createdAt_idx" ON "Proposal"("expertId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_requestId_expertId_key" ON "Proposal"("requestId", "expertId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomerRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
