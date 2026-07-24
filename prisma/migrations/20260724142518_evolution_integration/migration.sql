-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'TENANT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'WHATSAPP_CONNECTED';
ALTER TYPE "AuditAction" ADD VALUE 'WHATSAPP_DISCONNECTED';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_MESSAGE_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_AUTO_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_BULK_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_SYNCED';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "autoCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "groupJid" TEXT,
ADD COLUMN     "inviteCode" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "EvolutionInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "groupIds" TEXT[],
    "sentBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "results" JSONB,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionInstance_tenantId_key" ON "EvolutionInstance"("tenantId");

-- CreateIndex
CREATE INDEX "EvolutionInstance_instanceName_idx" ON "EvolutionInstance"("instanceName");

-- CreateIndex
CREATE INDEX "GroupMessage_tenantId_idx" ON "GroupMessage"("tenantId");

-- CreateIndex
CREATE INDEX "GroupMessage_campaignId_idx" ON "GroupMessage"("campaignId");

-- CreateIndex
CREATE INDEX "GroupMessage_tenantId_sentAt_idx" ON "GroupMessage"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "Group_groupJid_idx" ON "Group"("groupJid");

-- CreateIndex
CREATE INDEX "Lead_groupId_idx" ON "Lead"("groupId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionInstance" ADD CONSTRAINT "EvolutionInstance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
