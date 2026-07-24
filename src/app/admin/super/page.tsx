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
} from "lucide-react";
import Link from "next/link";
import { TenantCard } from "./TenantCard";

const COOKIE_NAME = "vortex_admin_session";

export default async function SuperAdminPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.email || session.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  // Buscar todos os tenants com contagens
  const tenants = await prisma.tenant.findMany({
    include: {
      users: {
        select: { id: true, email: true, name: true, role: true },
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
  const totalLeads = tenants.reduce((acc, t) => acc + t._count.leads, 0);

  const planCounts = {
    FREE: tenants.filter((t) => t.plan === "FREE").length,
    PRO: tenants.filter((t) => t.plan === "PRO").length,
    ULTRA: tenants.filter((t) => t.plan === "ULTRA").length,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8">
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
        <div className="mt-4">
          <Link
            href="/admin"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ← Voltar ao dashboard
          </Link>
        </div>
      </div>

      {/* Métricas Globais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Leads</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalLeads.toLocaleString("pt-BR")}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Planos</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              F {planCounts.FREE}
            </span>
            <span className="inline-flex items-center rounded-full bg-chart-3/10 px-1.5 py-0.5 text-[10px] font-semibold text-chart-3">
              P {planCounts.PRO}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              U {planCounts.ULTRA}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de Tenants */}
      <div className="space-y-6">
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
              users: tenant.users,
              _count: tenant._count,
              whatsappStatus: tenant.evolutionInstance?.status || null,
              whatsappPhone: tenant.evolutionInstance?.phoneNumber || null,
            }}
          />
        ))}

        {tenants.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum tenant encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}