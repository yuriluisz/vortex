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
          Última atualização: 11 de agosto de 2026
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
                <strong>Conta de usuário:</strong> email e senha (criptografada) ao
                criar uma conta no painel administrativo.
              </li>
              <li>
                <strong>Dados de pagamento:</strong> processados pelo Asaas (plataforma
                de pagamento). Não armazenamos dados de cartão de crédito.
              </li>
              <li>
                <strong>Dados de uso:</strong> páginas visitadas, tempo de acesso e
                endereço IP, usados para segurança e melhorias do serviço.
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
              5. Seus direitos
            </h2>
            <p>
              Você pode solicitar a qualquer momento: acesso aos seus dados, correção
              de informações incorretas, exclusão dos seus dados ou revogação do
              consentimento. Para isso, entre em contato conosco pelo email abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Contato
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