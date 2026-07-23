import { BookOpen, Code2, Users, LayoutTemplate, Settings, Shield } from "lucide-react";

export default function AdminDocsPage() {
  return (
    <div className="mx-auto max-w-4xl text-foreground selection:bg-primary/30">
      {/* Cabeçalho */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
          <BookOpen className="w-4 h-4" />
          Documentação Técnica
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Documentação do Dashboard
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Guia completo de uso do painel administrativo do Vórtex+.
        </p>
      </div>

      {/* Conteúdo */}
      <div className="space-y-14">

        {/* Seção 1: Dashboard */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">1. Dashboard</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Ao acessar o painel, você vê um resumo com métricas em tempo real:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Total de leads</strong> — quantos contatos foram capturados em todas as campanhas</li>
              <li><strong>Campanhas ativas</strong> — quantas campanhas estão no ar</li>
              <li><strong>Grupos ativos</strong> — quantos grupos de WhatsApp estão recebendo leads</li>
            </ul>
          </div>
        </section>

        {/* Seção 2: Campanhas */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">2. Campanhas</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Cada campanha é uma página de captura independente. Você pode:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Criar</strong> — defina nome, slug, HTML e schema do formulário</li>
              <li><strong>Editar</strong> — altere o HTML, campos do formulário ou grupos associados</li>
              <li><strong>Pausar/Ativar</strong> — controle quando a campanha está recebendo leads</li>
              <li><strong>Visualizar</strong> — veja a página de captura exatamente como o visitante vê</li>
              <li><strong>Excluir</strong> — remova campanhas que não estão mais em uso</li>
            </ul>

            <div className="bg-card border border-border p-6 rounded-xl mt-4">
              <h3 className="text-foreground font-medium mb-2">Tag de Injeção</h3>
              <p className="text-sm">
                Use <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-xs">{"{{"}FORM_SLOT{"}}"}</code> no seu HTML para marcar onde o formulário deve aparecer.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 3: Schema de Formulário */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">3. Construtor de Formulário</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              O <strong>Form Schema</strong> permite criar formulários dinâmicos sem código:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Campos de texto, email, número, select, checkbox e textarea</li>
              <li>Campos obrigatórios ou opcionais</li>
              <li>Botões rápidos para inserir campos comuns (Email, WhatsApp, Nome)</li>
              <li>Preview em tempo real do formulário</li>
            </ul>
          </div>
        </section>

        {/* Seção 4: Grupos */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">4. Grupos de WhatsApp</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Os grupos são os destinos para onde os leads são redirecionados após o cadastro.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>URL do grupo</strong> — link de convite do WhatsApp</li>
              <li><strong>Capacidade</strong> — limite de pessoas por grupo (ex: 250)</li>
              <li><strong>Ordem</strong> — define a sequência de distribuição</li>
              <li><strong>Rotação automática</strong> — quando um grupo atinge o limite, o próximo entra em ação</li>
            </ul>
          </div>
        </section>

        {/* Seção 5: Leads */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">5. Leads</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Todos os leads capturados ficam armazenados no cofre de leads:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nome, email, WhatsApp e respostas do formulário</li>
              <li>Metadados: IP, device, localização, data/hora</li>
              <li>Exportação para CSV</li>
              <li>Busca e filtros por campanha</li>
            </ul>
          </div>
        </section>

        {/* Seção 6: Configurações */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">6. Configurações</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Na página de configurações você pode:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Perfil</strong> — alterar seu nome e email</li>
              <li><strong>Plano</strong> — ver detalhes do plano atual e fazer upgrade</li>
              <li><strong>Checkout</strong> — página de pagamento para planos Pro</li>
            </ul>
          </div>
        </section>

        {/* Seção 7: Segurança */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">7. Segurança</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>2FA via OTP</strong> — código de 6 dígitos enviado por email</li>
              <li><strong>Sessão JWT</strong> — cookie httpOnly criptografado</li>
              <li><strong>Rate limiting</strong> — proteção contra brute force</li>
              <li><strong>Multi-tenant</strong> — dados isolados entre clientes</li>
              <li><strong>Audit log</strong> — todas as ações críticas registradas</li>
            </ul>
          </div>
        </section>

      </div>

      {/* Rodapé */}
      <div className="mt-16 pt-8 border-t border-border text-center">
        <div className="flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-4 w-auto invert opacity-50" />
          <span className="text-sm text-muted-foreground">
            Documentação &copy; {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}