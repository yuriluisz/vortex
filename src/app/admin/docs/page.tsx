"use client";

import { PlanBadge } from '@/components/admin/plan-badge';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Megaphone,
  LayoutDashboard,
  Users,
  MessageCircle,
  Settings,
  Shield,
  Send,
  History,
  CreditCard,
  Building2,
  User,
  ChevronRight,
  ArrowUp,
  Zap,
  Eye,
  LinkIcon,
  Power,
  Trash2,
  Download,
  QrCode,
  Smartphone,
  Wifi,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// CHAPTERS DATA
// ============================================================================

interface Chapter {
  id: string;
  title: string;
  icon: typeof BookOpen;
  part: string;
}

const PARTS = [
  { id: "parte-1", label: "Primeiros Passos" },
  { id: "parte-2", label: "Campanhas" },
  { id: "parte-3", label: "WhatsApp" },
  { id: "parte-4", label: "Configurações" },
];

const CHAPTERS: Chapter[] = [
  { id: "bem-vindo", title: "Bem-vindo ao Vórtex+", icon: BookOpen, part: "parte-1" },
  { id: "dashboard", title: "Conhecendo o Painel", icon: LayoutDashboard, part: "parte-1" },
  { id: "lista-campanhas", title: "Lista de Campanhas", icon: Megaphone, part: "parte-2" },
  { id: "criar-campanha", title: "Criando uma Campanha", icon: Zap, part: "parte-2" },
  { id: "detalhes-campanha", title: "Detalhes da Campanha", icon: Eye, part: "parte-2" },
  { id: "grupos", title: "Grupos de WhatsApp", icon: MessageCircle, part: "parte-2" },
  { id: "leads", title: "Leads Capturados", icon: Users, part: "parte-2" },
  { id: "whatsapp-conectar", title: "Conectando o WhatsApp", icon: Smartphone, part: "parte-3" },
  { id: "broadcast", title: "Disparos em Massa", icon: Send, part: "parte-3" },
  { id: "logs", title: "Histórico e Logs", icon: History, part: "parte-3" },
  { id: "perfil", title: "Perfil da Empresa", icon: Building2, part: "parte-4" },
  { id: "cobranca", title: "Dados de Cobrança", icon: CreditCard, part: "parte-4" },
  { id: "conta", title: "Conta e Segurança", icon: User, part: "parte-4" },
  { id: "planos", title: "Planos e Assinatura", icon: Shield, part: "parte-4" },
];

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================

