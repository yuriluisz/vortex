"use client";

import { useState, useMemo, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  MessageSquare,
  Users,
  Send,
  CheckCheck,
  AlertCircle,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Info,
  QrCode,
  Smartphone,
  Unplug,
  Wifi,
  Settings,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import {
  sendBroadcastAction,
  retryFailedBroadcastAction,
  setupWhatsAppAction,
  refreshQRCodeAction,
  checkConnectionAction,
  disconnectWhatsAppAction,
} from "@/app/admin/whatsapp/actions";

export interface GroupItem {
  id: string;
  name: string;
  groupJid: string | null;
  currentCount: number;
  maxCapacity: number;
}

export interface CampaignWithGroups {
  id: string;
  name: string;
  slug: string;
  groups: GroupItem[];
}

export interface ChatMessage {
  id: string;
  campaignId: string;
  content: string;
  targetType: string;
  groupIds: string[];
  status: string;
  sentAt: string;
  results?: Record<string, string> | null;
}

interface WhatsAppChatConsoleProps {
  campaigns: CampaignWithGroups[];
  initialMessages: ChatMessage[];
  instanceStatus?: string;
  phoneNumber?: string | null;
}

const WHATSAPP_FAQS = [
  {
    question: "Como funciona o envio de mensagens para os grupos?",
    answer:
      "Você pode selecionar todos os grupos vinculados à campanha ativa ou clicar em 'Editar Alvos' no composer para escolher grupos específicos. Ao clicar em Disparar, a mensagem é enviada para cada grupo do WhatsApp conectado.",
  },
  {
    question: "O que significa cada indicador no balão da mensagem?",
    answer:
      "Dois tiques azuis indicam que a mensagem foi entregue em todos os grupos. Um aviso amarelo indica envio parcial (alguns grupos falharam). O ícone vermelho indica falha total de envio.",
  },
  {
    question: "Como ver detalhes de quais grupos receberam e quais falharam?",
    answer:
      "Basta clicar diretamente em qualquer balão de mensagem no chat. A gaveta lateral direita abrirá exibindo a lista detalhada de grupos e o botão de reenvio para falhas.",
  },
  {
    question: "O que é um grupo 'Sem JID'?",
    answer:
      "JID é o identificador único do grupo no WhatsApp. Grupos sem JID não foram sincronizados pela instância e não podem receber mensagens.",
  },
  {
    question: "Como conectar ou desconectar o meu WhatsApp?",
    answer:
      "Clique no botão 'Configurações' no topo da tela para abrir o assistente de conexão por QR Code, código de pareamento ou desconexão da instância.",
  },
];

export function WhatsAppChatConsole({
  campaigns,
  initialMessages,
  instanceStatus: initialInstanceStatus = "DISCONNECTED",
  phoneNumber: initialPhoneNumber,
}: WhatsAppChatConsoleProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id || ""
  );
  const [campaignSearch, setCampaignSearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [messageInput, setMessageInput] = useState("");

  // Target groups selection state per campaign
  const [targetType, setTargetType] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    campaigns[0]?.groups.map((g) => g.id) || []
  );
  const [groupSearch, setGroupSearch] = useState("");

  // Drawer state: null | "groups" | "message_info"
  const [drawerMode, setDrawerMode] = useState<"groups" | "message_info" | null>(null);
  const [activeMessageDetail, setActiveMessageDetail] = useState<ChatMessage | null>(null);

  // Modals state
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [connStatus, setConnStatus] = useState(initialInstanceStatus);
  const [phone, setPhone] = useState(initialPhoneNumber || "");
  const [wizardStep, setWizardStep] = useState<"phone" | "qrcode" | "connected">(
    initialInstanceStatus === "CONNECTED" ? "connected" : "phone"
  );
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCodeData, setPairingCodeData] = useState<string | null>(null);
  const [wizardError, setWizardError] = useState("");
  const [wizardLoading, setWizardLoading] = useState(false);

  // Transitions
  const [isSending, startSending] = useTransition();
  const [isRetrying, startRetrying] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Active Campaign
  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  }, [campaigns, selectedCampaignId]);

  // Messages for active campaign
  const campaignMessages = useMemo(() => {
    if (!activeCampaign) return [];
    return messages
      .filter((m) => m.campaignId === activeCampaign.id)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }, [messages, activeCampaign]);

  // Filtered campaigns for left list
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) =>
      c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(campaignSearch.toLowerCase())
    );
  }, [campaigns, campaignSearch]);

  // Handle Campaign Select
  const handleSelectCampaign = (campId: string) => {
    setSelectedCampaignId(campId);
    const camp = campaigns.find((c) => c.id === campId);
    if (camp) {
      setSelectedGroupIds(camp.groups.map((g) => g.id));
      setTargetType("ALL");
      setDrawerMode((prev) => (prev === "message_info" ? null : prev));
      setActiveMessageDetail(null);
    }
  };

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [campaignMessages, selectedCampaignId]);

  // Polling for QR Code connection
  const checkStatus = useCallback(async () => {
    try {
      const res = await checkConnectionAction();
      if (res.status === "CONNECTED") {
        setConnStatus("CONNECTED");
        setWizardStep("connected");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (connectionModalOpen && wizardStep === "qrcode") {
      const interval = setInterval(checkStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [connectionModalOpen, wizardStep, checkStatus]);

  // Handle Wizard Phone Submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardLoading(true);
    setWizardError("");

    const formData = new FormData();
    formData.append("phoneNumber", phone);

    try {
      const res = await setupWhatsAppAction(undefined, formData);
      if (res?.error) {
        setWizardError(res.error);
      } else if (res?.step === "qrcode") {
        setWizardStep("qrcode");
        if (res.qrCode) setQrCodeData(res.qrCode);
        if (res.pairingCode) setPairingCodeData(res.pairingCode);
      }
    } catch (err: unknown) {
      setWizardError(err instanceof Error ? err.message : "Erro ao configurar número.");
    } finally {
      setWizardLoading(false);
    }
  };

  // Handle Refresh QR Code
  const handleRefreshQR = async () => {
    setWizardLoading(true);
    try {
      const res = await refreshQRCodeAction();
      if (res.qrCode) setQrCodeData(res.qrCode);
      if (res.pairingCode) setPairingCodeData(res.pairingCode);
    } catch {
      // ignore
    } finally {
      setWizardLoading(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;
    setWizardLoading(true);
    try {
      await disconnectWhatsAppAction();
      setConnStatus("DISCONNECTED");
      setWizardStep("phone");
      setQrCodeData(null);
      setPairingCodeData(null);
      setPhone("");
    } catch {
      // ignore
    } finally {
      setWizardLoading(false);
    }
  };

  // Toggle group selection
  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];

      if (next.length === activeCampaign.groups.length) {
        setTargetType("ALL");
      } else {
        setTargetType("SELECTED");
      }
      return next;
    });
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === activeCampaign.groups.length) {
      setSelectedGroupIds([]);
      setTargetType("SELECTED");
    } else {
      setSelectedGroupIds(activeCampaign.groups.map((g) => g.id));
      setTargetType("ALL");
    }
  };

  // Send Broadcast
  const handleSend = () => {
    if (!messageInput.trim() || !activeCampaign) return;
    setFeedback(null);

    const formData = new FormData();
    formData.append("campaignId", activeCampaign.id);
    formData.append("message", messageInput.trim());
    formData.append("targetType", targetType);
    if (targetType === "SELECTED") {
      formData.append("groupIds", JSON.stringify(selectedGroupIds));
    }

    startSending(async () => {
      const res = await sendBroadcastAction(undefined, formData);
      if (res?.error) {
        setFeedback({ type: "error", text: res.error });
      } else if (res?.success) {
        setFeedback({
          type: "success",
          text: `Mensagem enviada para ${res.sentCount} grupo(s)!`,
        });
        setMessageInput("");

        const newMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          campaignId: activeCampaign.id,
          content: messageInput.trim(),
          targetType,
          groupIds:
            targetType === "ALL"
              ? activeCampaign.groups.map((g) => g.id)
              : selectedGroupIds,
          status: (res.failedCount ?? 0) > 0 ? "PARTIAL" : "SENT",
          sentAt: new Date().toISOString(),
          results: activeCampaign.groups.reduce((acc, g) => {
            if (
              targetType === "ALL" ||
              selectedGroupIds.includes(g.id)
            ) {
              acc[g.id] = "OK";
            }
            return acc;
          }, {} as Record<string, string>),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    });
  };

  // Retry Failed
  const handleRetryFailed = (messageId: string) => {
    setFeedback(null);
    startRetrying(async () => {
      const res = await retryFailedBroadcastAction(messageId);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Reenvio concluído: ${res.sentCount} grupos entregues.`,
        });
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) {
              const updatedResults = { ...(m.results || {}) };
              Object.keys(updatedResults).forEach((k) => {
                if (updatedResults[k] === "FAILED") updatedResults[k] = "OK";
              });
              return { ...m, status: "SENT", results: updatedResults };
            }
            return m;
          })
        );
        if (activeMessageDetail?.id === messageId) {
          setActiveMessageDetail((prev) =>
            prev ? { ...prev, status: "SENT" } : null
          );
        }
      } else {
        setFeedback({ type: "error", text: res.error || "Erro ao reenviar." });
      }
    });
  };

  return (
    <div className="flex flex-1 h-full w-full min-h-0 overflow-hidden bg-black text-foreground antialiased relative">
      {/* Toast de Feedback */}
      {feedback && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-destructive/15 border-destructive/30 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Column Split Interface */}
      <div className="flex flex-1 min-h-0 w-full h-full relative">
        {/* ------------------------------------------------------------------- */}
        {/* COLUNA ESQUERDA: LISTA DE CAMPANHAS                                */}
        {/* ------------------------------------------------------------------- */}
        <div className="w-full sm:w-72 lg:w-80 border-r border-white/10 flex flex-col bg-zinc-950/80 backdrop-blur-xl shrink-0">
          {/* Header da Coluna Esquerda */}
          <div className="p-3.5 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Campanhas
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                {campaigns.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Buscar campanha..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Lista de Campanhas */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredCampaigns.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Nenhuma campanha encontrada.
              </div>
            ) : (
              filteredCampaigns.map((camp) => {
                const isSelected = camp.id === selectedCampaignId;
                const lastMsg = messages
                  .filter((m) => m.campaignId === camp.id)
                  .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

                return (
                  <button
                    key={camp.id}
                    type="button"
                    onClick={() => handleSelectCampaign(camp.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-primary/10 text-foreground border-l-2 border-primary"
                        : "hover:bg-white/[0.03] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-primary/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {camp.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {camp.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                            {new Date(lastMsg.sentAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                          {lastMsg ? lastMsg.content : "Nenhum disparo realizado"}
                        </p>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-muted-foreground shrink-0">
                          {camp.groups.length} grupos
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* COLUNA CENTRAL: CHAT FEED & COMPOSER                               */}
        {/* ------------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/40 relative">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {activeCampaign?.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground truncate">
                  {activeCampaign?.name}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {activeCampaign?.groups.length || 0} Grupos Vinculados
                </p>
              </div>
            </div>

            {/* Ações do Topo: Dúvidas + Configurações do WhatsApp */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-foreground text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Dúvidas</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-foreground text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Configurações</span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    connStatus === "CONNECTED"
                      ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-amber-400"
                  }`}
                  title={connStatus === "CONNECTED" ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
                />
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div
            ref={chatFeedRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          >
            {campaignMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 shadow-lg">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Nenhum disparo para esta campanha
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Escreva uma mensagem no campo abaixo e envie instantaneamente para todos os grupos de WhatsApp vinculados.
                </p>
              </div>
            ) : (
              campaignMessages.map((msg) => {
                const isFailed = msg.status === "FAILED";
                const isPartial = msg.status === "PARTIAL";

                return (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      onClick={() => {
                        setActiveMessageDetail(msg);
                        setDrawerMode("message_info");
                      }}
                      className="group cursor-pointer max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-none px-4 py-3 bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-foreground border border-primary/25 shadow-lg hover:border-primary/50 transition-all hover:shadow-xl relative"
                    >
                      {/* Conteúdo */}
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-text font-normal">
                        {msg.content}
                      </p>

                      {/* Footer do Balão */}
                      <div className="flex items-center justify-end gap-2 mt-2 pt-1.5 border-t border-white/10 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="w-2.5 h-2.5" />
                          {msg.targetType === "ALL"
                            ? "Todos os grupos"
                            : `${msg.groupIds.length} grupos`}
                        </span>

                        <span className="tabular-nums">
                          {new Date(msg.sentAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {isFailed ? (
                          <span title="Falha no envio">
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                          </span>
                        ) : isPartial ? (
                          <span title="Envio parcial">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        ) : (
                          <span title="Entregue">
                            <CheckCheck className="w-3.5 h-3.5 text-primary" />
                          </span>
                        )}

                        <span className="opacity-0 group-hover:opacity-100 text-[10px] underline ml-1 text-primary transition-opacity">
                          Detalhes
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* COMPOSER DE DISPARO (INFERIOR)                                    */}
          {/* ----------------------------------------------------------------- */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl shrink-0 space-y-2.5">
            {/* Quick Target Bar */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium text-[11px]">
                  Disparar para:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType(targetType === "ALL" ? "SELECTED" : "ALL");
                    if (targetType === "ALL") setDrawerMode("groups");
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                    targetType === "ALL"
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {targetType === "ALL"
                    ? `Todos os ${activeCampaign?.groups.length || 0} Grupos`
                    : `${selectedGroupIds.length} Grupos Selecionados`}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDrawerMode(drawerMode === "groups" ? null : "groups")}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors font-semibold"
              >
                Editar Alvos
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Input & Send Button */}
            <div className="flex items-end gap-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                placeholder="Digite a mensagem para os grupos do WhatsApp (Ctrl + Enter para enviar)..."
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/20 resize-none max-h-32 shadow-inner"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !messageInput.trim() || activeCampaign?.groups.length === 0}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Disparar</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* COLUNA DIREITA / DRAWER RETRÁTIL (GRUPOS & DETALHES DE ENTREGA)     */}
        {/* ------------------------------------------------------------------- */}
        {drawerMode && (
          <div className="w-full sm:w-80 lg:w-88 border-l border-white/10 bg-zinc-950/95 backdrop-blur-2xl flex flex-col shrink-0 animate-in slide-in-from-right-8 duration-200 absolute sm:relative inset-y-0 right-0 z-30 shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                {drawerMode === "groups" ? (
                  <>
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">Grupos Alvo</h3>
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">Dados da Mensagem</h3>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerMode(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body: Modo 1 - Grupos Alvo */}
            {drawerMode === "groups" && (
              <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {selectedGroupIds.length} de {activeCampaign?.groups.length || 0} selecionados
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllGroups}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {selectedGroupIds.length === activeCampaign?.groups.length
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </button>
                </div>

                {/* Search in groups */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Filtrar grupos..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
                  />
                </div>

                {/* Groups List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5">
                  {activeCampaign?.groups
                    .filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
                    .map((group) => {
                      const isChecked = selectedGroupIds.includes(group.id);
                      return (
                        <div
                          key={group.id}
                          onClick={() => handleToggleGroup(group.id)}
                          className="pt-1.5 flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-white/20 text-primary focus:ring-primary/20 bg-transparent cursor-pointer"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {group.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                {group.currentCount}/{group.maxCapacity} membros
                              </p>
                            </div>
                          </div>

                          {group.groupJid ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              JID OK
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Sem JID
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Drawer Body: Modo 2 - Dados da Mensagem */}
            {drawerMode === "message_info" && activeMessageDetail && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quote da Mensagem */}
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1">
                    Texto Disparado
                  </span>
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                    {activeMessageDetail.content}
                  </p>
                  <span className="text-[10px] text-muted-foreground block mt-2 font-mono">
                    Enviado em: {new Date(activeMessageDetail.sentAt).toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Status Geral */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Entregues
                    </span>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {
                        Object.values(activeMessageDetail.results || {}).filter(
                          (v) => v === "OK"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                    <span className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Falharam
                    </span>
                    <p className="text-lg font-bold text-foreground mt-0.5">
                      {
                        Object.values(activeMessageDetail.results || {}).filter(
                          (v) => v === "FAILED"
                        ).length
                      }
                    </p>
                  </div>
                </div>

                {/* Reenviar para falhas se houver */}
                {Object.values(activeMessageDetail.results || {}).some((v) => v === "FAILED") && (
                  <button
                    type="button"
                    onClick={() => handleRetryFailed(activeMessageDetail.id)}
                    disabled={isRetrying}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Reenviar para Grupos com Falha
                  </button>
                )}

                {/* Lista Detalhada por Grupo */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2">
                    Destinatários ({activeMessageDetail.groupIds.length})
                  </h4>
                  <div className="space-y-1.5 divide-y divide-white/5">
                    {activeMessageDetail.groupIds.map((gid) => {
                      const grp = activeCampaign.groups.find((g) => g.id === gid);
                      const resultStatus = activeMessageDetail.results?.[gid] || "OK";
                      const isOk = resultStatus === "OK";

                      return (
                        <div
                          key={gid}
                          className="pt-1.5 flex items-center justify-between text-xs"
                        >
                          <span className="text-foreground truncate max-w-[170px]">
                            {grp?.name || gid}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOk
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}
                          >
                            {isOk ? "Entregue" : "Falhou"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL DE CONFIGURAÇÃO & CONEXÃO WHATSAPP                             */}
      {/* --------------------------------------------------------------------- */}
      {connectionModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Conexão WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">Gerenciamento de Instância Ultra</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* STEP: CONNECTED */}
              {wizardStep === "connected" && (
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-chart-1/10 border border-chart-1/25 text-chart-1 flex items-center justify-center mx-auto shadow-lg shadow-chart-1/20">
                    <Wifi className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">WhatsApp Conectado!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instância ativa e pronta para gerenciar grupos e disparos.
                    </p>
                  </div>
                  {phone && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-chart-1 font-bold">
                      {phone}
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setConnectionModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
                    >
                      Continuar Usando
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={wizardLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                      Desconectar
                    </button>
                  </div>
                </div>
              )}

              {/* STEP: PHONE INPUT */}
              {wizardStep === "phone" && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <h4 className="text-base font-bold text-foreground">Vincular Novo WhatsApp</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Insira o número com DDD que será usado para disparar nos grupos.
                    </p>
                  </div>

                  {wizardError && (
                    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                      {wizardError}
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                      Número de WhatsApp (com DDD)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="Ex: 11999998888"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/20"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConnectionModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-white/10 hover:bg-white/5"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={wizardLoading || !phone}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                      {wizardLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
                      Gerar QR Code
                    </button>
                  </div>
                </form>
              )}

              {/* STEP: QR CODE SCAN */}
              {wizardStep === "qrcode" && (
                <div className="text-center space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground">Escaneie o QR Code</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Abra o WhatsApp no celular &gt; Aparelhos Conectados &gt; Conectar Aparelho.
                    </p>
                  </div>

                  {qrCodeData ? (
                    <div className="flex justify-center p-4 bg-white rounded-2xl max-w-[240px] mx-auto shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCodeData} alt="QR Code WhatsApp" className="w-full h-auto" />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  )}

                  {pairingCodeData && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 max-w-xs mx-auto">
                      <p className="text-[11px] text-muted-foreground">Código de Pareamento:</p>
                      <p className="text-base font-mono font-bold text-primary mt-0.5">{pairingCodeData}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRefreshQR}
                      disabled={wizardLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${wizardLoading ? "animate-spin" : ""}`} />
                      Atualizar QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep("phone")}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Trocar Número
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL DE DÚVIDAS FREQUENTES (CENTRAL WHATSAPP)                        */}
      {/* --------------------------------------------------------------------- */}
      {helpModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Dúvidas Frequentes</h3>
                  <p className="text-xs text-muted-foreground">Central de Disparos WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable FAQ Items */}
            <div className="p-6 overflow-y-auto flex-1 divide-y divide-white/5 space-y-3">
              {WHATSAPP_FAQS.map((faq, idx) => (
                <div key={idx} className="pt-3 first:pt-0">
                  <h5 className="text-xs font-bold text-foreground mb-1 flex items-start gap-1.5">
                    <span className="text-primary">Q:</span>
                    <span>{faq.question}</span>
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between shrink-0">
              <Link
                href="/admin/docs"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Ver Documentação Completa →
              </Link>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
