-- AlterTable: Identidade do Link (PRO/ULTRA)
ALTER TABLE "Campaign" ADD COLUMN "metaTitle" TEXT,
ADD COLUMN "metaDescription" TEXT,
ADD COLUMN "ogImageUrl" TEXT,
ADD COLUMN "faviconUrl" TEXT;