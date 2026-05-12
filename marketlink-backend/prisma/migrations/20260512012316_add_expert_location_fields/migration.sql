-- CreateEnum
CREATE TYPE "LocationPrecision" AS ENUM ('exact', 'approximate');

-- AlterTable
ALTER TABLE "Expert" ADD COLUMN     "geocodeProvider" TEXT,
ADD COLUMN     "geocodedAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationPrecision" "LocationPrecision" NOT NULL DEFAULT 'exact',
ADD COLUMN     "longitude" DOUBLE PRECISION;
