import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Vórtex+",
  description:
    "Saiba quais informações pessoais coletamos, por que coletamos e como entrar em contato conosco.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar para o início
        </Link>

        <h1 className="mt-8 text-3xl sm:text-4xl font-bold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 14 de agosto de 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Quem somos
            </h2>
            <p>
              O Vórtex+ é uma plataforma de hospedagem de landing pages e captação de
              leads. Este documento explica, em linguagem simples, quais informações
              pessoais coletamos, por que coletamos e como você pode entrar em contato
              conosco sobre seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Quais informações coletamos
            </h2>
            <p className="mb-3">Coletamos apenas as informações necessárias para o funcionamento do serviço:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Formulários de captação de leads:</strong> nome, email e/ou
                WhatsApp que você preenche nas landing pages hospedadas na plataforma.
              </li>
              <li>
                <strong>Conta de usuário:</strong> email utilizado para autenticação
                via código OTP (One-Time Password) ao acessar o painel administrativo.
                Não utilizamos senhas — a autenticação é feita exclusivamente por código
                temporário enviado ao seu email.
              </li>
              <li>
                <strong>Dados de pagamento:</strong> processados pelo Asaas (plataforma
                de pagamento). Não armazenamos dados de cartão de crédito.
              </li>
              <li>
                <strong>Dados de uso:</strong> páginas visitadas, tempo de acesso e
                endereço IP, usados para segurança e melhorias do serviço.
              </li>
              <li>
                <strong>Dados de WhatsApp:</strong> ao conectar seu WhatsApp à plataforma,
                coletamos o número conectado e os identificadores (JIDs) dos grupos gerenciados.
                Não armazenamos o conteúdo das mensagens pessoais do seu WhatsApp.
              </li>
              <li>
                <strong>Dados de templates:</strong> ao publicar um template na
                comunidade, o HTML sanitizado da sua campanha, metadados (nome,
                descrição, categoria) e seu perfil público (nome, handle, bio) ficam
                visíveis para outros usuários.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Por que coletamos essas informações
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Leads:</strong> para entregar os leads capturados ao dono da
                campanha que você acessou.
              </li>
              <li>
                <strong>Conta:</strong> para permitir o acesso ao painel e gerenciar
                suas campanhas.
              </li>
              <li>
                <strong>Pagamento:</strong> para processar assinaturas e cobranças.
              </li>
              <li>
                <strong>Uso:</strong> para proteger a plataforma contra abusos e
                melhorar a experiência.
              </li>
              <li>
                <strong>WhatsApp:</strong> para gerenciar a rotação de grupos, disparos
                em massa e sincronização de membros.
              </li>
              <li>
                <strong>Templates:</strong> para disponibilizar seu template na loja
                pública da comunidade e exibir métricas de uso.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Compartilhamento de dados
            </h2>
            <p>
              Não vendemos seus dados pessoais. Compartilhamos informações apenas com
              provedores essenciais para o funcionamento do serviço, como o Asaas
              (pagamentos) e o Resend (envio de emails). Os leads capturados são
              entregues exclusivamente ao dono da campanha que você acessou.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Cookies e armazenamento local
            </h2>
            <p className="mb-3">
              O Vórtex+ utiliza cookies essenciais para o funcionamento da plataforma:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Cookie de sessão (httpOnly):</strong> armazena o token JWT para
                manter sua sessão autenticada no painel administrativo. É um cookie
                seguro e não pode ser acessado por scripts.
              </li>
              <li>
                <strong>Armazenamento local:</strong> utilizado para preferências de
                interface (como tema claro/escuro) e cache de dados temporários.
              </li>
              <li>
                <strong>Cookies de terceiros:</strong> não utilizamos cookies de
                terceiros por padrão. Se o dono da campanha configurar um Meta Pixel ID,
                o pixel do Facebook poderá definir cookies próprios na página de captura.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Retenção e exclusão de dados
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Leads:</strong> ficam armazenados enquanto a campanha existir.
                Ao excluir uma campanha, todos os leads associados são removidos
                permanentemente.
              </li>
              <li>
                <strong>Conta:</strong> seus dados de conta são mantidos enquanto a
                conta estiver ativa. Você pode solicitar a exclusão completa a qualquer
                momento pelo email de contato abaixo.
              </li>
              <li>
                <strong>Templates:</strong> ao excluir um template, todas as versões
                e metadados são removidos. Templates em uso por outros usuários devem
                ser ocultados em vez de excluídos.
              </li>
              <li>
                <strong>Logs de auditoria:</strong> registros de ações administrativas
                são mantidos por fins de segurança e podem ser solicitados pelo titular.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Segurança
            </h2>
            <p className="mb-3">
              Implementamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Criptografia em trânsito:</strong> todas as comunicações são
                protegidas por HTTPS/TLS.
              </li>
              <li>
                <strong>Autenticação OTP:</strong> sem armazenamento de senhas — cada
                login utiliza um código temporário de 6 dígitos enviado ao seu email.
              </li>
              <li>
                <strong>Rate limiting:</strong> proteção contra ataques de força bruta
                e abuso de endpoints.
              </li>
              <li>
                <strong>Isolamento multi-tenant:</strong> cada empresa tem seu ambiente
                isolado. Dados de um tenant não são visíveis para outro.
              </li>
              <li>
                <strong>Sanitização de HTML:</strong> todo HTML hospedado passa por
                sanitização rigorosa (DOMPurify) para prevenir ataques XSS.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Base legal (LGPD)
            </h2>
            <p className="mb-3">
              O tratamento de dados pessoais pelo Vórtex+ está amparado nas seguintes
              bases legais da Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Consentimento:</strong> para a coleta de dados de leads por meio
                dos formulários de captação nas landing pages.
              </li>
              <li>
                <strong>Execução de contrato:</strong> para o processamento de dados
                necessários à prestação do serviço (conta, campanhas, pagamentos).
              </li>
              <li>
                <strong>Legítimo interesse:</strong> para melhorias no serviço,
                segurança da plataforma e prevenção de fraudes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9. Seus direitos
            </h2>
            <p>
              Conforme a LGPD, você pode solicitar a qualquer momento: acesso aos seus
              dados, correção de informações incorretas, exclusão dos seus dados,
              portabilidade dos dados, revogação do consentimento ou informações sobre
              o compartilhamento. Para exercer seus direitos, entre em contato pelo
              email abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10. Contato
            </h2>
            <p>
              Para qualquer dúvida sobre esta política ou sobre seus dados pessoais,
              entre em contato pelo email:{" "}
              <a
                href="mailto:contact@vortexpages.online"
                className="text-primary hover:underline"
              >
                contact@vortexpages.online
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}