function DocsSidebar({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="space-y-6">
      {PARTS.map((part) => {
        const partChapters = CHAPTERS.filter((c) => c.part === part.id);
        return (
          <div key={part.id}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 px-3">
              {part.label}
            </h4>
            <div className="space-y-1">
              {partChapters.map((chapter) => {
                const isActive = activeSection === chapter.id;
                const Icon = chapter.icon;
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => onNavigate(chapter.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{chapter.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80 flex items-start gap-2">
      <span className="text-lg leading-none mt-0.5">💡</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-foreground/80 flex items-start gap-2">
      <span className="text-lg leading-none mt-0.5">⚠️</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-border my-10" />;
}

// ============================================================================
// MAIN DOCS PAGE
// ============================================================================

export default function AdminDocsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("bem-vindo");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );

    CHAPTERS.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Show scroll-to-top button
  useEffect(() => {
    // Find the main scroll container from AdminShell
    const container = document.querySelector("main > div.overflow-y-auto");
    if (!container) return;
    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle hash navigation on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  const handleNavigate = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.history.replaceState(null, "", `#${id}`);
  };

  const scrollToTop = () => {
    const container = document.querySelector("main > div.overflow-y-auto");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-start gap-8 mx-auto max-w-7xl relative">
      {/* Sidebar de Navegação (dentro do conteúdo, não conflita com admin sidebar) */}
      <aside className="hidden lg:block w-72 flex-shrink-0 overflow-y-auto pr-4 border-r border-border py-4 sticky top-0 max-h-[calc(100vh-8rem)] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        <div className="mb-6 px-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <BookOpen className="w-4 h-4" />
            Guia de Uso
          </div>
        </div>
        <DocsSidebar activeSection={activeSection} onNavigate={handleNavigate} />
      </aside>

      {/* Conteúdo Principal */}
      <div
        id="docs-scroll-container"
        className="flex-1 py-4 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Documentação de Uso
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Guia completo de todas as funcionalidades do painel Vórtex+.
              Aprenda a criar campanhas, gerenciar grupos, capturar leads e
              muito mais.
            </p>
          </div>

          {/* ================================================================ */}
          {/* PARTE I — PRIMEIROS PASSOS */}
          {/* ================================================================ */}

          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Parte I
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Primeiros Passos
            </h2>
          </div>

          {/* Cap 1: Bem-vindo */}
          <section id="bem-vindo" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                1. Bem-vindo ao Vórtex+
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                O <strong className="text-foreground">Vórtex+</strong> é uma
                plataforma de validação de ofertas e hospedagem de landing pages de alta performance. Com ele,
                você hospeda seu código, cria páginas de captura ou vendas personalizadas, gerencia grupos de
                WhatsApp e acompanha seus resultados em tempo real para descobrir se sua oferta vende antes de escalar.
              </p>

              <div id="login" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Como acessar o painel
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>
                    Acesse a página de login em{" "}
                    <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      /admin/login
                    </code>
                  </li>
                  <li>
                    Insira seu <strong>email</strong> cadastrado
                  </li>
                  <li>
                    Um código de <strong>6 dígitos</strong> será enviado para o
                    seu email
                  </li>
                  <li>
                    Digite o código na tela de verificação (válido por 5
                    minutos)
                  </li>
                  <li>Pronto! Você será redirecionado ao painel.</li>
                </ol>
              </div>

              <div id="registro" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Criando uma conta nova
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>
                    Na página de login, clique na aba{" "}
                    <strong>&quot;Criar conta&quot;</strong>
                  </li>
                  <li>
                    Preencha: <strong>seu nome</strong>,{" "}
                    <strong>email</strong> e{" "}
                    <strong>nome da empresa</strong>
                  </li>
                  <li>
                    Um código OTP será enviado ao email informado
                  </li>
                  <li>
                    Após a verificação, seu ambiente será criado
                    automaticamente com o plano Free
                  </li>
                </ol>
              </div>

              <Tip>
                Não precisa de senha! O Vórtex+ usa autenticação por código de
                verificação via email, garantindo mais segurança para a sua
                conta.
              </Tip>
            </div>
          </section>

          {/* Cap 2: Dashboard */}
          <section id="dashboard" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                2. Conhecendo o Dashboard
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                O Dashboard é a primeira tela que você vê ao entrar. Ele mostra
                um resumo completo do desempenho das suas campanhas.
              </p>

              <div id="dashboard-kpis" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Indicadores Chave
                </h3>
                <p className="text-sm">
                  No topo do Dashboard, quatro cards mostram métricas
                  importantes:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong className="text-foreground">Campanhas</strong> —
                    quantidade de campanhas ativas no momento
                  </li>
                  <li>
                    <strong className="text-foreground">Leads Totais</strong> —
                    total de contatos capturados em todas as campanhas
                  </li>
                  <li>
                    <strong className="text-foreground">Grupos Ativos</strong> —
                    quantos grupos de WhatsApp estão recebendo leads
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Média / Campanha
                    </strong>{" "}
                    — média de leads por campanha ativa
                  </li>
                </ul>
              </div>

              <div id="dashboard-grafico" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Gráfico de Leads por Dia
                </h3>
                <p className="text-sm">
                  Logo abaixo dos KPIs, um gráfico interativo mostra a evolução
                  dos seus leads ao longo do tempo:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    Alterne entre <strong>7 dias</strong> ou{" "}
                    <strong>30 dias</strong>
                  </li>
                  <li>
                    Filtre por uma <strong>campanha específica</strong> ou veja
                    todas juntas
                  </li>
                  <li>
                    Passe o mouse sobre o gráfico para ver detalhes de cada dia
                  </li>
                </ul>
              </div>

              <div id="dashboard-cards" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Cards de Campanhas
                </h3>
                <p className="text-sm">
                  Na parte inferior, cada campanha ativa aparece como um card
                  com o nome da campanha, total de leads e a barra de progresso
                  de cada grupo. Clique no card para ir aos detalhes da
                  campanha.
                </p>
              </div>
            </div>
          </section>

          <SectionDivider />

          {/* ================================================================ */}
          {/* PARTE II — CAMPANHAS */}
          {/* ================================================================ */}

          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Parte II
            </span>
            <h2 className="text-lg font-bold text-foreground">Campanhas</h2>
          </div>

          {/* Cap 3: Lista de Campanhas */}
          <section id="lista-campanhas" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Megaphone className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                3. Lista de Campanhas
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                A página de Campanhas lista todas as suas campanhas (ativas e
                inativas). Cada card mostra:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong className="text-foreground">Nome</strong> — o título
                  da campanha
                </li>
                <li>
                  <strong className="text-foreground">Slug</strong> — o
                  endereço público (ex:{" "}
                  <code className="font-mono text-xs">/meu-lancamento</code>)
                </li>
                <li>
                  <strong className="text-foreground">Status</strong> — badge
                  verde para Ativa ou cinza para Inativa
                </li>
                <li>
                  <strong className="text-foreground">Leads e Grupos</strong> —
                  contagem total de leads e grupos associados
                </li>
              </ul>
              <p className="text-sm">
                Clique em qualquer card para acessar os detalhes daquela
                campanha.
              </p>
            </div>
          </section>

          {/* Cap 4: Criando uma Campanha */}
          <section id="criar-campanha" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                4. Criando uma Campanha
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Para criar uma nova campanha, clique no botão{" "}
                <strong>&quot;Nova Campanha&quot;</strong> e siga o assistente
                de 3 etapas:
              </p>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Etapa 1 — Configuração
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li id="campo-nome">
                    <strong className="text-foreground">
                      Nome da Campanha
                    </strong>{" "}
                    — Um nome claro para identificar sua campanha (ex:
                    &quot;Lançamento Mentoria 2026&quot;)
                  </li>
                  <li id="campo-slug">
                    <strong className="text-foreground">Slug (URL)</strong> — O
                    endereço público da sua página de captura. Use apenas
                    letras minúsculas, números e hífens. Aparecerá como{" "}
                    <code className="font-mono text-xs text-primary bg-primary/10 px-1 py-0.5 rounded">
                      vortexpages.online/seu-slug
                    </code>
                  </li>
                  <li id="campo-dominio" className="space-y-3">
                    <strong className="text-foreground flex items-center gap-2">
                      <PlanBadge plan='ULTRA' /> Domínio Customizado
                    </strong>
                    <p>
                      Permite utilizar seu próprio domínio (ex: <code className="font-mono text-xs">campanha.meudominio.com.br</code>) em vez do slug da Vórtex.
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3 border border-border">
                      <p className="font-medium text-foreground">Como configurar e fazer funcionar:</p>
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>Acesse o painel do seu provedor de domínio (Cloudflare, HostGator, Registro.br, etc).</li>
                        <li>Crie um novo registro de DNS do tipo <strong>CNAME</strong>.</li>
                        <li>No campo "Nome" ou "Host", coloque o subdomínio (ex: <code>campanha</code>).</li>
                        <li>No campo "Destino" ou "Alvo", aponte para <code>vortexpages.online</code>.</li>
                        <li>Volte ao Vórtex+ e digite o domínio completo (ex: <code>campanha.meudominio.com.br</code>) no campo de Domínio Customizado.</li>
                      </ol>
                    </div>
                    <Warning>
                      <strong>Importante:</strong> Sempre que o domínio customizado for ativado, o <strong>domínio padrão e o domínio protegido (seguro) são desativados automaticamente</strong>. 
                      Isso torna a sua página muito <strong>mais segura</strong>, pois garante exclusividade total ao seu funil, evitando qualquer vazamento dos links originais da plataforma. Seus leads só poderão acessar a página usando a sua própria marca, passando muito mais profissionalismo.
                    </Warning>
                  </li>
                  <li id="campo-pixel">
                    <strong className="text-foreground">
                      Meta Pixel ID
                    </strong>{" "}
                    Opcional — Se você utiliza anúncios no Facebook ou
                    Instagram, insira o ID do seu pixel. O Vórtex+ disparará
                    eventos de conversão automaticamente quando um lead se
                    cadastrar.
                  </li>
                </ul>
                <Tip>
                  Dica: Fique atento aos <strong>ícones de ajuda (?)</strong> ao lado de cada campo! Eles abrem dicas rápidas (Tooltips) para explicar cada configuração, além de links diretos para esta documentação.
                </Tip>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Etapa 2 — Conteúdo
                </h3>

                <div id="campo-html" className="space-y-2">
                  <h4 className="text-foreground text-sm font-medium">
                    HTML Customizado
                  </h4>
                  <p className="text-sm">
                    Cole aqui o HTML completo da sua landing page. O Vórtex+ permite que você crie sua página em qualquer ferramenta (Webflow, Figma, Framer, IA como Bolt/v0, ou codificação manual) e hospede diretamente conosco.
                  </p>
                </div>

                <div id="tag-form-slot" className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="text-foreground text-sm font-medium">
                    A Tag Especial: {`{{FORM_SLOT}}`}
                  </h4>
                  <p className="text-sm">
                    Para capturar leads, insira a tag{" "}
                    <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {`{{FORM_SLOT}}`}
                    </code>{" "}
                    no local exato do seu HTML onde o formulário deve aparecer. O Vórtex+ substituirá essa tag pelo formulário dinâmico.
                  </p>
                </div>
                
                <div id="html-videos" className="space-y-2 mt-4 border-l-2 border-border pl-4">
                  <h4 className="text-foreground text-sm font-medium flex items-center gap-2">
                    Vídeos (Vturb, YouTube, Vimeo)
                  </h4>
                  <p className="text-sm">
                    Para inserir vídeos de vendas (VSL), você deve utilizar a tag <code className="font-mono text-xs text-primary">{"<iframe>"}</code>. Scripts de players externos são bloqueados por segurança.
                  </p>
                  <p className="text-sm font-semibold mt-2">Exemplo Vturb:</p>
                  <div className="bg-background rounded p-2 text-xs font-mono overflow-x-auto border border-border">
                    {`<iframe src="https://scripts.converteai.net/xxxx/players/xxxx/embed.html" id="igr-video" style="width:100%;height:100%;" allowfullscreen></iframe>`}
                  </div>
                </div>

                <div id="html-checkout" className="space-y-2 mt-4 border-l-2 border-border pl-4">
                  <h4 className="text-foreground text-sm font-medium flex items-center gap-2">
                    Botões de Checkout
                  </h4>
                  <p className="text-sm">
                    Se sua página for de vendas diretas e não de captura de leads, você não precisa usar a tag FORM_SLOT. Apenas insira links normais para o seu checkout (Hotmart, Kiwify, Eduzz, etc).
                  </p>
                  <div className="bg-background rounded p-2 text-xs font-mono overflow-x-auto border border-border">
                    {`<a href="https://pay.kiwify.com.br/xxxxx" class="botao-comprar" target="_blank">Quero Comprar Agora</a>`}
                  </div>
                </div>

                <div id="html-imagens" className="space-y-2 mt-4 border-l-2 border-border pl-4">
                  <h4 className="text-foreground text-sm font-medium flex items-center gap-2">
                    Imagens via URL e Performance
                  </h4>
                  <p className="text-sm">
                    O Vórtex+ hospeda seu código, mas não arquivos de mídia. Todas as imagens devem ser inseridas através de links (URLs).
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                    <li>Hospede suas imagens em CDNs como Cloudflare R2, MinIO ou Imgur.</li>
                    <li>Sempre converta suas imagens para <strong>WebP</strong> ou <strong>AVIF</strong> antes de usar.</li>
                    <li>Use ferramentas como TinyPNG ou Squoosh para comprimir.</li>
                    <li>Sempre defina os atributos <code className="font-mono text-[10px]">width</code> e <code className="font-mono text-[10px]">height</code> no HTML para evitar <a href="https://web.dev/cls/" target="_blank" className="text-primary hover:underline">Cumulative Layout Shift (CLS)</a>, garantindo uma boa nota no Google Lighthouse.</li>
                    <li>Use <code className="font-mono text-[10px]">loading="lazy"</code> para imagens que ficam abaixo da dobra.</li>
                  </ul>
                </div>

                <div id="html-bloqueado" className="space-y-2 mt-4 border-l-2 border-destructive/50 pl-4">
                  <h4 className="text-foreground text-sm font-medium flex items-center gap-2">
                    O que é Bloqueado?
                  </h4>
                  <p className="text-sm">
                    Para garantir que nenhuma campanha maliciosa derrube o servidor (XSS), o Vórtex+ utiliza sanitização rigorosa (DOMPurify).
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-2 text-muted-foreground">
                    <li>A tag <code className="font-mono text-[10px]">{"<script>"}</code> é totalmente removida.</li>
                    <li>Eventos inline (como <code className="font-mono text-[10px]">onclick</code>, <code className="font-mono text-[10px]">onload</code>, <code className="font-mono text-[10px]">onerror</code>) são removidos.</li>
                    <li>Tags como <code className="font-mono text-[10px]">{"<object>"}</code> e <code className="font-mono text-[10px]">{"<embed>"}</code> são removidas.</li>
                  </ul>
                  <p className="text-xs font-semibold text-foreground mt-2">Dica: Todo o estilo CSS deve ser inserido na tag <code className="font-mono text-[10px]">{"<style>"}</code>. O formulário injetado pode ser estilizado usando a classe pai <code className="font-mono text-[10px]">.vortex-form</code>.</p>
                </div>

                <div className="space-y-2 mt-6">
                  <h4 className="text-foreground text-sm font-medium">
                    Templates Prontos
                  </h4>
                  <p className="text-sm">
                    Se você não tem HTML próprio, utilize os templates prontos disponíveis no seletor. Basta escolher um e personalizar.
                  </p>
                </div>

                <div id="campo-formulario" className="space-y-2 mt-4">
                  <h4 className="text-foreground text-sm font-medium">
                    Construtor de Formulário
                  </h4>
                  <p className="text-sm">
                    Se for capturar leads, monte as perguntas no construtor dinâmico:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Tipos de campo: texto, email, número.</li>
                    <li>Defina se cada campo é <strong>obrigatório ou opcional</strong>.</li>
                    <li>Use os <strong>botões rápidos</strong> para adicionar campos comuns com um clique.</li>
                  </ul>
                </div>
              </div>

              <div id="wizard-etapa-grupo" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Etapa 3 — Grupo WhatsApp
                </h3>
                <p className="text-sm">
                  Nesta etapa você pode criar um grupo inicial para a campanha:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    <strong>Nome do Grupo</strong> — o nome que aparecerá na
                    lista de grupos
                  </li>
                  <li>
                    <strong>Link do Grupo</strong> — link de convite do
                    WhatsApp no formato chat.whatsapp.com
                  </li>
                  <li id="campo-lotacao">
                    <strong>Capacidade Máxima</strong> — quando o grupo atingir
                    essa quantidade de pessoas, os próximos leads serão
                    redirecionados para o próximo grupo
                  </li>
                </ul>
                <Tip>
                  Você pode pular esta etapa e adicionar grupos depois na aba
                  &quot;Grupos WhatsApp&quot; dentro dos detalhes da campanha.
                </Tip>
              </div>
            </div>
          </section>

          {/* Cap 5: Detalhes da Campanha */}
          <section id="detalhes-campanha" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                5. Detalhes da Campanha
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Ao clicar em uma campanha, você acessa a página de detalhes com
                três abas: <strong>Detalhes</strong>,{" "}
                <strong>Grupos WhatsApp</strong> e{" "}
                <strong>Leads Capturados</strong>.
              </p>

              <div id="campanha-links" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links de Acesso
                </h3>
                <p className="text-sm">O painel centraliza todos os acessos em três blocos, dependendo de quais configurações você ativou:</p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Domínio Padrão
                    </strong>{" "}
                    — O link clássico usando o seu slug como vortexpages.online/slug. Sempre visível, mas fica bloqueado se você configurar um domínio customizado.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Domínio Protegido
                    </strong>{" "}
                    — Aparece ao ativar a proteção da campanha. Substitui seu slug por um código único UUID para esconder sua página de concorrentes e curiosos.
                  </li>
                  <li>
                    <strong className="text-foreground flex items-center gap-2 mb-1">
                      <PlanBadge plan='ULTRA' /> Domínio Customizado
                    </strong>{" "}
                    — Aparece se você configurou o seu domínio próprio na campanha. Quando o domínio customizado é ativado, ele <strong>desativa o domínio seguro e o domínio padrão</strong>. Isso torna o seu funil muito mais seguro, pois isola o acesso 100% na sua marca, bloqueando curiosos que tentarem descobrir a URL original da Vórtex.
                  </li>
                </ul>
                <p className="text-sm">
                  Cada bloco possui o link de <strong>Captura</strong> para divulgar nos anúncios e o de <strong>Redirecionamento</strong> para onde o lead vai após cadastrar para ativar o Meta Pixel. Use o botão de copiar para pegar a URL exata!
                </p>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Controles da Campanha
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li id="campanha-ativar-pausar">
                    <strong className="text-foreground flex items-center gap-1">
                      <Power className="h-3 w-3" /> Ativar / Pausar
                    </strong>{" "}
                    — campanhas pausadas param de aceitar novos leads. Os dados
                    existentes são preservados.
                  </li>
                  <li id="campanha-proteger">
                    <strong className="text-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Proteger Campanha
                    </strong>{" "}
                    — ao ativar a proteção, a URL pública é substituída por um
                    código UUID único. Isso dificulta que pessoas copiem ou
                    façam scraping do seu funil.
                  </li>
                  <li id="campanha-excluir">
                    <strong className="text-foreground flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> Excluir Campanha
                    </strong>{" "}
                    — remove a campanha, todos os grupos e leads associados.
                    <Warning>
                      Esta ação é <strong>irreversível</strong>. Exporte seus
                      dados antes de excluir.
                    </Warning>
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Editando a Campanha
                </h3>
                <p className="text-sm">
                  Na seção de edição, você pode alterar a qualquer momento:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Nome da campanha</li>
                  <li>Slug da URL pública</li>
                  <li>Meta Pixel ID</li>
                  <li>HTML da página de captura</li>
                  <li>
                    Campos do formulário
                  </li>
                </ul>
                <p className="text-sm">
                  Após editar, clique em{" "}
                  <strong>&quot;Salvar Alterações&quot;</strong> para aplicar.
                </p>
              </div>
            </div>
          </section>

          {/* Cap 6: Grupos */}
          <section id="grupos" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                6. Grupos de WhatsApp
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Os grupos são os destinos para onde os leads são redirecionados
                após o cadastro. Acesse a aba{" "}
                <strong>&quot;Grupos WhatsApp&quot;</strong> dentro de uma
                campanha.
              </p>

              <div id="rotacao-grupos" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Rotação Automática
                </h3>
                <p className="text-sm">
                  Quando o primeiro grupo atinge a lotação máxima, o Vórtex+
                  automaticamente redireciona os próximos leads para o grupo
                  seguinte na fila. Isso garante que nenhum grupo fique
                  superlotado.
                </p>
              </div>

              <div id="grupo-criar" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Adicionando Grupos
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="pl-4 border-l-2 border-border space-y-1">
                    <h4 className="text-foreground font-medium">
                      Modo Manual inserindo link
                    </h4>
                    <p>
                      Crie o grupo no WhatsApp, copie o link de convite e cole
                      no campo &quot;Link de Convite&quot;. Defina o nome e a
                      lotação máxima.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-primary/30 space-y-1">
                    <h4 className="text-foreground font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3 text-primary" />
                      <PlanBadge plan='ULTRA' /> Modo Automático
                    </h4>
                    <p>
                      Com o WhatsApp conectado, o Vórtex+ cria o grupo
                      diretamente pelo seu WhatsApp. Você define:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <strong>Nome do Grupo</strong> — nome que aparecerá no
                        WhatsApp
                      </li>
                      <li>
                        <strong>Número Auxiliar</strong> — obrigatório, pois o
                        WhatsApp exige pelo menos 1 participante para criar o
                        grupo
                      </li>
                      <li>
                        <strong>Descrição</strong> opcional — texto de
                        boas-vindas do grupo
                      </li>
                      <li>
                        <strong>Foto</strong> opcional — imagem de perfil do
                        grupo
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div id="padrao-grupos" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium flex items-center">
                  Padrão para Auto-Criação de Grupos <PlanBadge plan='ULTRA' className='ml-2' />
                </h3>
                <p className="text-sm">
                  Se você utilizar o modo Automático, pode definir regras que os grupos gerados herdarão:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li id="campo-capacidade">
                    <strong>Capacidade Máxima do Grupo</strong> — define qual será o limite do WhatsApp (recomendado 1000) para acionar o redirecionamento do rotacionador.
                  </li>
                  <li id="campo-suporte">
                    <strong>Números de Suporte (Administradores)</strong> — adicione os números (separados por vírgula) que a sua equipe usa. Eles serão inseridos e promovidos a admins instantaneamente logo que o grupo nascer.
                  </li>
                  <li id="campo-imagem">
                    <strong>Foto Padrão do Grupo</strong> — URL pública da imagem que será definida na foto de perfil do grupo no WhatsApp.
                  </li>
                  <li id="campo-desc">
                    <strong>Descrição Padrão do Grupo</strong> — o texto que vai na descrição do grupo, ótimo para definir regras e as boas-vindas.
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Criação em Massa <PlanBadge plan='ULTRA' className='ml-2' />
                </h3>
                <p className="text-sm">
                  No plano Ultra, o botão &quot;Criar em Massa&quot; permite
                  criar vários grupos de uma vez, definindo um padrão de
                  nomenclatura e a quantidade desejada.
                </p>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Ações por Grupo
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong>Editar URL</strong> — clique no link do grupo para
                    alterar o convite
                  </li>
                  <li>
                    <strong>Ativar / Pausar</strong> — grupos pausados não
                    recebem novos leads
                  </li>
                  <li>
                    <strong className="inline-flex items-center gap-2"><PlanBadge plan='ULTRA' /> Sincronizar</strong> — atualiza a contagem
                    real de membros do grupo no WhatsApp
                  </li>
                  <li>
                    <strong>Excluir</strong> — remove o grupo da campanha
                  </li>
                </ul>
              </div>

              <Tip>
                A barra de progresso de cada grupo mostra visualmente o
                preenchimento. Cores: <strong>verde</strong> para normal,{" "}
                <strong>laranja</strong> acima de 80%,{" "}
                <strong>vermelho</strong> quando cheio ou acima de 100%.
              </Tip>
            </div>
          </section>

          {/* Cap 7: Leads */}
          <section id="leads" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">7. Leads Capturados</h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                A aba <strong>&quot;Leads Capturados&quot;</strong> mostra todos
                os contatos que se cadastraram na sua campanha.
              </p>

              <div id="leads-status" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Status dos Leads
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-chart-2/5 border border-chart-2/20 p-3">
                    <p className="font-medium text-chart-2">Aguardando</p>
                    <p className="text-xs mt-1">
                      O lead se cadastrou mas ainda não entrou no grupo
                    </p>
                  </div>
                  <div className="rounded-lg bg-chart-1/5 border border-chart-1/20 p-3">
                    <p className="font-medium text-chart-1">No grupo</p>
                    <p className="text-xs mt-1">
                      O lead entrou com sucesso no grupo do WhatsApp
                    </p>
                  </div>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <p className="font-medium text-destructive">Não entrou</p>
                    <p className="text-xs mt-1">
                      O lead não conseguiu entrar (link inválido, grupo cheio,
                      etc.)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Informações de cada Lead
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nome e WhatsApp do lead</li>
                  <li>Respostas do formulário e perguntas extras</li>
                  <li>Nome do grupo para o qual foi direcionado</li>
                  <li>Data e hora do cadastro</li>
                  <li>
                    Metadados de rastreamento como IP, dispositivo e localização
                  </li>
                </ul>
              </div>

              <div id="leads-sincronizar" className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <PlanBadge plan='ULTRA' /> Sincronizar Leads
                </h3>
                <p>
                  Disponível apenas no plano Ultra. Ao clicar em
                  &quot;Sincronizar&quot;, o sistema verifica quais leads
                  realmente entraram no grupo do WhatsApp e atualiza os status
                  automaticamente.
                </p>
              </div>

              <div id="leads-exportar" className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportação CSV
                </h3>
                <p>
                  Você pode exportar toda a sua base de leads para um arquivo CSV clicando no botão "Exportar CSV". O arquivo será gerado instantaneamente com todas as respostas personalizadas do formulário, metadados de acesso (IP, Cidade, Aparelho) e status de grupo de cada lead.
                </p>
              </div>
            </div>
          </section>

          <SectionDivider />

          {/* ================================================================ */}
          {/* PARTE III — WHATSAPP ULTRA */}
          {/* ================================================================ */}

          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Parte III
            </span>
            <h2 className="text-lg font-bold text-foreground">
              <PlanBadge plan='ULTRA' /> WhatsApp
            </h2>
          </div>

          <Tip>
            As funcionalidades desta seção estão disponíveis exclusivamente para
            o <strong>plano Ultra</strong>. Faça upgrade nas Configurações para
            desbloquear.
          </Tip>

          {/* Cap 8: Conectando WhatsApp */}
          <section id="whatsapp-conectar" className="scroll-mt-8 space-y-6 mb-12 mt-6">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                8. Conectando o WhatsApp
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Para usar os recursos de WhatsApp (criar grupos automáticos,
                disparos, sincronização), primeiro conecte seu número.
              </p>

              <div id="whatsapp-numero" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Passo 1 — Informar o Número
                </h3>
                <p className="text-sm">
                  Digite o número do WhatsApp no formato internacional: código
                  do país + DDD + número.
                </p>
                <p className="text-sm">
                  Exemplo:{" "}
                  <code className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    5511999999999
                  </code>
                </p>
              </div>

              <div id="whatsapp-qrcode" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Passo 2 — Conectar
                </h3>
                <p className="text-sm">
                  Após informar o número, existem duas formas de conectar:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong>Código de Confirmação</strong> — você receberá uma
                    notificação no WhatsApp pedindo para inserir um código
                    numérico exibido na tela
                  </li>
                  <li>
                    <strong>QR Code</strong> — abra o WhatsApp no celular, vá
                    em <em>Dispositivos Conectados</em> e escaneie o QR Code
                  </li>
                </ul>
                <Tip>
                  O QR Code é renovado automaticamente a cada 45 segundos. Se
                  expirar, clique em &quot;Gerar novo código&quot;.
                </Tip>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Passo 3 — Conectado!
                </h3>
                <p className="text-sm">
                  Após a conexão, você verá a confirmação com o número
                  conectado. A partir daqui, todas as funcionalidades de
                  WhatsApp estarão disponíveis.
                </p>
                <p className="text-sm">
                  Para <strong>desconectar</strong>, clique no botão
                  &quot;Desconectar&quot; na mesma página.
                </p>
              </div>
            </div>
          </section>

          {/* Cap 9: Disparos */}
          <section id="broadcast" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Send className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                9. Disparos em Massa
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Na aba <strong>&quot;Disparos&quot;</strong>, você pode enviar
                mensagens para todos os grupos de uma campanha de uma só vez.
              </p>

              <div id="broadcast-enviar" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Como enviar um disparo
                </h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>
                    <strong>Selecione a campanha</strong> — escolha para qual
                    campanha deseja enviar
                  </li>
                  <li>
                    <strong>Escolha os grupos</strong> — envie para
                    &quot;Todos os grupos&quot; ou selecione grupos específicos
                  </li>
                  <li id="broadcast-mensagem">
                    <strong>Escreva a mensagem</strong> — até 4.096 caracteres,
                    incluindo emojis
                  </li>
                  <li>
                    <strong>Confirme o envio</strong> — revise a mensagem na
                    tela de confirmação antes de enviar
                  </li>
                </ol>
              </div>

              <div id="broadcast-jid" className="space-y-2">
                <Warning>
                  Grupos que aparecem com o aviso &quot;sem JID&quot; não
                  receberão mensagens. Para resolver, vá até a aba de Grupos da
                  campanha e clique em &quot;Sincronizar&quot; para vincular o
                  grupo ao WhatsApp.
                </Warning>
              </div>
            </div>
          </section>

          {/* Cap 10: Logs */}
          <section id="logs" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                10. Histórico e Logs
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                A aba <strong>&quot;Histórico e Logs&quot;</strong> mostra todas
                as mensagens enviadas e seus resultados.
              </p>

              <div id="logs-kpis" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  KPIs de Mensagens
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>
                    <strong className="text-foreground">
                      Total de Disparos
                    </strong>{" "}
                    — quantas mensagens foram enviadas no total
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Taxa de Sucesso
                    </strong>{" "}
                    — porcentagem de mensagens entregues com sucesso
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Grupos Alcançados
                    </strong>{" "}
                    — quantos grupos únicos receberam mensagens
                  </li>
                </ul>
              </div>

              <div id="logs-status" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Status das Mensagens
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-chart-1/5 border border-chart-1/20 p-3">
                    <p className="font-medium text-chart-1">Enviado</p>
                    <p className="text-xs mt-1">
                      Entregue com sucesso a todos os grupos
                    </p>
                  </div>
                  <div className="rounded-lg bg-chart-2/5 border border-chart-2/20 p-3">
                    <p className="font-medium text-chart-2">Parcial</p>
                    <p className="text-xs mt-1">
                      Entregue a alguns grupos, falhou em outros
                    </p>
                  </div>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <p className="font-medium text-destructive">Falhou</p>
                    <p className="text-xs mt-1">
                      Não foi entregue a nenhum grupo
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 border border-border p-3">
                    <p className="font-medium text-muted-foreground">
                      Pendente
                    </p>
                    <p className="text-xs mt-1">
                      Aguardando processamento
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <SectionDivider />

          {/* ================================================================ */}
          {/* PARTE IV — CONFIGURAÇÕES */}
          {/* ================================================================ */}

          <div className="mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Parte IV
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Configurações
            </h2>
          </div>

          {/* Cap 11: Perfil */}
          <section id="perfil" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                11. Perfil da Empresa
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Na aba <strong>&quot;Perfil&quot;</strong> das Configurações, você pode
                editar os dados da sua empresa:
              </p>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <ul className="list-disc pl-5 space-y-2">
                  <li id="perfil-nome">
                    <strong className="text-foreground">
                      Nome da empresa
                    </strong>{" "}
                    — aparece na sidebar do painel e identifica o seu ambiente
                  </li>
                  <li id="perfil-subdominio">
                    <strong className="text-foreground">Subdomínio</strong> — o
                    prefixo do seu domínio personalizado (ex:{" "}
                    <code className="font-mono text-xs">
                      minha-empresa.vortexpages.online
                    </code>
                    ). Use apenas letras minúsculas, números e hífens.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cap 12: Cobrança */}
          <section id="cobranca" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                12. Dados de Cobrança
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Ainda na aba Perfil, a seção de{" "}
                <strong>Dados de Cobrança</strong> é obrigatória para assinar
                os planos Pro e Ultra.
              </p>

              <div id="cobranca-dados" className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Campos disponíveis
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Tipo de Pessoa</strong> — Pessoa Física usando CPF ou
                    Jurídica usando CNPJ
                  </li>
                  <li>
                    <strong>CPF ou CNPJ</strong> — documento fiscal do
                    responsável
                  </li>
                  <li>
                    <strong>Razão Social</strong> — apenas para Pessoa Jurídica
                  </li>
                  <li>
                    <strong>Telefone / WhatsApp</strong> — número para contato
                    sobre cobranças
                  </li>
                  <li>
                    <strong>Endereço completo</strong> — CEP, logradouro,
                    número, complemento, bairro, cidade e estado
                  </li>
                </ul>
              </div>

              <Tip>
                Esses dados são usados apenas para emissão de faturas e não são
                compartilhados com terceiros.
              </Tip>
            </div>
          </section>

          {/* Cap 13: Conta */}
          <section id="conta" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                13. Conta e Segurança
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Na aba <strong>&quot;Conta&quot;</strong> das Configurações:
              </p>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Dados Pessoais
                </h3>
                <p>
                  Altere o seu <strong>nome de exibição</strong> que aparece no
                  painel.
                </p>
              </div>

              <div id="conta-email" className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Alterando o Email de Acesso
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Insira o <strong>novo email</strong> desejado
                  </li>
                  <li>
                    Clique em{" "}
                    <strong>
                      &quot;Enviar código de verificação&quot;
                    </strong>
                  </li>
                  <li>
                    Um código OTP de 6 dígitos será enviado ao{" "}
                    <strong>novo email</strong>
                  </li>
                  <li>
                    Digite o código para confirmar a alteração
                  </li>
                </ol>
                <Warning>
                  Após a confirmação, você será deslogado e precisará entrar
                  novamente com o novo email.
                </Warning>
              </div>
            </div>
          </section>

          {/* Cap 14: Planos */}
          <section id="planos" className="scroll-mt-8 space-y-6 mb-12">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">
                14. Planos e Assinatura
              </h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Na aba <strong>&quot;Assinatura&quot;</strong> das
                Configurações, gerencie seu plano.
              </p>

              <div id="planos-comparacao" className="bg-card border border-border p-5 rounded-xl space-y-3">
                <h3 className="text-foreground font-medium">
                  Comparação de Planos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-foreground">
                          Recurso
                        </th>
                        <th className="text-center py-2 px-2 font-medium text-foreground">
                          Free
                        </th>
                        <th className="text-center py-2 px-2 font-medium text-primary">
                          Pro
                        </th>
                        <th className="text-center py-2 px-2 font-medium text-primary">
                          Ultra
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-2 pr-4">Campanhas</td>
                        <td className="text-center py-2 px-2">1</td>
                        <td className="text-center py-2 px-2">10</td>
                        <td className="text-center py-2 px-2">∞</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Leads/mês</td>
                        <td className="text-center py-2 px-2">100</td>
                        <td className="text-center py-2 px-2">10.000</td>
                        <td className="text-center py-2 px-2">∞</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Grupos</td>
                        <td className="text-center py-2 px-2">3</td>
                        <td className="text-center py-2 px-2">50</td>
                        <td className="text-center py-2 px-2">∞</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">WhatsApp</td>
                        <td className="text-center py-2 px-2">—</td>
                        <td className="text-center py-2 px-2">—</td>
                        <td className="text-center py-2 px-2">✅</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Marca Vórtex+</td>
                        <td className="text-center py-2 px-2">Sim</td>
                        <td className="text-center py-2 px-2">Sem</td>
                        <td className="text-center py-2 px-2">Sem</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Preço</td>
                        <td className="text-center py-2 px-2 font-medium">
                          Grátis
                        </td>
                        <td className="text-center py-2 px-2 font-medium text-primary">
                          R$ 97/mês
                        </td>
                        <td className="text-center py-2 px-2 font-medium text-primary">
                          R$ 157/mês
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Uso do Plano
                </h3>
                <p>
                  As barras de progresso mostram quanto dos seus recursos
                  como campanhas, grupos e leads já foram utilizados. Quando as
                  barras ficam <strong className="text-destructive">vermelhas</strong>, você está
                  próximo do limite.
                </p>
              </div>

              <div id="planos-upgrade" className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Fazendo Upgrade
                </h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Na seção &quot;Escolher Plano&quot;, clique em{" "}
                    <strong>&quot;Fazer upgrade&quot;</strong> no plano desejado
                  </li>
                  <li>
                    Se seus dados de cobrança não estiverem preenchidos, um
                    formulário será exibido automaticamente
                  </li>
                  <li>
                    Você será redirecionado para a página de pagamento
                  </li>
                  <li>
                    Após o pagamento, o plano é ativado automaticamente
                  </li>
                </ol>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Status da Assinatura
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-emerald-500">Ativo</strong> — tudo
                    funcionando normalmente
                  </li>
                  <li>
                    <strong className="text-yellow-500">
                      Cancelamento agendado
                    </strong>{" "}
                    — você cancelou, mas mantém acesso até o final do ciclo pago
                  </li>
                  <li>
                    <strong className="text-destructive">
                      Pagamento vencido
                    </strong>{" "}
                    — fatura em atraso; o acesso às campanhas pode ser bloqueado
                  </li>
                  <li>
                    <strong className="text-blue-500">
                      Aguardando pagamento
                    </strong>{" "}
                    — upgrade solicitado, aguardando confirmação de pagamento
                  </li>
                </ul>
              </div>

              <div id="planos-cancelar" className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Cancelando a Assinatura
                </h3>
                <p>
                  Ao cancelar, você <strong>mantém acesso</strong> ao plano
                  atual até o final do ciclo já pago. Após essa data, a conta
                  volta automaticamente para o plano Free.
                </p>
                <p>
                  É possível <strong>reativar</strong> a assinatura a qualquer
                  momento enquanto estiver no período de cancelamento agendado.
                </p>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl space-y-3 text-sm">
                <h3 className="text-foreground font-medium">
                  Verificando Pagamento Pendente
                </h3>
                <p>
                  Se você fez um upgrade e o pagamento está pendente, clique
                  em{" "}
                  <strong>
                    &quot;Já paguei — Verificar agora&quot;
                  </strong>{" "}
                  para que o sistema consulte o status atualizado junto ao
                  provedor de pagamento.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* RODAPÉ */}
          {/* ================================================================ */}

          <div className="mt-16 pt-8 border-t border-border text-center">
            <div className="flex items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Vortex Padrão.svg"
                alt="Vórtex+"
                className="h-4 w-auto invert opacity-50"
              />
              <span className="text-sm text-muted-foreground">
                Documentação &copy; {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-50 flex items-center justify-center h-10 w-10 rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}