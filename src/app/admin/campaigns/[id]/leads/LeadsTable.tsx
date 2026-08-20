"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, User, Phone, Smartphone, Calendar, FileJson, ChevronLeft, ChevronRight } from "lucide-react";

export type LeadData = {
  id: string;
  name: string | null;
  whatsapp: string;
  status: string;
  datadb: string;
  horadb: string;
  answers: any;
  metadata: any;
  groupName?: string;
  joinedAt?: string;
};

interface LeadsTableProps {
  leads: LeadData[];
  currentPage: number;
  totalPages: number;
  totalLeads: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Aguardando", className: "bg-chart-2/10 text-chart-2" },
  JOINED: { label: "No grupo", className: "bg-chart-1/10 text-chart-1" },
  NOT_JOINED: { label: "Não entrou", className: "bg-destructive/10 text-destructive" },
  EXPIRED: { label: "Expirado", className: "bg-muted text-muted-foreground" },
};

export function LeadsTable({ leads, currentPage, totalPages, totalLeads }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Lógica para gerar os números das páginas a serem exibidos
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <>
      <div className="glass-panel rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">WhatsApp</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Data / Hora</th>
                <th className="px-6 py-4 font-medium">Dispositivo</th>
                <th className="px-6 py-4 font-medium text-right">Origem (Local)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {totalLeads > 0 ? "Nenhum lead nesta página." : "Nenhum lead capturado nesta campanha ainda."}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const meta = lead.metadata as {
                    country?: string;
                    city?: string;
                    device?: { type?: string; vendor?: string };
                    os?: { name?: string };
                  } | null;

                  const statusInfo = STATUS_CONFIG[lead.status] || STATUS_CONFIG.PENDING;

                  return (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLead(lead)}
                      className="transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-card-foreground">
                          {lead.name || <span className="text-muted-foreground/50 italic">Não informado</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-chart-1 font-mono">
                        {lead.whatsapp}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        {lead.groupName && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[120px]">
                            {lead.groupName}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <p className="text-card-foreground">{lead.datadb}</p>
                        <p className="text-muted-foreground">{lead.horadb}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1">
                          {meta?.device?.type === "mobile" ? "📱 Mobile" : "💻 Desktop"}
                        </span>
                        <span className="ml-2 text-muted-foreground">{meta?.os?.name || ""}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs">
                        {meta?.city && meta?.country && meta.country !== "unknown" ? (
                          `${meta.city}, ${meta.country}`
                        ) : (
                          "Desconhecido"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Página <span className="font-medium text-foreground">{currentPage}</span> de <span className="font-medium text-foreground">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`inline-flex items-center justify-center min-w-[32px] h-8 rounded-md text-sm transition-colors ${
                    pageNum === currentPage 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-xl glass-panel shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Detalhes do Lead
              </h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 mb-1">
                    <User className="h-3.5 w-3.5" /> Nome
                  </p>
                  <p className="font-medium text-foreground">{selectedLead.name || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 mb-1">
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </p>
                  <p className="font-medium text-chart-1 font-mono">{selectedLead.whatsapp}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[selectedLead.status]?.className || "bg-muted text-muted-foreground"}`}>
                    {STATUS_CONFIG[selectedLead.status]?.label || "Aguardando"}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar className="h-3.5 w-3.5" /> Capturado em
                  </p>
                  <p className="font-medium text-foreground text-xs">
                    {selectedLead.datadb} às {selectedLead.horadb}
                  </p>
                </div>
              </div>
              
              {selectedLead.groupName && (
                <div className="pt-2">
                  <p className="text-muted-foreground mb-1 text-sm">Grupo Alocado</p>
                  <p className="font-medium text-foreground text-sm">{selectedLead.groupName}</p>
                  {selectedLead.joinedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Confirmado em: {new Date(selectedLead.joinedAt).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              )}

              {/* Formulário (Answers) */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <FileJson className="h-4 w-4 text-primary" /> Respostas do Formulário
                </h3>
                {selectedLead.answers && Object.keys(selectedLead.answers).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedLead.answers).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-secondary/50 p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1 capitalize">{key}</p>
                        <p className="text-sm font-medium text-foreground">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma resposta extra coletada.</p>
                )}
              </div>

              {/* Metadados Técnicos */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Smartphone className="h-4 w-4 text-primary" /> Dados do Dispositivo e Localização
                </h3>
                {selectedLead.metadata ? (
                  <div className="rounded-lg bg-muted/30 p-4 border border-border overflow-x-auto">
                    <pre className="text-xs text-muted-foreground font-mono">
                      {JSON.stringify(selectedLead.metadata, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Metadados não disponíveis.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
