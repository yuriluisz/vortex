import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Megaphone, Users, MessageCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session?.email) {
    redirect("/admin/login");
  }

  // Buscar métricas reais
  const [totalCampaigns, totalLeads, activeGroups] = await Promise.all([
    prisma.campaign.count({ where: { active: true } }),
    prisma.lead.count(),
    prisma.group.count({ where: { active: true } }),
  ]);

  const metrics = [
    {
      label: "Campanhas Ativas",
      value: totalCampaigns,
      icon: Megaphone,
      color: "text-chart-1 bg-chart-1/10",
    },
    {
      label: "Leads Capturados",
      value: totalLeads,
      icon: Users,
      color: "text-chart-2 bg-chart-2/10",
    },
    {
      label: "Grupos Ativos",
      value: activeGroups,
      icon: MessageCircle,
      color: "text-chart-3 bg-chart-3/10",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bem-vindo de volta, <span className="font-medium text-foreground/80">{session.email}</span>.
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-3xl font-bold text-card-foreground">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recentes / Empty state */}
      <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
        <p className="text-muted-foreground mb-4">
          O tráfego das campanhas será exibido aqui em breve.
        </p>
        <a 
          href="/admin/campaigns"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Gerenciar Campanhas
        </a>
      </div>
    </div>
  );
}
