ALTER TYPE "LocationPrecision" ADD VALUE 'private';
ALTER TABLE "Expert" ALTER COLUMN "locationPrecision" SET DEFAULT 'approximate',
  ADD COLUMN "publicCityLatitude" DOUBLE PRECISION, ADD COLUMN "publicCityLongitude" DOUBLE PRECISION;
CREATE TABLE "ExpertPublicationConfirmation" (
  "id" TEXT PRIMARY KEY, "expertId" TEXT NOT NULL, "confirmedBy" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "content" JSONB NOT NULL,
  CONSTRAINT "ExpertPublicationConfirmation_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ExpertPublicationConfirmation_expertId_confirmedAt_idx" ON "ExpertPublicationConfirmation"("expertId", "confirmedAt");
