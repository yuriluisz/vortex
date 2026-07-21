import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

export default async function CampaignLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-card-foreground">Base de Leads</h3>
          <p className="text-sm text-muted-foreground">Total de {campaign.leads.length} leads capturados</p>
        </div>
        <button 
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          title="Exportar CSV (Em breve)"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">WhatsApp</th>
                <th className="px-6 py-4 font-medium">Data / Hora</th>
                <th className="px-6 py-4 font-medium">Dispositivo</th>
                <th className="px-6 py-4 font-medium text-right">Origem (Local)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaign.leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum lead capturado nesta campanha ainda.
                  </td>
                </tr>
              ) : (
                campaign.leads.map((lead) => {
                  // Tipar o metadata
                  const meta = lead.metadata as {
                    country?: string;
                    city?: string;
                    device?: { type?: string; vendor?: string };
                    os?: { name?: string };
                  } | null;

                  return (
                    <tr key={lead.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-card-foreground">
                          {lead.name || <span className="text-muted-foreground/50 italic">Não informado</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-chart-1 font-mono">
                        {lead.whatsapp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <p className="text-card-foreground">{lead.datadb}</p>
                        <p className="text-muted-foreground">{lead.horadb}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1">
                          {meta?.device?.type === "mobile" ? "📱 Mobile" : "💻 Desktop"}
                        </span>
                        <span className="ml-2 text-muted-foreground">{meta?.os?.name || ""}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs">
                        {meta?.city && meta?.country && meta.country !== "unknown" ? (
                          `${meta.city}, ${meta.country}`
                        ) : (
                          "Desconhecido"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
