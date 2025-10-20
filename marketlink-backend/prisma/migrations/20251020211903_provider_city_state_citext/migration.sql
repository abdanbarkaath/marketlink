-- DropIndex
DROP INDEX "public"."Provider_status_idx";

-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "city" SET DATA TYPE CITEXT,
ALTER COLUMN "state" SET DATA TYPE CITEXT;

-- CreateIndex
CREATE INDEX "Provider_status_createdAt_idx" ON "Provider"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Provider_status_verified_idx" ON "Provider"("status", "verified");

-- CreateIndex
CREATE INDEX "Provider_status_city_idx" ON "Provider"("status", "city");

-- CreateIndex
CREATE INDEX "Provider_status_rating_idx" ON "Provider"("status", "rating");

-- CreateIndex
CREATE INDEX "Provider_status_businessName_idx" ON "Provider"("status", "businessName");
