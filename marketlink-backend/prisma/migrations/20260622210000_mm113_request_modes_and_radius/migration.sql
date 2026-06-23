-- CreateEnum
CREATE TYPE "CustomerRequestIntakeMode" AS ENUM ('SPECIFIC', 'UNSURE');

-- AlterTable
ALTER TABLE "CustomerRequest"
ADD COLUMN "intakeMode" "CustomerRequestIntakeMode" NOT NULL DEFAULT 'SPECIFIC',
ADD COLUMN "subcategoryId" TEXT,
ADD COLUMN "radiusMiles" INTEGER,
ALTER COLUMN "marketingSubjectId" DROP NOT NULL,
ALTER COLUMN "zip" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "CustomerRequest_intakeMode_status_createdAt_idx" ON "CustomerRequest"("intakeMode", "status", "createdAt");
