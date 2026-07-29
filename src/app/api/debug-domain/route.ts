import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") || "libido.leguiard.com";
  
  // 1. Busca exata
  const exact = await prisma.campaign.findFirst({
    where: { customDomain: domain, active: true },
    select: { id: true, name: true, customDomain: true, active: true, protected: true, accessCode: true, tenantId: true },
  });

  // 2. Busca case-insensitive
  const insensitive = await prisma.campaign.findFirst({
    where: { customDomain: { equals: domain, mode: "insensitive" }, active: true },
    select: { id: true, name: true, customDomain: true, active: true, protected: true, accessCode: true, tenantId: true },
  });

  // 3. Todas as campanhas com customDomain preenchido
  const allWithDomain = await prisma.campaign.findMany({
    where: { customDomain: { not: null } },
    select: { id: true, name: true, customDomain: true, active: true, protected: true, accessCode: true },
  });

  // 4. Headers que chegaram
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => { headers[k] = v; });

  return Response.json({
    searchedFor: domain,
    exactMatch: exact,
    insensitiveMatch: insensitive,
    allCampaignsWithDomain: allWithDomain,
    headersReceived: headers,
  }, { status: 200 });
}
