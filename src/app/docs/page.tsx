import { BookOpen, Code2, Users, LayoutTemplate, Settings, Globe } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl text-foreground selection:bg-primary/30">
      {/* Cabeçalho */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
          <BookOpen className="w-4 h-4" />
          Documentação Oficial
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Como funciona o Vórtex+
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          O Vórtex+ é um sistema de captação de leads de alta performance projetado para gerenciar grandes volumes de tráfego, renderizando páginas dinâmicas e rotacionando grupos de WhatsApp de forma automática e inteligente.
        </p>
      </div>

      {/* Conteúdo da Doc */}
      <div className="space-y-14">

        {/* Seção 1: Arquitetura */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">1. Estrutura de Campanhas e HTML</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Cada campanha no Vórtex+ atua como uma página de captura independente. O sistema permite que você <strong>cole o HTML bruto (raw HTML)</strong> de qualquer página construída em ferramentas como Webflow, Figma, ou codificada manualmente.
            </p>

            <div className="bg-card border border-border p-6 rounded-xl mt-4">
              <h3 className="text-foreground font-medium mb-2">A Tag Especial: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono text-sm">{"{{"}FORM_SLOT{"}}"}</code></h3>
              <p className="text-sm mb-4">
                O Vórtex+ injeta automaticamente o formulário de captura de leads no seu layout. Para dizer ao sistema <strong>onde</strong> o formulário deve aparecer, você deve inserir a tag especial <code className="font-mono text-xs text-foreground">{"{{"}FORM_SLOT{"}}"}</code> no local exato dentro do seu HTML.
              </p>

              <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto text-foreground/80 border border-border">
<pre>{`<!-- Exemplo de HTML Base -->
<div class="meu-container-principal">
  <h1>Inscreva-se na nossa Mentoria</h1>
  <p>Preencha os dados abaixo para continuar.</p>

  <!-- O formulário será injetado exatamente aqui -->
  {{FORM_SLOT}}

</div>`}</pre>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="text-foreground font-medium mb-2">Estilizando o Formulário</h3>
              <p className="text-sm mb-4">
                O formulário injetado já possui um visual moderno (Tailwind CSS), mas você pode sobrescrever os estilos facilmente através do seu HTML base. O formulário inteiro é encapsulado em uma classe chamada <code className="font-mono text-xs text-foreground">.vortex-form</code>.
              </p>

              <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto text-foreground/80 border border-border">
<pre>{`<!-- Para mudar a cor do botão, adicione isso no seu HTML: -->
<style>
  .vortex-form button[type="submit"] {
    background-color: #ff0000 !important;
    color: white !important;
    border-radius: 8px;
  }

  .vortex-form input {
    border-color: #cccccc !important;
  }
</style>`}</pre>
              </div>
            </div>
          </div>
        </section>


        {/* Seção 2: Schema de Formulário */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">2. Construtor Dinâmico (Form Schema)</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Diferente de sistemas rígidos, no Vórtex+ você não está preso apenas a {"\""}Nome{"\""} e {"\""}Email{"\""}. O <strong>Form Schema</strong> permite que cada campanha tenha um formulário completamente único.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você pode adicionar campos de texto, números ou e-mail.</li>
              <li>Pode definir se um campo é obrigatório ou opcional.</li>
              <li>O sistema coleta tudo e empacota de forma segura no banco de dados.</li>
              <li>Utilize os {"\""}botões rápidos{"\""} no painel admin para inserir configurações pré-prontas (como E-mail, WhatsApp, Endereço).</li>
            </ul>
          </div>
        </section>


        {/* Seção 3: Rotação de Grupos */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">3. Rotação de Grupos de WhatsApp</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Uma das funcionalidades mais poderosas do Vórtex+ é o sistema de distribuição de tráfego. Após o lead preencher o formulário, ele é redirecionado para a URL <code className="font-mono text-xs text-foreground bg-muted px-1 py-0.5 rounded">/sua-campanha/redirect</code>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-card border border-border p-5 rounded-xl">
                <h4 className="text-foreground font-medium mb-1">Cache de Alta Performance</h4>
                <p className="text-sm">
                  A rotação utiliza o <strong>Redis</strong> para garantir que o redirecionamento aconteça em milissegundos, mesmo com milhares de usuários acessando ao mesmo tempo.
                </p>
              </div>
              <div className="bg-card border border-border p-5 rounded-xl">
                <h4 className="text-foreground font-medium mb-1">Preenchimento Inteligente</h4>
                <p className="text-sm">
                  O sistema verifica a capacidade de cada grupo (ex: 250 pessoas). Assim que o Grupo 1 atinge o limite, o sistema automaticamente começa a enviar os próximos leads para o Grupo 2, e assim sucessivamente.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Seção 4: Domínios Customizados */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">4. Domínios Customizados (Plano ULTRA)</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Usuários do plano ULTRA possuem a capacidade de utilizar seus próprios domínios (ex: <code className="font-mono text-xs text-foreground">campanha.meudominio.com.br</code>) para exibir suas campanhas, mascarando a URL padrão do sistema.
            </p>

            <div className="bg-card border border-border p-6 rounded-xl mt-4">
              <h3 className="text-foreground font-medium mb-2">Como configurar o DNS</h3>
              <p className="text-sm mb-4">
                Para que o domínio customizado funcione perfeitamente, o cliente precisa acessar o painel onde registrou o domínio (Hostinger, Registro.br, GoDaddy, etc.) e criar um apontamento DNS para o servidor do Vórtex+.
              </p>

              <div className="bg-muted p-4 rounded-lg text-sm overflow-x-auto text-foreground/80 border border-border">
                <strong>Tipo de Registro:</strong> CNAME<br/>
                <strong>Nome/Host:</strong> <code className="font-mono text-xs text-primary">campanha</code> (ou o subdomínio desejado)<br/>
                <strong>Destino/Aponta para:</strong> <code className="font-mono text-xs text-primary">vortexpages.online</code>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="text-foreground font-medium mb-2">Atenção ao Certificado SSL (HTTPS)</h3>
              <p className="text-sm">
                O Vórtex+ possui um sistema inteligente de roteamento (Middleware) que detecta quando um domínio customizado o acessa e exibe a campanha correta automaticamente. No entanto, para que o site não exiba "Não Seguro" (falta de SSL/HTTPS), a infraestrutura onde o Vórtex+ está hospedado (ex: Vercel, Cloudflare for SaaS) também deve estar configurada para gerar o certificado automaticamente para domínios de terceiros.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 5: Configurações Gerais */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">5. Configurações e Segurança</h2>
          </div>

          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              O sistema é protegido por um middleware (proxy) rodando nativamente no Next.js, bloqueando qualquer acesso não autorizado às rotas <code className="font-mono text-xs text-foreground">/admin/*</code>.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>2FA (Autenticação de Dois Fatores):</strong> O login exige senha e confirmação de um código de 6 dígitos enviado ao e-mail do admin.</li>
              <li><strong>Variáveis de Ambiente:</strong> Senhas, chaves de API e conexões com o banco de dados (PostgreSQL/Redis) são gerenciadas exclusivamente através do arquivo <code className="font-mono text-xs text-foreground bg-muted px-1 py-0.5 rounded">.env</code> para garantir máxima segurança.</li>
            </ul>
          </div>
        </section>

      </div>

      {/* Rodapé da Doc */}
      <div className="mt-16 pt-8 border-t border-border text-center">
        <div className="flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-4 w-auto invert opacity-50" />
          <span className="text-sm text-muted-foreground">
            Documentation &copy; {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
