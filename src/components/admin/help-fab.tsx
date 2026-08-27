"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageCircle,
} from "lucide-react";

// ============================================================================
// FAQ DATA — Conteúdo contextual por rota
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
  docsAnchor?: string;
}

interface PageFAQ {
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: Record<string, PageFAQ> = {
  "/admin": {
    title: "Dashboard",
    items: [
      {
        question: "O que os KPIs significam?",
        answer:
          "Os KPIs mostram um resumo rápido: Campanhas ativas, total de Leads capturados, Grupos ativos recebendo leads, e a Média de leads por campanha.",
        docsAnchor: "dashboard-kpis",
      },
      {
        question: "Como filtrar o gráfico de leads?",
        answer:
          "No gráfico de leads por dia, você pode alternar entre 7 ou 30 dias e filtrar por uma campanha específica usando o seletor no topo do gráfico.",
        docsAnchor: "dashboard-grafico",
      },
      {
        question: "Por que minha campanha não aparece aqui?",
        answer:
          "O Dashboard exibe apenas campanhas ativas. Se a sua campanha está pausada, ela não será contabilizada nos KPIs nem nos cards.",
        docsAnchor: "dashboard-cards",
      },
    ],
  },
  "/admin/campaigns": {
    title: "Campanhas",
    items: [
      {
        question: "Como criar uma nova campanha?",
        answer:
          'Clique no botão "Nova Campanha" no topo da página. Você será levado ao Editor Visual com código, preview ao vivo e painel de configurações completo.',
        docsAnchor: "criar-campanha",
      },
      {
        question: "O que significa o status Ativa/Inativa?",
        answer:
          "Campanhas Ativas estão recebendo leads e visíveis para o público. Campanhas Inativas estão pausadas e não aceitam novos cadastros.",
        docsAnchor: "campanha-ativar-pausar",
      },
      {
        question: "Como funciona o compartilhamento de campanhas?",
        answer:
          "Clique no botão Compartilhar no card da campanha para convidar gestores por e-mail como Editor (pode editar páginas e pixels) ou Visualizador (apenas leitura). As campanhas compartilhadas com você ficam na aba 'Compartilhadas Comigo'.",
        docsAnchor: "compartilhamento",
      },
      {
        question: "Quantas campanhas posso ter?",
        answer:
          "Depende do seu plano: Free permite 1, Pro permite 10 e Ultra é ilimitado. Veja a página de Assinatura nas Configurações.",
        docsAnchor: "planos-comparacao",
      },
    ],
  },
  "/admin/campaigns/new": {
    title: "Nova Campanha",
    items: [
      {
        question: "O que é o Slug?",
        answer:
          "O slug é o endereço público da sua página de captura. Exemplo: vortexpages.online/meu-lancamento. Use apenas letras minúsculas, números e hífens.",
        docsAnchor: "campo-slug",
      },
      {
        question: "O que é o Google Tag Manager ID e Meta Pixel?",
        answer:
          "Permite rastrear conversões. O Vórtex+ dispara eventos de conversão no Meta Pixel e envia generate_lead e join_group ao dataLayer do Google Tag Manager automaticamente.",
        docsAnchor: "campo-gtm",
      },
      {
        question: "Como funciona o Domínio Customizado?",
        answer:
          "Permite usar seu domínio (ex: campanha.site.com) apontando um CNAME para vortexpages.online. Ao ativar, ele desativa o domínio padrão e o protegido, garantindo que o funil seja acessado apenas pela sua marca, aumentando a segurança contra curiosos.",
        docsAnchor: "campo-dominio",
      },
      {
        question: "Como usar a tag {{FORM_SLOT}}?",
        answer:
          "Insira {{FORM_SLOT}} no HTML da sua página exatamente onde o formulário de captura deve aparecer. O Vórtex+ substituirá essa tag pelo formulário dinâmico.",
        docsAnchor: "tag-form-slot",
      },
      {
        question: "Posso usar templates prontos?",
        answer:
          'Sim! Clique no botão "Templates" no topo do editor para escolher um template pronto da comunidade. Basta selecionar e personalizar o código.',
        docsAnchor: "templates-visao",
      },
      {
        question: "Como configuro o SEO do link?",
        answer:
          'Na aba Geral do painel de configurações, role até "Identidade Visual do Link (SEO)" para definir título, descrição, imagem e favicon. Recurso exclusivo dos planos Pro e Ultra.',
        docsAnchor: "campo-seo",
      },
    ],
  },
  // Padrão para detalhes de campanha /admin/campaigns/[id]
  "campaign-details": {
    title: "Detalhes da Campanha",
    items: [
      {
        question: "O que é proteger a campanha?",
        answer:
          "Ao proteger, a URL pública é substituída por um código UUID único. Isso dificulta que pessoas copiem ou façam scraping do seu funil.",
        docsAnchor: "campanha-proteger",
      },
      {
        question: "Como funciona o Domínio Customizado?",
        answer:
          "Ao configurar e ativar seu domínio próprio via CNAME, os acessos pelos domínios padrão e protegido são totalmente desativados. Isso isola o seu funil na sua marca, bloqueando vazamentos e garantindo exclusividade.",
        docsAnchor: "campanha-links",
      },
      {
        question: "Qual a diferença entre as duas URLs?",
        answer:
          "A URL de Captura é onde o lead preenche o formulário. A URL de Redirecionamento é para onde o lead vai após se cadastrar geralmente para entrar no grupo.",
        docsAnchor: "campanha-links",
      },
      {
        question: "Como pausar minha campanha?",
        answer:
          'Nos Controles, clique em "Pausar Campanha". Ela deixará de aceitar novos leads até que você reative.',
        docsAnchor: "campanha-ativar-pausar",
      },
      {
        question: "Posso excluir uma campanha?",
        answer:
          "Sim, mas é irreversível. Ao excluir, a campanha, seus grupos e todos os leads associados serão removidos permanentemente.",
        docsAnchor: "campanha-excluir",
      },
      {
        question: "Como configuro o SEO do link?",
        answer:
          'Clique no ícone ⚙ para abrir as configurações. Na aba Geral, role até "Identidade Visual do Link (SEO)" para definir título, descrição, imagem e favicon que aparecem ao compartilhar.',
        docsAnchor: "campo-seo",
      },
    ],
  },
  // Padrão para grupos /admin/campaigns/[id]/groups
  "campaign-groups": {
    title: "Grupos WhatsApp",
    items: [
      {
        question: "Como funciona a rotação de grupos?",
        answer:
          "Quando o primeiro grupo atinge a lotação máxima, o Vórtex+ redireciona automaticamente os novos leads para o próximo grupo ativo da lista.",
        docsAnchor: "rotacao-grupos",
      },
      {
        question: "O que é lotação máxima?",
        answer:
          "É o número máximo de leads que podem entrar neste grupo. Quando atingido, o grupo é considerado cheio e os próximos leads vão para o próximo da fila.",
        docsAnchor: "campo-lotacao",
      },
      {
        question: "Diferença entre criar automático e manual?",
        answer:
          "No modo Manual, você cola o link de convite de um grupo existente. No Automático, exclusivo do plano Ultra, o Vórtex+ cria o grupo diretamente no WhatsApp conectado.",
        docsAnchor: "grupo-criar",
      },
    ],
  },
  // Padrão para leads /admin/campaigns/[id]/leads
  "campaign-leads": {
    title: "Leads Capturados",
    items: [
      {
        question: "O que significam os status dos leads?",
        answer:
          "Aguardando: cadastrado mas não entrou no grupo. No grupo: entrou com sucesso. Não entrou: não conseguiu entrar devido a link inválido ou grupo cheio.",
        docsAnchor: "leads-status",
      },
      {
        question: "Como exportar meus leads?",
        answer:
          'Clique em "Exportar CSV" no topo da tabela de leads para baixar um arquivo com todas as respostas do formulário, metadados de acesso e status de grupo.',
        docsAnchor: "leads-exportar",
      },
      {
        question: "O que é sincronizar leads?",
        answer:
          "Disponível no plano Ultra. Verifica quais leads realmente entraram no grupo do WhatsApp e atualiza o status automaticamente.",
        docsAnchor: "leads-sincronizar",
      },
    ],
  },
  "/admin/whatsapp/config": {
    title: "Configurações WhatsApp",
    items: [
      {
        question: "Qual número devo usar?",
        answer:
          "Use o número do WhatsApp que ficará responsável por gerenciar os grupos e enviar disparos. Formato: código do país + DDD + número como por exemplo 5511999999999.",
        docsAnchor: "whatsapp-numero",
      },
      {
        question: "O QR Code expirou, o que fazer?",
        answer:
          'Clique em "Gerar novo código" para atualizar. O QR Code é renovado automaticamente a cada 45 segundos.',
        docsAnchor: "whatsapp-qrcode",
      },
      {
        question: "Posso usar o WhatsApp Business?",
        answer:
          "Sim! Funciona com WhatsApp normal e Business. Basta escanear o QR Code pelo app do seu celular em Dispositivos Conectados.",
        docsAnchor: "whatsapp-conectar",
      },
    ],
  },
  "/admin/whatsapp/broadcast": {
    title: "Disparos em Massa",
    items: [
      {
        question: "O que é um grupo sem JID?",
        answer:
          "JID é o identificador interno do grupo no WhatsApp. Grupos sem JID não foram sincronizados e não receberão mensagens. Sincronize na aba Grupos.",
        docsAnchor: "broadcast-jid",
      },
      {
        question: "Qual o limite de caracteres?",
        answer:
          "Cada mensagem pode ter até 4.096 caracteres, incluindo espaços e emojis.",
        docsAnchor: "broadcast-mensagem",
      },
      {
        question: "Posso cancelar um disparo?",
        answer:
          "Após a confirmação, o disparo é enviado imediatamente e não pode ser cancelado. Sempre revise a mensagem na tela de confirmação.",
        docsAnchor: "broadcast-enviar",
      },
    ],
  },
  "/admin/whatsapp/logs": {
    title: "Histórico e Logs",
    items: [
      {
        question: "O que significa o status 'Parcial'?",
        answer:
          "Significa que a mensagem foi enviada para alguns grupos com sucesso, mas falhou em outros.",
        docsAnchor: "logs-status",
      },
      {
        question: "Por que o disparo falhou?",
        answer:
          "Pode ocorrer se o WhatsApp estiver desconectado, se o grupo foi excluído, ou se houve bloqueio temporário do WhatsApp.",
        docsAnchor: "logs-status",
      },
      {
        question: "Qual a taxa de sucesso ideal?",
        answer:
          "Acima de 90% é considerado bom. Se estiver abaixo, verifique se o WhatsApp está conectado e se os grupos estão com JIDs sincronizados.",
        docsAnchor: "logs-kpis",
      },
    ],
  },
  "/admin/settings": {
    title: "Configurações",
    items: [
      {
        question: "Como mudar meu email de acesso?",
        answer:
          'Na aba "Conta", preencha o novo email e clique em enviar código. Um código OTP de 6 dígitos será enviado ao novo email para confirmação.',
        docsAnchor: "conta-email",
      },
      {
        question: "Como fazer upgrade de plano?",
        answer:
          'Na aba "Assinatura", clique em "Fazer upgrade" no plano desejado. Você será redirecionado para a página de pagamento.',
        docsAnchor: "planos-upgrade",
      },
      {
        question: "Meu plano vai ser perdido ao cancelar?",
        answer:
          "Não imediatamente. Ao cancelar, você mantém acesso até o final do ciclo pago. Depois, a conta volta para o plano Free.",
        docsAnchor: "planos-cancelar",
      },
      {
        question: "Como convidar membros para a equipe do workspace?",
        answer:
          "Na aba 'Equipe do Workspace', informe o e-mail do colaborador e selecione o papel (Admin ou Membro). O convidado terá acesso a todas as campanhas e leads deste workspace.",
        docsAnchor: "equipe",
      },
      {
        question: "O que são dados de cobrança?",
        answer:
          "São seus dados fiscais como CPF, CNPJ e endereço usados para emissão de faturas. Obrigatório para assinar os planos Pro e Ultra.",
        docsAnchor: "cobranca-dados",
      },
    ],
  },
  "/admin/templates": {
    title: "Meus Templates",
    items: [
      {
        question: "Como publicar um template?",
        answer:
          'Clique em "Publicar novo template", selecione uma campanha como fonte, preencha nome, categoria e tema, e envie para análise.',
        docsAnchor: "templates-publicar",
      },
      {
        question: "O que significa 'Em análise'?",
        answer:
          "Seu template está aguardando revisão da equipe Vórtex+. Verificamos conteúdo malicioso e qualidade mínima antes de disponibilizar na loja.",
        docsAnchor: "templates-aprovacao",
      },
      {
        question: "Meu template foi rejeitado, o que fazer?",
        answer:
          "O motivo da rejeição aparece no card do template. Corrija o problema apontado e clique em 'Reenviar para análise'.",
        docsAnchor: "templates-aprovacao",
      },
      {
        question: "Posso editar um template publicado?",
        answer:
          "Sim! Use o menu de ações (⋮) no card. Alterações nos metadados são salvas imediatamente. Alterações no HTML criam nova versão e passam por análise.",
        docsAnchor: "templates-editar",
      },
      {
        question: "Como excluir um template?",
        answer:
          "No menu de ações (⋮), clique em 'Excluir'. Templates em uso por outros usuários não podem ser excluídos — use 'Ocultar' neste caso.",
        docsAnchor: "templates-editar",
      },
    ],
  },
};

// ============================================================================
// Helper: determinar a FAQ correta baseado no pathname
// ============================================================================

function getFAQForPath(pathname: string): PageFAQ {
  // Rotas exatas primeiro
  if (FAQ_DATA[pathname]) return FAQ_DATA[pathname];

  // Patterns dinâmicos
  if (/^\/admin\/campaigns\/[^/]+\/groups/.test(pathname))
    return FAQ_DATA["campaign-groups"];
  if (/^\/admin\/campaigns\/[^/]+\/leads/.test(pathname))
    return FAQ_DATA["campaign-leads"];
  if (/^\/admin\/campaigns\/[^/]+$/.test(pathname))
    return FAQ_DATA["campaign-details"];
  if (/^\/admin\/campaigns\/[^/]+/.test(pathname))
    return FAQ_DATA["campaign-details"];
  if (/^\/admin\/templates/.test(pathname))
    return FAQ_DATA["/admin/templates"] ?? { title: "Templates", items: [] };

  // Fallback
  return {
    title: "Ajuda",
    items: [
      {
        question: "Onde encontro a documentação completa?",
        answer:
          "Acesse o menu lateral e clique em Documentação para ver o guia completo de todas as funcionalidades.",
        docsAnchor: "",
      },
    ],
  };
}

// ============================================================================
// Accordion Item
// ============================================================================

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span className="text-sm font-medium text-foreground leading-snug">
          {item.question}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 animate-in slide-in-from-top-1 fade-in duration-200">
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {item.answer}
          </p>
          {item.docsAnchor && (
            <Link
              href={`/admin/docs#${item.docsAnchor}`}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <BookOpen className="h-2.5 w-2.5" />
              Ver na documentação →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN: HelpButton (para topo do WhatsApp) & HelpFAB (flutuante nas demais telas)
// ============================================================================

export function HelpButton({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const faq = getFAQForPath(pathname);

  // Fechar com Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Fechar ao navegar
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          compact
            ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95"
            : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        }
      >
        <HelpCircle className="h-3.5 w-3.5 text-primary" />
        <span>Dúvidas</span>
      </button>

      {isOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-primary/10 border-b border-primary/20 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Dúvidas Frequentes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {faq.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* FAQ Content */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
              {faq.items.map((item, idx) => (
                <FAQAccordionItem key={idx} item={item} />
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3">
              <Link
                href="/admin/docs"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Ver documentação completa →
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function HelpFAB() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const faq = getFAQForPath(pathname);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fechar com Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Fechar ao navegar
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Não renderizar o botão flutuante na interface do WhatsApp nem na docs
  if (
    pathname?.startsWith("/admin/docs") ||
    pathname === "/admin/whatsapp/broadcast" ||
    pathname === "/admin/whatsapp"
  ) {
    return null;
  }

  return (
    <div ref={panelRef} className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[60]">
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-14 sm:bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-80 max-w-[340px] max-h-[75vh] sm:max-h-[70vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-primary-foreground">
                  Ajuda Rápida
                </h3>
                <p className="text-[10px] text-primary-foreground/70">
                  {faq.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* FAQ Content */}
          <div className="overflow-y-auto max-h-[calc(75vh-120px)] sm:max-h-[calc(70vh-120px)]">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Perguntas frequentes sobre esta página. Clique para expandir.
              </p>
            </div>

            <div>
              {faq.items.map((item, idx) => (
                <FAQAccordionItem key={idx} item={item} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/20">
            <Link
              href="/admin/docs"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground border border-border hover:bg-accent transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Ver documentação completa
            </Link>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-accent"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:scale-105"
        }`}
        aria-label={isOpen ? "Fechar ajuda" : "Abrir ajuda"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <HelpCircle className="h-5 w-5" />
        )}
      </button>

      {/* Pulse animation when closed */}
      {!isOpen && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary/80" />
        </span>
      )}
    </div>
  );
}
