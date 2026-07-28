"use client";

import { useState, useActionState } from "react";
import { Send, Loader2, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import { sendBroadcastAction } from "../actions";
import type { BroadcastState } from "../actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";

// ============================================================================
// TYPES
// ============================================================================

interface GroupInfo {
  id: string;
  name: string;
  groupJid: string | null;
  currentCount: number;
  maxCapacity: number;
}

interface CampaignInfo {
  id: string;
  name: string;
  slug: string;
  groups: GroupInfo[];
}

interface MessageInfo {
  id: string;
  campaignName: string;
  content: string;
  targetType: string;
  groupCount: number;
  status: string;
  sentAt: string;
}

interface BroadcastFormProps {
  campaigns: CampaignInfo[];
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    SENT: { label: "Enviado", className: "bg-chart-1/10 text-chart-1" },
    PARTIAL: { label: "Parcial", className: "bg-chart-2/10 text-chart-2" },
    FAILED: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
    PENDING: { label: "Pendente", className: "bg-muted text-muted-foreground" },
  };

  const { label, className } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {status === "SENT" && <CheckCircle2 className="h-3 w-3" />}
      {status === "FAILED" && <XCircle className="h-3 w-3" />}
      {status === "PENDING" && <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BroadcastForm({ campaigns }: BroadcastFormProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [targetType, setTargetType] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [state, formAction, pending] = useActionState<BroadcastState, FormData>(
    sendBroadcastAction,
    undefined
  );

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const availableGroups = selectedCampaign?.groups.filter((g) => g.groupJid) || [];
  const targetGroups = targetType === "ALL"
    ? availableGroups
    : availableGroups.filter((g) => selectedGroupIds.includes(g.id));

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = () => {
    if (!selectedCampaignId || !message.trim() || targetGroups.length === 0) return;
    setShowConfirm(true);
  };

  return (
    <div className="space-y-8">
      {/* ── Formulário de Envio ── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-medium text-card-foreground mb-6">
          Novo Disparo
        </h3>

        {/* Resultado */}
        {state?.success && (
          <div className="rounded-lg border border-chart-1/30 bg-chart-1/10 px-4 py-3 text-sm text-chart-1 mb-6">
            ✅ Disparo enviado! {state.sentCount} grupo(s) com sucesso
            {state.failedCount ? `, ${state.failedCount} falha(s)` : ""}.
          </div>
        )}

        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
            {state.error}
          </div>
        )}

        <div className="space-y-6">
          {/* 1. Selecionar campanha */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80 flex items-center">
              Campanha
              <FieldTooltip tooltip="Selecione a campanha. Os disparos são enviados apenas para os grupos ativos da campanha selecionada." docsAnchor="broadcast-enviar" />
            </label>
            <div className="relative">
              <select
                value={selectedCampaignId}
                onChange={(e) => {
                  setSelectedCampaignId(e.target.value);
                  setSelectedGroupIds([]);
                }}
                className="w-full appearance-none rounded-lg border border-input bg-secondary px-4 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
              >
                <option value="">Selecione uma campanha...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.groups.length} grupos)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* 2. Seleção de grupos */}
          {selectedCampaign && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground/80 flex items-center">
                Grupos de destino
                <FieldTooltip tooltip="Escolha se deseja enviar para todos os grupos com JID sincronizado ou selecionar manualmente alguns." docsAnchor="broadcast-enviar" />
              </label>

              {/* Toggle ALL / SELECTED */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="ALL"
                    checked={targetType === "ALL"}
                    onChange={() => setTargetType("ALL")}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Todos os grupos ({availableGroups.length})
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    value="SELECTED"
                    checked={targetType === "SELECTED"}
                    onChange={() => setTargetType("SELECTED")}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Selecionar grupos
                  </span>
                </label>
              </div>

              {/* Checkboxes de grupos */}
              {targetType === "SELECTED" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3 bg-secondary/50">
                  {availableGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-2 text-center py-4">
                      Nenhum grupo com JID vinculado. Sincronize os grupos primeiro.
                    </p>
                  ) : (
                    availableGroups.map((group) => (
                      <label
                        key={group.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                          selectedGroupIds.includes(group.id)
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {group.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.currentCount}/{group.maxCapacity} membros
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}

              {/* Aviso se tem grupos sem JID */}
              {selectedCampaign.groups.some((g) => !g.groupJid) && (
                <p className="text-xs text-chart-2">
                  ⚠️ {selectedCampaign.groups.filter((g) => !g.groupJid).length} grupo(s) sem JID vinculado (não receberão mensagens).
                </p>
              )}
            </div>
          )}

          {/* 3. Mensagem */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80 flex items-center">
              Mensagem
              <FieldTooltip tooltip="O texto que será enviado. Limite de 4096 caracteres." docsAnchor="broadcast-mensagem" />
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a mensagem a ser enviada nos grupos..."
              rows={5}
              maxLength={4096}
              className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/4096
            </p>
          </div>

          {/* 4. Botão de envio */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {selectedCampaignId && targetGroups.length > 0
                ? `Será enviado para ${targetGroups.length} grupo(s)`
                : "Selecione campanha e grupos"}
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !selectedCampaignId ||
                !message.trim() ||
                targetGroups.length === 0 ||
                pending
              }
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              Enviar Disparo
            </button>
          </div>
        </div>

        {/* Modal de Confirmação */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
              <h4 className="text-lg font-semibold text-card-foreground mb-2">
                Confirmar Disparo
              </h4>
              <p className="text-sm text-muted-foreground mb-1">
                Campanha: <strong>{selectedCampaign?.name}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Destino: <strong>{targetGroups.length} grupo(s)</strong>
              </p>
              <div className="rounded-lg bg-muted p-3 mb-6 max-h-32 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {message.length > 200 ? message.slice(0, 200) + "..." : message}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <form
                  action={(formData) => {
                    setShowConfirm(false);
                    formAction(formData);
                  }}
                >
                  <input type="hidden" name="campaignId" value={selectedCampaignId} />
                  <input type="hidden" name="message" value={message} />
                  <input type="hidden" name="targetType" value={targetType} />
                  <input
                    type="hidden"
                    name="groupIds"
                    value={JSON.stringify(selectedGroupIds)}
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Confirmar Envio
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
