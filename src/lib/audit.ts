import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

/**
 * Registra uma ação no audit log.
 *
 * Segurança S8: todas as ações críticas são registradas com IP, userId e tenantId.
 * Isso garante rastreabilidade completa (non-repudiation).
 *
 * O audit log NUNCA deve quebrar a operação principal — erros são apenas logados.
 */
export async function logAudit(
  action: AuditAction,
  details?: Record<string, unknown>,
  userId?: string,
  tenantId?: string
): Promise<void> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("cf-connecting-ip") ||
      "unknown";

    await prisma.auditLog.create({
      data: {
        action,
        details: details as Prisma.InputJsonValue | undefined,
        ip,
        userId: userId ?? null,
        tenantId: tenantId ?? null,
      },
    });
  } catch (error) {
    // Audit log nunca deve quebrar a operação principal
    console.error("Failed to write audit log:", error);
  }
}
