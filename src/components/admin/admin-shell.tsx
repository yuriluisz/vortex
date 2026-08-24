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
  LayoutTemplate,
} from "lucide-react";
import { logoutAction } from "@/app/admin/logout-action";
import { Shield } from "lucide-react";
import { WhatsAppStatusToast } from "@/components/admin/whatsapp-status-toast";
import { HelpFAB } from "@/components/admin/help-fab";
import { PlanBadge } from "@/components/admin/plan-badge";

const PRIMARY_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/admin/templates", label: "Meus Templates", icon: LayoutTemplate },
];

const SECONDARY_NAV = [
  { href: "/admin/docs", label: "Documentação", icon: BookText, exact: true },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
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
    <div className="flex h-screen overflow-hidden bg-black text-white antialiased relative">
      {/* Background global effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[128px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[128px]" />
      </div>

      {/* Overlay escuro para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm motion-safe:transition-all motion-safe:duration-300 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col
          bg-black/90 backdrop-blur-2xl border-r border-white/10
          motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[var(--ease-drawer)]
          md:static md:z-auto md:translate-x-0 shadow-2xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-6 w-auto invert drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          {planType && (
            <PlanBadge plan={planType} className="ml-2" />
          )}
        </div>

        {/* Header do Tenant */}
        {tenantInfo && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] border border-primary/20">
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
                  ? "bg-amber-500/15 text-amber-400 shadow-sm border border-amber-500/20"
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
                    ? "bg-primary/15 text-primary shadow-sm border border-primary/20"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} />
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
                  ? "bg-primary/15 text-primary shadow-sm border border-primary/20"
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <MessageSquareMore className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${pathname?.startsWith("/admin/whatsapp") ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} />
              WhatsApp
            </Link>
          )}

        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
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
                    ? "bg-primary/15 text-primary shadow-sm border border-primary/20"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="my-2 border-t border-white/10" />

          {tenantInfo ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive/80 transition-colors hover:bg-destructive/15 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                Sair da conta
              </button>
            </form>
          ) : (
            <Link
              href="/admin/login"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <LogOut className="h-5 w-5 rotate-180" />
              Fazer login
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-black">
        {/* Botão hamburger — visível apenas em mobile */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-white/10 bg-black/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
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
              <div className="bg-destructive/20 border-b border-destructive/30 backdrop-blur-md text-destructive px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md relative z-50">
                <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                  <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
                <Link
                  href="/admin/settings"
                  className="w-full sm:w-auto text-center bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-md shadow-[0_0_10px_rgba(var(--destructive),0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                  Regularizar Agora
                </Link>
              </div>
            );
          }
          return null;
        })()}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300 relative z-10">
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