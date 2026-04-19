-- CreateTable
CREATE TABLE "ProviderReview" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "company" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "communicationRating" DOUBLE PRECISION,
    "qualityRating" DOUBLE PRECISION,
    "valueRating" DOUBLE PRECISION,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "projectSummary" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCertification" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "year" INTEGER,
    "url" TEXT,
    "badgeImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAward" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "year" INTEGER,
    "url" TEXT,
    "badgeImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderReview_providerId_sortOrder_createdAt_idx" ON "ProviderReview"("providerId", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderReview_providerId_verified_publishedAt_idx" ON "ProviderReview"("providerId", "verified", "publishedAt");

-- CreateIndex
CREATE INDEX "ProviderCertification_providerId_sortOrder_createdAt_idx" ON "ProviderCertification"("providerId", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderAward_providerId_sortOrder_createdAt_idx" ON "ProviderAward"("providerId", "sortOrder", "createdAt");

-- AddForeignKey
ALTER TABLE "ProviderReview" ADD CONSTRAINT "ProviderReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCertification" ADD CONSTRAINT "ProviderCertification_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAward" ADD CONSTRAINT "ProviderAward_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
