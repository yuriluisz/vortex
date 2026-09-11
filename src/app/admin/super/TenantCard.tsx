"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
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
  Trash2,
  Ban,
  Mail,
  ExternalLink,
  ShieldAlert,
  Lock,
  Unlock,
  Megaphone,
  Edit,
  Power,
} from "lucide-react";
import {
  updateTenantPlanAction,
  toggleTenantActiveAction,
  updateUserRoleAction,
  toggleUserBlockedAction,
  cancelTenantPlanAction,
  deleteCampaignAction,
  sendTenantEmailAction,
  toggleCampaignActiveAction,
  updateCampaignSuperAction,
} from "./actions";

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  blocked: boolean;
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteCampaignModal, setShowDeleteCampaignModal] = useState<string | null>(null);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState(tenant.plan);
  const [isActive, setIsActive] = useState(tenant.active);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; slug: string; active: boolean; views: number; leads: number }[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isPending, startTransition] = useTransition();

  const planStyle = PLAN_STYLES[currentPlan] || PLAN_STYLES.FREE;

  const handlePlanChange = (newPlan: string) => {
    setCurrentPlan(newPlan);
    startTransition(async () => {
      await updateTenantPlanAction(tenant.id, newPlan as "FREE" | "PRO" | "ULTRA");
    });
  };

  const handleToggleActive = () => {
    const newActive = !isActive;
    setIsActive(newActive);
    startTransition(async () => {
      await toggleTenantActiveAction(tenant.id, newActive);
    });
  };

  const handleToggleExpand = async () => {
    if (!isExpanded && campaigns.length === 0) {
      setIsLoadingCampaigns(true);
      try {
        const res = await fetch(`/api/admin/campaigns-by-tenant?tenantId=${tenant.id}`);
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch {
        console.error("Failed to load campaigns");
      } finally {
        setIsLoadingCampaigns(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    startTransition(async () => {
      try {
        await deleteCampaignAction(campaignId);
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      } catch (err: any) {
        alert(err.message || "Erro ao excluir campanha.");
      }
      setShowDeleteCampaignModal(null);
    });
  };

  const handleCancelPlan = () => {
    startTransition(async () => {
      try {
        await cancelTenantPlanAction(tenant.id);
        setCurrentPlan("FREE");
      } catch (err: any) {
        alert(err.message || "Erro ao cancelar plano.");
      }
      setShowCancelModal(false);
    });
  };

  return (
    <>
      <div
        className={`glass-panel rounded-2xl overflow-hidden transition-all duration-200 ${
          !isActive ? "ring-1 ring-destructive/30 opacity-75" : ""
        }`}
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 w-full">
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
                  {tenant.slug}.vortexpages.online
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

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

              <button type="button" onClick={() => setShowEmailModal(true)} disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50" title="Enviar email para o tenant">
                <Mail className="h-3.5 w-3.5" />
              </button>

              <button type="button" onClick={() => setShowCancelModal(true)} disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50" title="Cancelar plano">
                <ShieldAlert className="h-3.5 w-3.5" />
              </button>

              <div className="relative">
                <select value={currentPlan} onChange={(e) => handlePlanChange(e.target.value)} disabled={isPending}
                  className={`appearance-none rounded-lg border-0 px-3 py-1.5 pr-7 text-xs font-semibold outline-none cursor-pointer transition-colors disabled:opacity-50 ${planStyle.className}`}>
                  <option value="FREE">Grátis</option>
                  <option value="PRO">Pro</option>
                  <option value="ULTRA">Ultra</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
              </div>

              <button type="button" onClick={handleToggleActive} disabled={isPending}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${isActive ? "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}>
                {isActive ? <><CheckCircle2 className="h-3.5 w-3.5" /> Ativo</> : <><XCircle className="h-3.5 w-3.5" /> Inativo</>}
              </button>

              <button type="button" onClick={handleToggleExpand} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                {isLoadingCampaigns ? <Loader2 className="h-4 w-4 animate-spin" /> : isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 border-t border-border pt-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                Campanhas ({tenant._count.campaigns})
              </h3>
              {campaigns.length > 0 ? (
                <div className="space-y-2">
                  {campaigns.map((camp) => (
                    <CampaignRow
                      key={camp.id}
                      camp={camp}
                      isPending={isPending}
                      onToggleActive={(id, active) => {
                        startTransition(async () => {
                          try {
                            await toggleCampaignActiveAction(id, active);
                            setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
                          } catch (err: any) { alert(err.message || "Erro ao alterar campanha."); }
                        });
                      }}
                      onEdit={(id) => setEditCampaignId(id)}
                      onDelete={(id) => setShowDeleteCampaignModal(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando campanhas...</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Usuários ({tenant.users.length})
              </h3>
              <div className="space-y-2">
                {tenant.users.map((user) => (
                  <UserRow key={user.id} user={user} tenantId={tenant.id} isPending={isPending} />
                ))}
                {tenant.users.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário neste tenant.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCancelModal && (
        <ConfirmModal title="Cancelar Plano" message={`Tem certeza que deseja rebaixar ${tenant.name} para FREE?`}
          confirmLabel="Cancelar Plano" onConfirm={handleCancelPlan} onCancel={() => setShowCancelModal(false)} isPending={isPending} />
      )}

      {showDeleteCampaignModal && (
        <ConfirmModal title="Excluir Campanha" message="Tem certeza que deseja excluir esta campanha? Esta ação é irreversível."
          confirmLabel="Excluir" onConfirm={() => handleDeleteCampaign(showDeleteCampaignModal)}
          onCancel={() => setShowDeleteCampaignModal(null)} isPending={isPending} destructive />
      )}

      {showEmailModal && (
        <EmailModal tenantId={tenant.id} tenantName={tenant.name} onClose={() => setShowEmailModal(false)} />
      )}

      {editCampaignId && (
        <EditCampaignModal campaignId={editCampaignId} onClose={() => setEditCampaignId(null)} />
      )}
    </>
  );
}

// ============================================================================
// CAMPAIGN ROW
// ============================================================================

function CampaignRow({
  camp, isPending: parentPending, onToggleActive, onEdit, onDelete,
}: {
  camp: { id: string; name: string; slug: string; active: boolean; views: number; leads: number };
  isPending: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 transition-colors hover:bg-secondary/80">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${camp.active ? "bg-chart-1" : "bg-destructive"}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{camp.name}</p>
          <p className="text-xs text-muted-foreground">/{camp.slug} · {camp.leads} leads · {camp.views} views</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <a href={`/${camp.slug}`} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Abrir campanha">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button type="button" onClick={() => onEdit(camp.id)} disabled={parentPending}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50" title="Editar campanha">
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { setTogglingId(camp.id); onToggleActive(camp.id, !camp.active); }}
          disabled={parentPending || togglingId === camp.id}
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${camp.active ? "text-chart-1 hover:bg-chart-1/10" : "text-muted-foreground hover:bg-muted"}`}
          title={camp.active ? "Desativar campanha" : "Ativar campanha"}>
          {togglingId === camp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => onDelete(camp.id)} disabled={parentPending}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50" title="Excluir campanha">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// USER ROW
// ============================================================================

function UserRow({ user, isPending: parentPending }: { user: UserInfo; tenantId: string; isPending: boolean }) {
  const [currentRole, setCurrentRole] = useState(user.role);
  const [isBlocked, setIsBlocked] = useState(user.blocked);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    startTransition(async () => { await updateUserRoleAction(user.id, newRole as "SUPER_ADMIN" | "ADMIN" | "MEMBER"); });
  };

  const handleToggleBlock = () => {
    const newBlocked = !isBlocked;
    setIsBlocked(newBlocked);
    startTransition(async () => { await toggleUserBlockedAction(user.id, newBlocked); });
  };

  const roleStyle = ROLE_STYLES[currentRole] || ROLE_STYLES.MEMBER;

  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 transition-colors hover:bg-secondary/80">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
          {(user.name || user.email)[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate flex items-center gap-2">
            {user.name || "Sem nome"}
            {isBlocked && (
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive gap-1">
                <Ban className="h-2.5 w-2.5" /> Bloqueado
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        <button type="button" onClick={handleToggleBlock} disabled={isPending || parentPending}
          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isBlocked ? "text-chart-1 hover:bg-chart-1/10" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
          title={isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}>
          {isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        </button>
        <div className="relative">
          <select value={currentRole} onChange={(e) => handleRoleChange(e.target.value)} disabled={isPending || parentPending}
            className={`appearance-none rounded-full border-0 px-3 py-1 pr-6 text-[10px] font-semibold uppercase tracking-wider outline-none cursor-pointer transition-colors disabled:opacity-50 ${roleStyle}`}>
            {ROLE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 pointer-events-none opacity-50" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRM MODAL
// ============================================================================

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, isPending, destructive = false }: {
  title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; isPending: boolean; destructive?: boolean;
}) {
  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-card-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${destructive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}`}>
            {isPending ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}

// ============================================================================
// EMAIL MODAL
// ============================================================================

function EmailModal({ tenantId, tenantName, onClose }: { tenantId: string; tenantName: string; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) { setError("Preencha todos os campos."); return; }
    setError("");
    startTransition(async () => {
      try { await sendTenantEmailAction(tenantId, subject.trim(), message.trim()); setSent(true); }
      catch (err: any) { setError(err.message || "Erro ao enviar email."); }
    });
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {sent ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-emerald-500/10 p-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-card-foreground mb-2">Email enviado!</h3>
            <p className="text-sm text-muted-foreground mb-6">Mensagem enviada para o administrador de {tenantName}.</p>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Fechar</button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-card-foreground mb-2">Enviar Email para {tenantName}</h3>
            <p className="text-sm text-muted-foreground mb-6">A mensagem será enviada para o administrador do tenant.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-subject" className="block text-sm font-medium text-foreground/80 mb-1">Assunto</label>
                <input id="email-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Alteração na sua conta"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </div>
              <div>
                <label htmlFor="email-message" className="block text-sm font-medium text-foreground/80 mb-1">Mensagem</label>
                <textarea id="email-message" value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua mensagem aqui..." rows={5}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-vertical" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={onClose} disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={handleSend} disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isPending ? "Enviando..." : "Enviar Email"}</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}

// ============================================================================
// EDIT CAMPAIGN MODAL
// ============================================================================

function EditCampaignModal({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> } | null>(null);
  const [campaign, setCampaign] = useState<{
    id: string; name: string; slug: string; pixelId: string | null; gtmId: string | null; rawHtml: string; formSchema: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    if (!campaignId) return;
    fetch(`/api/admin/campaign-detail?campaignId=${campaignId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.campaign) {
          setCampaign({
            id: data.campaign.id,
            name: data.campaign.name,
            slug: data.campaign.slug,
            pixelId: data.campaign.pixelId,
            gtmId: data.campaign.gtmId,
            rawHtml: data.campaign.rawHtml,
            formSchema: JSON.stringify(data.campaign.formSchema, null, 2),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateCampaignSuperAction(campaignId, formData);
      setResult(res);
      if (res?.success) setTimeout(() => onClose(), 1500);
    });
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-card-foreground mb-1">Editar Campanha</h3>
        <p className="text-sm text-muted-foreground mb-6">Edite os detalhes, HTML ou formulário desta campanha.</p>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !campaign ? (
          <p className="text-destructive text-sm">Erro ao carregar campanha.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {result?.error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{result.error}</div>}
            {result?.success && <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Campanha atualizada!</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="sup-name" className="block text-sm font-medium text-foreground/80">Nome *</label>
                <input id="sup-name" name="name" type="text" required defaultValue={campaign.name}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
                {result?.fieldErrors?.name && <p className="text-xs text-destructive">{result.fieldErrors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="sup-slug" className="block text-sm font-medium text-foreground/80">Slug *</label>
                <div className="flex rounded-lg border border-input bg-secondary overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all">
                  <span className="flex items-center px-4 border-r border-input text-sm text-muted-foreground bg-muted">vortexpages.online/</span>
                  <input id="sup-slug" name="slug" type="text" required defaultValue={campaign.slug}
                    className="w-full bg-transparent px-4 py-3 text-sm text-foreground outline-none" />
                </div>
                {result?.fieldErrors?.slug && <p className="text-xs text-destructive">{result.fieldErrors.slug[0]}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="sup-pixelId" className="block text-sm font-medium text-foreground/80">Meta Pixel ID</label>
                <input id="sup-pixelId" name="pixelId" type="text" defaultValue={campaign.pixelId || ""}
                  placeholder="1234567890"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </div>

              <div className="space-y-2">
                <label htmlFor="sup-gtmId" className="block text-sm font-medium text-foreground/80">Google Tag Manager ID</label>
                <input id="sup-gtmId" name="gtmId" type="text" defaultValue={campaign.gtmId || ""}
                  placeholder="GTM-XXXXXXX"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="sup-rawHtml" className="block text-sm font-medium text-foreground/80">HTML base *</label>
              <textarea id="sup-rawHtml" name="rawHtml" required defaultValue={campaign.rawHtml} rows={8}
                className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-vertical" />
              {result?.fieldErrors?.rawHtml && <p className="text-xs text-destructive">{result.fieldErrors.rawHtml[0]}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="sup-formSchema" className="block text-sm font-medium text-foreground/80">Schema do Formulário (JSON) *</label>
              <textarea id="sup-formSchema" name="formSchema" required defaultValue={campaign.formSchema} rows={6}
                className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-vertical" />
              {result?.fieldErrors?.formSchema && <p className="text-xs text-destructive">{result.fieldErrors.formSchema[0]}</p>}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-border">
              <button type="button" onClick={onClose} disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? "Salvando..." : "Salvar Alterações"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}