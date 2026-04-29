-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InquiryStatus') THEN
        CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpertType') THEN
        CREATE TYPE "ExpertType" AS ENUM ('agency', 'freelancer', 'creator', 'specialist');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Provider"
ADD COLUMN IF NOT EXISTS "expertType" "ExpertType",
ADD COLUMN IF NOT EXISTS "creatorPlatforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "creatorAudienceSize" INTEGER,
ADD COLUMN IF NOT EXISTS "creatorProofSummary" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Inquiry_providerId_createdAt_idx" ON "Inquiry"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Inquiry_providerId_fkey'
    ) THEN
        ALTER TABLE "Inquiry"
        ADD CONSTRAINT "Inquiry_providerId_fkey"
        FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
