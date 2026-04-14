-- CreateEnum
CREATE TYPE "ProviderMediaType" AS ENUM ('logo', 'cover', 'gallery', 'video');

-- CreateTable
CREATE TABLE "ProviderProject" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "challenge" TEXT,
    "solution" TEXT,
    "results" TEXT,
    "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "projectBudget" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "coverImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderClient" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderMedia" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" "ProviderMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderProject_providerId_sortOrder_createdAt_idx" ON "ProviderProject"("providerId", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderProject_providerId_isFeatured_idx" ON "ProviderProject"("providerId", "isFeatured");

-- CreateIndex
CREATE INDEX "ProviderClient_providerId_sortOrder_createdAt_idx" ON "ProviderClient"("providerId", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderClient_providerId_isFeatured_idx" ON "ProviderClient"("providerId", "isFeatured");

-- CreateIndex
CREATE INDEX "ProviderMedia_providerId_type_sortOrder_createdAt_idx" ON "ProviderMedia"("providerId", "type", "sortOrder", "createdAt");

-- AddForeignKey
ALTER TABLE "ProviderProject" ADD CONSTRAINT "ProviderProject_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderClient" ADD CONSTRAINT "ProviderClient_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderMedia" ADD CONSTRAINT "ProviderMedia_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
