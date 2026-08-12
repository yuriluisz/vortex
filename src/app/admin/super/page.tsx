import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  Building2,
  Shield,
  Users,
  Megaphone,
  UserCheck,
  Search,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { TenantCard } from "./TenantCard";

const COOKIE_NAME = "vortex_admin_session";

// Preços dos planos
const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  PRO: 97,
  ULTRA: 157,
};

interface PageProps {
  searchParams: Promise<{ search?: string; plan?: string; status?: string }>;
}

export default async function SuperAdminPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.email || session.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const params = await searchParams;
  const search = params.search?.trim() || "";
  const planFilter = params.plan || "";
  const statusFilter = params.status || "";

  // Construir filtros
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }
  if (planFilter) {
    where.plan = planFilter;
  }
  if (statusFilter === "active") {
    where.active = true;
  } else if (statusFilter === "inactive") {
    where.active = false;
  }

  // Buscar tenants
  const tenants = await prisma.tenant.findMany({
    where,
    include: {
      users: {
        select: { id: true, email: true, name: true, role: true, blocked: true },
      },
      _count: {
        select: { campaigns: true, leads: true, groups: true },
      },
      evolutionInstance: {
        select: { status: true, phoneNumber: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Métricas globais
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.active).length;
  const totalUsers = tenants.reduce((acc, t) => acc + t.users.length, 0);
  const totalCampaigns = tenants.reduce((acc, t) => acc + t._count.campaigns, 0);
  const totalCampaignsActive = await prisma.campaign.count({ where: { active: true } });
  const totalLeads = tenants.reduce((acc, t) => acc + t._count.leads, 0);

  // Leads nos últimos 30 dias
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentLeads = await prisma.lead.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  // PageViews nos últimos 30 dias
  const recentPageViews = await prisma.pageView.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  const conversionRate = recentPageViews > 0
    ? ((recentLeads / recentPageViews) * 100).toFixed(1)
    : "0.0";

  // Distribuição de planos
  const planCounts = {
    FREE: tenants.filter((t) => t.plan === "FREE").length,
    PRO: tenants.filter((t) => t.plan === "PRO").length,
    ULTRA: tenants.filter((t) => t.plan === "ULTRA").length,
  };

  // Receita estimada (MRR)
  const mrr = planCounts.PRO * PLAN_PRICES.PRO + planCounts.ULTRA * PLAN_PRICES.ULTRA;

  // Função auxiliar para construir URL com parâmetros
  function buildUrl(params: Record<string, string>) {
    const usp = new URLSearchParams();
    if (search) usp.set("search", search);
    if (planFilter) usp.set("plan", planFilter);
    if (statusFilter) usp.set("status", statusFilter);
    Object.entries(params).forEach(([k, v]) => {
      if (v) usp.set(k, v);
      else usp.delete(k);
    });
    const qs = usp.toString();
    return `/admin/super${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
            <p className="text-sm text-muted-foreground">
              Gerenciamento global de tenants e usuários
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Link href="/admin" className="text-sm text-primary hover:text-primary/80 transition-colors">
            ← Voltar ao dashboard
          </Link>
          <Link
            href="/admin/super/templates"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Moderação de Templates →
          </Link>
        </div>
      </div>

      {/* KPIs Aprimorados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium">Tenants</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalTenants}</p>
          <p className="text-[10px] text-chart-1">
            {activeTenants} ativos
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Usuários</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalUsers}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Megaphone className="h-4 w-4" />
            <span className="text-xs font-medium">Campanhas</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalCampaigns}</p>
          <p className="text-[10px] text-chart-1">
            {totalCampaignsActive} ativas
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Leads (30d)</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{recentLeads.toLocaleString("pt-BR")}</p>
          <p className="text-[10px] text-muted-foreground">
            Total: {totalLeads.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Conversão</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{conversionRate}%</p>
          <p className="text-[10px] text-muted-foreground">
            leads/pageviews (30d)
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-chart-1 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Receita (MRR)</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            R$ {mrr.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            PRO {planCounts.PRO} × R$97 · ULTRA {planCounts.ULTRA} × R$157
          </p>
        </div>
      </div>

      {/* Distribuição de Planos */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Planos:</span>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          FREE {planCounts.FREE} ({totalTenants > 0 ? ((planCounts.FREE / totalTenants) * 100).toFixed(0) : 0}%)
        </span>
        <span className="inline-flex items-center rounded-full bg-chart-3/10 px-2.5 py-1 text-xs font-semibold text-chart-3">
          PRO {planCounts.PRO} ({totalTenants > 0 ? ((planCounts.PRO / totalTenants) * 100).toFixed(0) : 0}%)
        </span>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          ULTRA {planCounts.ULTRA} ({totalTenants > 0 ? ((planCounts.ULTRA / totalTenants) * 100).toFixed(0) : 0}%)
        </span>
      </div>

      {/* Search + Filtros */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nome ou slug..."
            className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <button type="submit" className="sr-only">Buscar</button>
        </form>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={buildUrl({ plan: "", status: "" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !planFilter && !statusFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todos
          </Link>
          <Link
            href={buildUrl({ plan: "FREE" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              planFilter === "FREE"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            FREE
          </Link>
          <Link
            href={buildUrl({ plan: "PRO" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              planFilter === "PRO"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            PRO
          </Link>
          <Link
            href={buildUrl({ plan: "ULTRA" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              planFilter === "ULTRA"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            ULTRA
          </Link>
          <span className="text-muted-foreground mx-1">|</span>
          <Link
            href={buildUrl({ status: "active" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Ativos
          </Link>
          <Link
            href={buildUrl({ status: "inactive" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === "inactive"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Inativos
          </Link>
        </div>
      </div>

      {/* Lista de Tenants */}
      <div className="space-y-4">
        {tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={{
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              plan: tenant.plan,
              active: tenant.active,
              createdAt: tenant.createdAt.toISOString(),
              users: tenant.users.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                blocked: u.blocked,
              })),
              _count: tenant._count,
              whatsappStatus: tenant.evolutionInstance?.status || null,
              whatsappPhone: tenant.evolutionInstance?.phoneNumber || null,
            }}
          />
        ))}

        {tenants.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {search
                ? `Nenhum tenant encontrado para "${search}".`
                : "Nenhum tenant encontrado."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}