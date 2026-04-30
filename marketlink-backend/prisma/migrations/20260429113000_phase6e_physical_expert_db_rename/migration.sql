-- MM-91
-- Physically rename Provider-backed expert tables, enums, and relation columns
-- to Expert terminology.
--
-- Rollback note:
-- Reverse these renames in the opposite order before any later migration or app
-- deploy depends on the new Expert names. This migration is intentionally rename-
-- only so existing data remains in place.

-- Rename enums first so dependent columns follow the new type names.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProviderStatus')
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpertStatus') THEN
        ALTER TYPE "ProviderStatus" RENAME TO "ExpertStatus";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProviderMediaType')
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpertMediaType') THEN
        ALTER TYPE "ProviderMediaType" RENAME TO "ExpertMediaType";
    END IF;
END $$;

-- Rename the core expert tables.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Provider')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Expert') THEN
        ALTER TABLE "Provider" RENAME TO "Expert";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProviderProject')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ExpertProject') THEN
        ALTER TABLE "ProviderProject" RENAME TO "ExpertProject";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProviderClient')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ExpertClient') THEN
        ALTER TABLE "ProviderClient" RENAME TO "ExpertClient";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProviderMedia')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ExpertMedia') THEN
        ALTER TABLE "ProviderMedia" RENAME TO "ExpertMedia";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProviderReview')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ExpertReview') THEN
        ALTER TABLE "ProviderReview" RENAME TO "ExpertReview";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProviderCertification')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ExpertCertification') THEN
        ALTER TABLE "ProviderCertification" RENAME TO "ExpertCertification";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProviderAward')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ExpertAward') THEN
        ALTER TABLE "ProviderAward" RENAME TO "ExpertAward";
    END IF;
END $$;

-- Rename foreign-key columns from providerId -> expertId.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AdminAction' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'AdminAction' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "AdminAction" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Inquiry' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Inquiry' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "Inquiry" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertProject' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertProject' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "ExpertProject" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertClient' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertClient' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "ExpertClient" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertMedia' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertMedia' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "ExpertMedia" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertReview' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertReview' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "ExpertReview" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertCertification' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertCertification' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "ExpertCertification" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertAward' AND column_name = 'providerId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ExpertAward' AND column_name = 'expertId'
    ) THEN
        ALTER TABLE "ExpertAward" RENAME COLUMN "providerId" TO "expertId";
    END IF;
END $$;

-- Rename table constraints to match the new expert terminology.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Provider_pkey') THEN
        ALTER TABLE "Expert" RENAME CONSTRAINT "Provider_pkey" TO "Expert_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Provider_userId_fkey') THEN
        ALTER TABLE "Expert" RENAME CONSTRAINT "Provider_userId_fkey" TO "Expert_userId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderProject_pkey') THEN
        ALTER TABLE "ExpertProject" RENAME CONSTRAINT "ProviderProject_pkey" TO "ExpertProject_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderProject_providerId_fkey') THEN
        ALTER TABLE "ExpertProject" RENAME CONSTRAINT "ProviderProject_providerId_fkey" TO "ExpertProject_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderClient_pkey') THEN
        ALTER TABLE "ExpertClient" RENAME CONSTRAINT "ProviderClient_pkey" TO "ExpertClient_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderClient_providerId_fkey') THEN
        ALTER TABLE "ExpertClient" RENAME CONSTRAINT "ProviderClient_providerId_fkey" TO "ExpertClient_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderMedia_pkey') THEN
        ALTER TABLE "ExpertMedia" RENAME CONSTRAINT "ProviderMedia_pkey" TO "ExpertMedia_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderMedia_providerId_fkey') THEN
        ALTER TABLE "ExpertMedia" RENAME CONSTRAINT "ProviderMedia_providerId_fkey" TO "ExpertMedia_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderReview_pkey') THEN
        ALTER TABLE "ExpertReview" RENAME CONSTRAINT "ProviderReview_pkey" TO "ExpertReview_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderReview_providerId_fkey') THEN
        ALTER TABLE "ExpertReview" RENAME CONSTRAINT "ProviderReview_providerId_fkey" TO "ExpertReview_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderCertification_pkey') THEN
        ALTER TABLE "ExpertCertification" RENAME CONSTRAINT "ProviderCertification_pkey" TO "ExpertCertification_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderCertification_providerId_fkey') THEN
        ALTER TABLE "ExpertCertification" RENAME CONSTRAINT "ProviderCertification_providerId_fkey" TO "ExpertCertification_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderAward_pkey') THEN
        ALTER TABLE "ExpertAward" RENAME CONSTRAINT "ProviderAward_pkey" TO "ExpertAward_pkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProviderAward_providerId_fkey') THEN
        ALTER TABLE "ExpertAward" RENAME CONSTRAINT "ProviderAward_providerId_fkey" TO "ExpertAward_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminAction_providerId_fkey') THEN
        ALTER TABLE "AdminAction" RENAME CONSTRAINT "AdminAction_providerId_fkey" TO "AdminAction_expertId_fkey";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Inquiry_providerId_fkey') THEN
        ALTER TABLE "Inquiry" RENAME CONSTRAINT "Inquiry_providerId_fkey" TO "Inquiry_expertId_fkey";
    END IF;
