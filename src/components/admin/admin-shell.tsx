"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  LogOut,
  BookText,
  Building2,
  Settings,
  Menu,
  X,
  MessageSquareMore,
} from "lucide-react";
import { logoutAction } from "@/app/admin/logout-action";
import { Shield } from "lucide-react";
import { WhatsAppStatusToast } from "@/components/admin/whatsapp-status-toast";
import { HelpFAB } from "@/components/admin/help-fab";
import { PlanBadge } from "@/components/admin/plan-badge";

const PRIMARY_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Campanhas", icon: Megaphone },
];

const SECONDARY_NAV = [
  { href: "/admin/settings", label: "Configurações", icon: Settings },
  { href: "/admin/docs", label: "Documentação", icon: BookText, exact: true },
];

interface TenantInfo {
  name: string;
  slug: string;
  plan: string;
  role?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string;
}

interface AdminShellProps {
  children: React.ReactNode;
  tenantInfo?: TenantInfo | null;
}

export function AdminShell({ children, tenantInfo }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fechar sidebar ao navegar (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Travar scroll do body quando sidebar mobile estiver aberta
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Fechar com tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen, handleKeyDown]);

  // Na página de login, renderizar sem sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const planType = tenantInfo?.plan as "FREE" | "PRO" | "ULTRA" | undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Overlay escuro para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 motion-safe:transition-opacity motion-safe:duration-300 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col
          motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[var(--ease-drawer)]
          md:static md:z-auto md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-6 w-auto invert" />
          {planType && (
            <PlanBadge plan={planType} className="ml-2" />
          )}
        </div>

        {/* Header do Tenant */}
        {tenantInfo && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold truncate">
                  {tenantInfo.name}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Navegação */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {tenantInfo?.role === "SUPER_ADMIN" && (
            <Link
              href="/admin/super"
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                pathname === "/admin/super"
                  ? "bg-amber-500/10 text-amber-400 shadow-sm"
                  : "text-amber-400/60 hover:bg-amber-500/10 hover:text-amber-400"
              }`}
            >
              <Shield className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              Super Admin
            </Link>
          )}

          {/* Navegação principal */}
          {PRIMARY_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                {item.label}
              </Link>
            );
          })}

          {/* WhatsApp — só para plano ULTRA */}
          {tenantInfo?.plan === "ULTRA" && (
            <Link
              href="/admin/whatsapp"
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                pathname?.startsWith("/admin/whatsapp")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <MessageSquareMore className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              WhatsApp
            </Link>
          )}

          {/* Divider */}
          <div className="my-3 border-t border-sidebar-border" />

          {/* Navegação secundária */}
          {SECONDARY_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Botão hamburger — visível apenas em mobile */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-sidebar-border bg-background">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Banner de Assinatura */}
        {(() => {
          if (!tenantInfo) return null;
          const { subscriptionStatus, trialEndsAt } = tenantInfo;
          let isBlocked = false;
          let message = "";

          if (subscriptionStatus === "PAST_DUE") {
            isBlocked = true;
            message = "Sua fatura está em atraso. O acesso às campanhas foi bloqueado.";
          } else if (subscriptionStatus === "TRIAL" && trialEndsAt) {
            const endsAt = new Date(trialEndsAt);
            if (new Date() > endsAt) {
              isBlocked = true;
              message = "Seu período de teste expirou. O acesso às campanhas foi bloqueado.";
            }
          }

          if (isBlocked) {
            return (
              <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-between shadow-md relative z-50">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Megaphone className="h-5 w-5" />
                  {message}
                </div>
                <Link
                  href="/admin/settings" // Direciona para a página de settings/billing
                  className="bg-background text-foreground text-xs font-bold px-3 py-1.5 rounded hover:bg-muted transition-colors"
                >
                  Regularizar Agora
                </Link>
              </div>
            );
          }
          return null;
        })()}

        <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 md:p-8 animate-in fade-in duration-300 relative">
          {/* Se estiver bloqueado, podemos aplicar uma camada transparente para evitar cliques, ou deixar apenas o aviso. 
              Como o usuário pediu "toast de aviso", o topo já chama bastante atenção. */}
          {children}
        </div>

        {/* Toast global de WhatsApp desconectado */}
        {tenantInfo && (
          <WhatsAppStatusToast plan={tenantInfo.plan} />
        )}

        {/* FAQ flutuante global */}
        <HelpFAB />
      </main>
    </div>
  );
}