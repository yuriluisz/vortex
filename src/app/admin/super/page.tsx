import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  updateTenantPlanAction,
  toggleTenantActiveAction,
} from "./actions";
import { Building2, Shield, Users, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

const COOKIE_NAME = "vortex_admin_session";

const PLAN_LABELS: Record<string, string> = {
  FREE: "Grátis",
  PRO: "Pro",
  ULTRA: "Ultra",
};

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
        select: { campaigns: true, leads: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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

      {/* Lista de Tenants */}
      <div className="space-y-6">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          >
            {/* Tenant Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                      {tenant.name}
                      {!tenant.active && (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive uppercase">
                          Inativo
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {tenant.slug}.vortex.app
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{tenant._count.campaigns} campanhas</span>
                      <span>{tenant._count.leads} leads</span>
                      <span>{tenant.users.length} usuários</span>
                    </div>
                  </div>
                </div>

                {/* Ações do Tenant */}
                <div className="flex items-center gap-2">
                  {/* Seletor de Plano */}
                  <form action={updateTenantPlanAction.bind(null, tenant.id, tenant.plan)}>
                    <select
                      name="plan"
                      defaultValue={tenant.plan}
                      className="rounded-lg border border-input bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-ring"
                    >
                      <option value="FREE">Grátis</option>
                      <option value="PRO">Pro</option>
                      <option value="ULTRA">Ultra</option>
                    </select>
                    <button type="submit" className="sr-only">Salvar</button>
                  </form>

                  {/* Toggle Ativo */}
                  <form action={toggleTenantActiveAction.bind(null, tenant.id, !tenant.active)}>
                    <button
                      type="submit"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        tenant.active
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      }`}
                    >
                      {tenant.active ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5" />
                          Inativo
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Lista de Usuários do Tenant */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Usuários
              </h3>
              <div className="space-y-2">
                {tenant.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.name || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary tracking-wider">
                      {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Admin" : "Membro"}
                    </span>
                  </div>
                ))}
                {tenant.users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum usuário neste tenant.
                  </p>
                )}
              </div>
            </div>
          </div>
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