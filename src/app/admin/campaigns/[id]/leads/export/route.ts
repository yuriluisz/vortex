import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Check if campaign belongs to tenant
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, tenantId: true, name: true },
  });

  if (!campaign || campaign.tenantId !== session.tenantId) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const leads = await prisma.lead.findMany({
    where: { campaignId: id, tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { name: true } },
    },
  });

  if (leads.length === 0) {
    return new NextResponse("No leads to export", { status: 400 });
  }

  // Find all possible answer keys to create dynamic headers
  const allAnswerKeys = new Set<string>();
  leads.forEach((lead) => {
    if (lead.answers && typeof lead.answers === "object") {
      Object.keys(lead.answers as Record<string, any>).forEach((key) => {
        allAnswerKeys.add(key);
      });
    }
  });

  const answerHeaders = Array.from(allAnswerKeys);

  const headers = [
    "ID",
    "Nome",
    "WhatsApp",
    "Status",
    "Grupo",
    "Entrou Em",
    "Data DB",
    "Hora DB",
    ...answerHeaders.map((h) => `Resposta: ${h}`),
    "IP",
    "Cidade",
    "País",
    "Dispositivo",
    "Navegador",
    "OS"
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes("\\n") || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((lead) => {
    const answers = (lead.answers as Record<string, string>) || {};
    const metadata = (lead.metadata as Record<string, any>) || {};

    const row = [
      lead.id,
      lead.name || "",
      lead.whatsapp || "",
      lead.status,
      lead.group?.name || "",
      lead.joinedAt ? lead.joinedAt.toISOString() : "",
      lead.datadb || "",
      lead.horadb || "",
      ...answerHeaders.map((h) => answers[h] || ""),
      metadata.ip || "",
      metadata.city || "",
      metadata.country || "",
      metadata.device?.type || metadata.device?.vendor || "",
      metadata.browser?.name || "",
      metadata.os?.name || ""
    ];

    return row.map(escapeCSV).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\\n");

  const now = new Date().toISOString().split("T")[0];
  const filename = `leads-${campaign.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${now}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