END $$;

-- Rename supporting indexes.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_email_key') THEN
        ALTER INDEX "Provider_email_key" RENAME TO "Expert_email_key";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_slug_key') THEN
        ALTER INDEX "Provider_slug_key" RENAME TO "Expert_slug_key";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_status_idx') THEN
        ALTER INDEX "Provider_status_idx" RENAME TO "Expert_status_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_status_createdAt_idx') THEN
        ALTER INDEX "Provider_status_createdAt_idx" RENAME TO "Expert_status_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_status_verified_idx') THEN
        ALTER INDEX "Provider_status_verified_idx" RENAME TO "Expert_status_verified_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_status_city_idx') THEN
        ALTER INDEX "Provider_status_city_idx" RENAME TO "Expert_status_city_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_status_rating_idx') THEN
        ALTER INDEX "Provider_status_rating_idx" RENAME TO "Expert_status_rating_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Provider_status_businessName_idx') THEN
        ALTER INDEX "Provider_status_businessName_idx" RENAME TO "Expert_status_businessName_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'AdminAction_providerId_createdAt_idx') THEN
        ALTER INDEX "AdminAction_providerId_createdAt_idx" RENAME TO "AdminAction_expertId_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'Inquiry_providerId_createdAt_idx') THEN
        ALTER INDEX "Inquiry_providerId_createdAt_idx" RENAME TO "Inquiry_expertId_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderProject_providerId_sortOrder_createdAt_idx') THEN
        ALTER INDEX "ProviderProject_providerId_sortOrder_createdAt_idx" RENAME TO "ExpertProject_expertId_sortOrder_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderProject_providerId_isFeatured_idx') THEN
        ALTER INDEX "ProviderProject_providerId_isFeatured_idx" RENAME TO "ExpertProject_expertId_isFeatured_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderClient_providerId_sortOrder_createdAt_idx') THEN
        ALTER INDEX "ProviderClient_providerId_sortOrder_createdAt_idx" RENAME TO "ExpertClient_expertId_sortOrder_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderClient_providerId_isFeatured_idx') THEN
        ALTER INDEX "ProviderClient_providerId_isFeatured_idx" RENAME TO "ExpertClient_expertId_isFeatured_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderMedia_providerId_type_sortOrder_createdAt_idx') THEN
        ALTER INDEX "ProviderMedia_providerId_type_sortOrder_createdAt_idx" RENAME TO "ExpertMedia_expertId_type_sortOrder_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderReview_providerId_sortOrder_createdAt_idx') THEN
        ALTER INDEX "ProviderReview_providerId_sortOrder_createdAt_idx" RENAME TO "ExpertReview_expertId_sortOrder_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderReview_providerId_verified_publishedAt_idx') THEN
        ALTER INDEX "ProviderReview_providerId_verified_publishedAt_idx" RENAME TO "ExpertReview_expertId_verified_publishedAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderCertification_providerId_sortOrder_createdAt_idx') THEN
        ALTER INDEX "ProviderCertification_providerId_sortOrder_createdAt_idx" RENAME TO "ExpertCertification_expertId_sortOrder_createdAt_idx";
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ProviderAward_providerId_sortOrder_createdAt_idx') THEN
        ALTER INDEX "ProviderAward_providerId_sortOrder_createdAt_idx" RENAME TO "ExpertAward_expertId_sortOrder_createdAt_idx";
    END IF;
END $$;
