/**
 * Tipos locais extraídos do schema Prisma.
 * Evita dependência da cadeia de re-exports do @prisma/client
 * que o Turbopack do Next.js 16 não consegue resolver.
 */

export type Plan = "FREE" | "PRO" | "ULTRA";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "OTP_SENT"
  | "OTP_VERIFIED"
  | "TENANT_CREATED"
  | "TENANT_SWITCHED"
  | "TENANT_UPDATED"
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_UPDATED"
  | "CAMPAIGN_DELETED"
  | "GROUP_CREATED"
  | "GROUP_UPDATED"
  | "GROUP_DELETED"
  | "LEAD_CREATED"
  | "LEAD_EXPORTED"
  | "USER_INVITED"
  | "USER_REMOVED"
  | "PLAN_CHANGED"
  | "EMAIL_CHANGED";

/**
 * Tipo simplificado para InputJsonValue do Prisma.
 * Usado no audit log para armazenar detalhes como JSON.
 */
export type InputJsonValue =
  | string
  | number
  | boolean
  | null
  | InputJsonValue[]
  | { [key: string]: InputJsonValue };