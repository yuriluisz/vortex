import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;

// 🔒 S4: Validar JWT_SECRET no startup
if (!secretKey) {
  throw new Error(
    "JWT_SECRET environment variable is required. " +
    "Generate a secure random key with: openssl rand -base64 32"
  );
}

const encodedKey = new TextEncoder().encode(secretKey);

const COOKIE_NAME = "vortex_admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export interface SessionPayload {
  userId: string;
  email: string;
  tenantId: string | null;
  tenantSlug: string | null;
  plan: string | null;
  role: string;
  expiresAt: Date;
  [key: string]: unknown;
}

/**
 * Criptografa o payload em um JWT HS256.
 * Inclui issuer e audience para validação adicional.
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setIssuer("vortex")
    .setAudience("vortex-admin")
    .sign(encodedKey);
}

/**
 * Decripta e valida o JWT da sessão.
 * Retorna null se inválido, expirado, ou com issuer/audience incorretos.
 */
export async function decrypt(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
      issuer: "vortex",
      audience: "vortex-admin",
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Cria uma nova sessão JWT e define o cookie httpOnly.
 */
export async function createSession(
  userId: string,
  email: string,
  tenantId: string,
  tenantSlug: string,
  plan: string,
  role: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({
    userId,
    email,
    tenantId,
    tenantSlug,
    plan,
    role,
    expiresAt,
  });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Troca de tenant sem re-login.
 * Regenera a sessão (previne session fixation — S6).
 */
export async function switchTenantSession(
  userId: string,
  email: string,
  tenantId: string,
  tenantSlug: string,
  plan: string,
  role: string
): Promise<void> {
  // Deletar sessão antiga primeiro (previne session fixation)
  await deleteSession();
  // Criar nova sessão com o novo tenant
  await createSession(userId, email, tenantId, tenantSlug, plan, role);
}

/**
 * Deleta o cookie de sessão (logout).
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Retorna a sessão atual do cookie.
 * Retorna null se não autenticado.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  return decrypt(cookie);
}