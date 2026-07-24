"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Eye, X } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface LogMessage {
  id: string;
  campaignName: string;
  content: string;
  targetType: string;
  groupIds: string[];
  status: string;
  sentAt: string;
}

interface LogsTableProps {
  messages: LogMessage[];
  groupNames: Record<string, string>;
  senderNumber?: string;
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

export function LogsTable({ messages, groupNames, senderNumber }: LogsTableProps) {
  const [selectedMessage, setSelectedMessage] = useState<LogMessage | null>(null);

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-card-foreground">
            Histórico de Disparos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Campanha</th>
                <th className="px-6 py-3 font-medium">Mensagem</th>
                <th className="px-6 py-3 font-medium">Destino</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum disparo realizado ainda.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr 
                    key={msg.id} 
                    onClick={() => setSelectedMessage(msg)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-3 font-medium text-card-foreground whitespace-nowrap">
                      {msg.campaignName}
                    </td>
                    <td className="px-6 py-3 max-w-[250px] truncate">
                      {msg.content.length > 120
                        ? msg.content.slice(0, 120) + "..."
                        : msg.content}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {msg.targetType === "ALL" ? "Todos" : "Selecionados"} ({msg.groupIds.length})
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={msg.status} />
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap text-xs">
                      {new Date(msg.sentAt).toLocaleDateString("pt-BR")}{" "}
                      {new Date(msg.sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground">
                Detalhes do Disparo
              </h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Info Header */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Campanha</p>
                  <p className="font-medium text-foreground">{selectedMessage.campaignName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <StatusBadge status={selectedMessage.status} />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Data de Envio</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedMessage.sentAt).toLocaleDateString("pt-BR")}{" "}
                    {new Date(selectedMessage.sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Número Remetente</p>
                  <p className="font-medium text-foreground">{senderNumber || "Desconhecido"}</p>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Mensagem Enviada</p>
                <div className="rounded-lg bg-secondary/50 p-4 border border-border">
                  <p className="text-sm text-foreground whitespace-pre-wrap font-mono">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              {/* Target Groups */}
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Grupos de Destino ({selectedMessage.groupIds.length})
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto bg-card">
                    <ul className="divide-y divide-border">
                      {selectedMessage.groupIds.map((id) => (
                        <li key={id} className="px-4 py-2 text-sm text-foreground">
                          {groupNames[id] || "Grupo Desconhecido"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
