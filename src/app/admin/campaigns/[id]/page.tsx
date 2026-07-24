import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { toggleCampaignStatusAction, deleteCampaignAction } from "../../actions";
import { Trash2, Link as LinkIcon, Power, PowerOff } from "lucide-react";
import { EditCampaignForm } from "./EditCampaignForm";

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign || campaign.tenantId !== session.tenantId) {
    notFound();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna Principal: Detalhes */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <h3 className="text-lg font-medium text-card-foreground mb-4">Links Importantes</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">URL da Página de Captura</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm text-card-foreground flex-1 select-all font-mono">https://seudominio.com/{campaign.slug}</code>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">URL de Redirecionamento (Grupos)</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <code className="text-sm text-card-foreground flex-1 select-all font-mono">https://seudominio.com/{campaign.slug}/redirect</code>
              </div>
            </div>
          </div>
        </div>

        <EditCampaignForm campaign={campaign} />
      </div>

      {/* Coluna Lateral: Ações */}
      <div className="space-y-6 lg:sticky lg:top-8 self-start">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <h3 className="text-lg font-medium text-card-foreground mb-4">Controles</h3>
          
          <div className="space-y-4">
            <form action={async () => {
              "use server";
              await toggleCampaignStatusAction(campaign.id, !campaign.active);
            }}>
              <button 
                type="submit"
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  campaign.active 
                  ? "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20" 
                  : "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20"
                }`}
              >
                {campaign.active ? (
                  <><PowerOff className="h-4 w-4" /> Pausar Campanha</>
                ) : (
                  <><Power className="h-4 w-4" /> Ativar Campanha</>
                )}
              </button>
            </form>

            <form action={async () => {
              "use server";
              await deleteCampaignAction(campaign.id);
            }}>
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Campanha
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
