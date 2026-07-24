"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import {
  updateTenantPlanAction,
  toggleTenantActiveAction,
  updateUserRoleAction,
} from "./actions";

// ============================================================================
// TYPES
// ============================================================================

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  createdAt: string;
  users: UserInfo[];
  _count: { campaigns: number; leads: number; groups: number };
  whatsappStatus: string | null;
  whatsappPhone: string | null;
}

// ============================================================================
// PLAN BADGE
// ============================================================================

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  FREE: { label: "Grátis", className: "bg-muted text-muted-foreground" },
  PRO: { label: "Pro", className: "bg-chart-3/10 text-chart-3" },
  ULTRA: { label: "Ultra", className: "bg-primary/10 text-primary" },
};

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Membro" },
];

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-destructive/10 text-destructive",
  ADMIN: "bg-primary/10 text-primary",
  MEMBER: "bg-muted text-muted-foreground",
};

// ============================================================================
// TENANT CARD
// ============================================================================

export function TenantCard({ tenant }: { tenant: TenantInfo }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(tenant.plan);
  const [isActive, setIsActive] = useState(tenant.active);
  const [isPending, startTransition] = useTransition();

  const planStyle = PLAN_STYLES[currentPlan] || PLAN_STYLES.FREE;

  const handlePlanChange = (newPlan: string) => {
    setCurrentPlan(newPlan);
    startTransition(async () => {
      await updateTenantPlanAction(
        tenant.id,
        newPlan as "FREE" | "PRO" | "ULTRA"
      );
    });
  };

  const handleToggleActive = () => {
    const newActive = !isActive;
    setIsActive(newActive);
    startTransition(async () => {
      await toggleTenantActiveAction(tenant.id, newActive);
    });
  };

  return (
    <div
      className={`rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200 ${
        !isActive ? "border-destructive/30 opacity-75" : "border-border"
      }`}
    >
      {/* Tenant Header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2 flex-wrap">
                {tenant.name}
                {!isActive && (
                  <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive uppercase">
                    Inativo
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {tenant.slug}.vortex.app
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <span>{tenant._count.campaigns} campanhas</span>
                <span>•</span>
                <span>{tenant._count.groups} grupos</span>
                <span>•</span>
                <span>{tenant._count.leads} leads</span>
                <span>•</span>
                <span>{tenant.users.length} usuários</span>
                {tenant.whatsappStatus && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      {tenant.whatsappStatus === "CONNECTED" ? (
                        <Wifi className="h-3 w-3 text-chart-1" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-destructive" />
                      )}
                      {tenant.whatsappPhone || "WhatsApp"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ações do Tenant */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}

            {/* Seletor de Plano */}
            <div className="relative">
              <select
                value={currentPlan}
                onChange={(e) => handlePlanChange(e.target.value)}
                disabled={isPending}
                className={`appearance-none rounded-lg border-0 px-3 py-1.5 pr-7 text-xs font-semibold outline-none cursor-pointer transition-colors disabled:opacity-50 ${planStyle.className}`}
              >
                <option value="FREE">Grátis</option>
                <option value="PRO">Pro</option>
                <option value="ULTRA">Ultra</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
            </div>

            {/* Toggle Ativo */}
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                isActive
                  ? "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20"
                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
              }`}
            >
              {isActive ? (
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

            {/* Expand/Collapse */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Usuários (expansível) */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-border pt-4 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Usuários ({tenant.users.length})
          </h3>
          <div className="space-y-2">
            {tenant.users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                tenantId={tenant.id}
              />
            ))}
            {tenant.users.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário neste tenant.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USER ROW — Com alteração de role inline
// ============================================================================

function UserRow({
  user,
  tenantId,
}: {
  user: UserInfo;
  tenantId: string;
}) {
  const [currentRole, setCurrentRole] = useState(user.role);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    startTransition(async () => {
      await updateUserRoleAction(
        user.id,
        newRole as "SUPER_ADMIN" | "ADMIN" | "MEMBER"
      );
    });
  };

  const roleStyle = ROLE_STYLES[currentRole] || ROLE_STYLES.MEMBER;

  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary/80">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user.name || "Sem nome"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Role selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPending && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isPending}
            className={`appearance-none rounded-full border-0 px-3 py-1 pr-6 text-[10px] font-semibold uppercase tracking-wider outline-none cursor-pointer transition-colors disabled:opacity-50 ${roleStyle}`}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 pointer-events-none opacity-50" />
        </div>
      </div>
    </div>
  );
}
