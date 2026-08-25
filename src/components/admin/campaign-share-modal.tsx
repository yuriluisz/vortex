"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Share2,
  X,
  UserPlus,
  Trash2,
  Check,
  Loader2,
  Shield,
  Eye,
  Edit3,
  Copy,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  shareCampaignAction,
  revokeCampaignShareAction,
  getCampaignSharesAction,
} from "@/app/admin/campaign-share-actions";

interface ShareItem {
  id: string;
  email: string;
  permission: "VIEW" | "EDIT";
  accepted: boolean;
  createdAt: string;
  userName: string | null;
  avatarUrl: string | null;
}

interface CampaignShareModalProps {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignShareModal({
  campaignId,
  campaignName,
  isOpen,
  onClose,
}: CampaignShareModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"VIEW" | "EDIT">("EDIT");
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && campaignId) {
      setLoadingShares(true);
      setError(null);
      setSuccessMsg(null);
      getCampaignSharesAction(campaignId)
        .then((res) => setShares(res as ShareItem[]))
        .finally(() => setLoadingShares(false));
    }
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await shareCampaignAction(campaignId, email, permission);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(`Acesso concedido com sucesso para ${email}!`);
        setEmail("");
        const updated = await getCampaignSharesAction(campaignId);
        setShares(updated as ShareItem[]);
      }
    });
  };

  const handleRevoke = (shareId: string, shareEmail: string) => {
    if (!confirm(`Deseja revogar o acesso de ${shareEmail}?`)) return;

    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await revokeCampaignShareAction(shareId);
      if (res.error) {
        setError(res.error);
      } else {
        setShares((prev) => prev.filter((s) => s.id !== shareId));
        setSuccessMsg(`Acesso revogado com sucesso.`);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-white/15 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Compartilhar Campanha</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[320px]">
                {campaignName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
            {successMsg}
          </div>
        )}

        {/* Formulário de Convidar */}
        <form onSubmit={handleShare} className="space-y-3">
          <label className="block text-xs font-semibold text-foreground/90">
            Convidar por E-mail
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "VIEW" | "EDIT")}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none shrink-0"
            >
              <option value="EDIT">Editor</option>
              <option value="VIEW">Visualizador</option>
            </select>

            <button
              type="submit"
              disabled={isPending || !email}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              <span>Convidar</span>
            </button>
          </div>
        </form>

        {/* Lista de Acessos Concedidos */}
        <div className="space-y-2 border-t border-white/10 pt-4">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Pessoas com acesso ({shares.length})
          </h4>

          {loadingShares ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando acessos...</span>
            </div>
          ) : shares.length === 0 ? (
            <div className="py-5 text-center text-xs text-muted-foreground bg-white/[0.02] border border-white/5 rounded-xl">
              Nenhum convidado possui acesso a esta campanha ainda.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {share.userName || share.email}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          share.permission === "EDIT"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {share.permission === "EDIT" ? "Editor" : "Visualizador"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{share.email}</span>
                      <span>•</span>
                      <span>{share.accepted ? "Ativo" : "Convite enviado"}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevoke(share.id, share.email)}
                    disabled={isPending}
                    title="Revogar Acesso"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
