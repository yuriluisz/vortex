"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { ChevronsUpDown, Check, Building2, Users, Loader2 } from "lucide-react";
import { switchActiveTenantAction } from "@/app/admin/team-actions";
import Link from "next/link";
import { PlanBadge } from "@/components/admin/plan-badge";

export interface WorkspaceItem {
  tenantId: string;
  name: string;
  slug: string;
  plan: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isPrimary: boolean;
}

interface TenantSwitcherProps {
  currentTenantId?: string | null;
  currentTenantName?: string | null;
  currentPlan?: string | null;
  workspaces?: WorkspaceItem[];
}

export function TenantSwitcher({
  currentTenantId,
  currentTenantName,
  currentPlan = "FREE",
  workspaces = [],
}: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (tenantId: string) => {
    if (tenantId === currentTenantId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await switchActiveTenantAction(tenantId);
      setOpen(false);
    });
  };

  const displayName = currentTenantName || "Meu Workspace";
  const planType = currentPlan as "FREE" | "PRO" | "ULTRA";

  return (
    <div className="relative w-full px-3 py-2" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-primary/30"
        title="Alternar Workspace"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate max-w-[105px]">
                {displayName}
              </span>
              <PlanBadge plan={planType} className="scale-75 origin-left" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate block">
              Workspace Ativo
            </span>
          </div>
        </div>
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin flex-shrink-0" />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1.5 z-[70] bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5 mb-1">
            Seus Workspaces
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar">
            {workspaces.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                <span>{displayName}</span>
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
            ) : (
              workspaces.map((ws) => {
                const isSelected = ws.tenantId === currentTenantId;
                return (
                  <button
                    key={ws.tenantId}
                    type="button"
                    onClick={() => handleSelect(ws.tenantId)}
                    disabled={isPending}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{ws.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground uppercase font-bold">
                          {ws.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        vortexpages.online/{ws.slug}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-1 pt-1 border-t border-white/5">
            <Link
              href="/admin/settings"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gerenciar Equipe</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
