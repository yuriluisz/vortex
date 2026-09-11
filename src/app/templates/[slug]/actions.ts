"use server";

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";

const VIEW_COOKIE_PREFIX = "vortex_v_tmpl_";
const VIEW_WINDOW_SECONDS = 86400; // 24 horas

export interface TrackTemplateViewResult {
  success: boolean;
  incremented: boolean;
}

/**
 * Server Action: Registra a visualização de um template com deduplicação de 24h.
 * - Ignora visualizações feitas pelo próprio autor do template.
 * - Deduplica por cookie do navegador (fast path sem Redis/DB).
 * - Deduplica via Redis atômico (SET key 1 EX 86400 NX) para cross-tabs / anônimos.
 */
export async function trackTemplateViewAction(
  templateId: string,
  authorId?: string | null
): Promise<TrackTemplateViewResult> {
  try {
    if (!templateId) {
      return { success: false, incremented: false };
    }

    // 1. Guard: se o usuário logado for o próprio autor, não incrementa
    const session = await getSession();
    if (session?.userId && authorId && session.userId === authorId) {
      return { success: true, incremented: false };
    }

    // 2. Guard: Cookie do navegador nas últimas 24h
    const cookieStore = await cookies();
    const cookieName = `${VIEW_COOKIE_PREFIX}${templateId}`;
    if (cookieStore.get(cookieName)) {
      return { success: true, incremented: false };
    }

    // 3. Obter ou gerar ID de visitante anônimo para consistência
    let visitorId = cookieStore.get("vortex_vid")?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      try {
        cookieStore.set("vortex_vid", visitorId, {
          maxAge: 365 * 24 * 60 * 60, // 1 ano
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        });
      } catch {
        // Silencioso em caso de restrição de cookie
      }
    }

    // 4. Extrair IP para complementar deduplicação
    const headersList = await headers();
    const ip =
      headersList.get("cf-connecting-ip") ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const userKey = session?.userId
      ? `u:${session.userId}`
      : `v:${visitorId}:${ip}`;

    const redisKey = `tmpl:view:${templateId}:${userKey}`;

    // 5. Deduplicação atômica via Redis (SET ... NX com TTL de 24h)
    let isNewView = true;
    try {
      const redisResult = await redis.set(
        redisKey,
        "1",
        "EX",
        VIEW_WINDOW_SECONDS,
        "NX"
      );
      isNewView = redisResult === "OK";
    } catch (redisErr) {
      console.warn(
        "[trackTemplateViewAction] Redis fallback para cookie:",
        redisErr
      );
      isNewView = true;
    }

    // Marca cookie do navegador para as próximas 24h
    try {
      cookieStore.set(cookieName, "1", {
        maxAge: VIEW_WINDOW_SECONDS,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    } catch {
      // Silencioso
    }

    if (!isNewView) {
      return { success: true, incremented: false };
    }

    // 6. Incrementa contador consolidado no banco
    await prisma.template.update({
      where: { id: templateId },
      data: { viewCount: { increment: 1 } },
    });

    return { success: true, incremented: true };
  } catch (error) {
    console.error("[trackTemplateViewAction] Erro ao registrar view:", error);
    return { success: false, incremented: false };
  }
}

export interface ToggleTemplateLikeResult {
  success: boolean;
  liked: boolean;
  likeCount: number;
  error?: string;
}

/**
 * Server Action: Alterna a curtida (like/unlike) de um template pelo usuário logado.
 */
export async function toggleTemplateLikeAction(
  templateId: string
): Promise<ToggleTemplateLikeResult> {
  try {
    if (!templateId) {
      return { success: false, liked: false, likeCount: 0, error: "INVALID_TEMPLATE" };
    }

    const session = await getSession();
    if (!session?.userId) {
      return { success: false, liked: false, likeCount: 0, error: "AUTH_REQUIRED" };
    }

    const userId = session.userId;

    // Checar se já curtiu
    const existingLike = await prisma.templateLike.findUnique({
      where: {
        templateId_userId: {
          templateId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Descurtir: remove registro e decrementa contador
      await prisma.$transaction([
        prisma.templateLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.template.update({
          where: { id: templateId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      const template = await prisma.template.findUnique({
        where: { id: templateId },
        select: { likeCount: true },
      });

      return {
        success: true,
        liked: false,
        likeCount: Math.max(0, template?.likeCount ?? 0),
      };
    } else {
      // Curtir: cria registro e incrementa contador
      await prisma.$transaction([
        prisma.templateLike.create({
          data: {
            templateId,
            userId,
          },
        }),
        prisma.template.update({
          where: { id: templateId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);

      const template = await prisma.template.findUnique({
        where: { id: templateId },
        select: { likeCount: true },
      });

      return {
        success: true,
        liked: true,
        likeCount: template?.likeCount ?? 1,
      };
    }
  } catch (error) {
    console.error("[toggleTemplateLikeAction] Erro ao alternar like:", error);
    return { success: false, liked: false, likeCount: 0, error: "INTERNAL_ERROR" };
  }
}

