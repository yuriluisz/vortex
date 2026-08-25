import { getInviteDetailsAction } from "./actions";
import { AcceptInviteForm } from "./AcceptInviteForm";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Share2 } from "lucide-react";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="max-w-md w-full rounded-2xl bg-zinc-950 border border-white/10 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Link de Convite Inválido</h2>
          <p className="text-xs text-muted-foreground">
            O token de acesso não foi informado ou expirou.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  const details = await getInviteDetailsAction(token);

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <div className="max-w-md w-full rounded-2xl bg-zinc-950 border border-white/10 p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto border border-destructive/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Convite Não Encontrado</h2>
          <p className="text-xs text-muted-foreground">
            Este convite já foi aceito ou não é mais válido.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[128px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[128px]" />
      </div>

      <div className="max-w-md w-full rounded-2xl bg-zinc-950/80 backdrop-blur-2xl border border-white/15 p-8 shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Vortex Padrão.svg"
            alt="Vórtex+"
            className="h-7 w-auto invert mx-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-2"
          />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Acesso Compartilhado
          </h1>
          <p className="text-xs text-muted-foreground">
            Você foi convidado para acessar a campanha no Vórtex.
          </p>
        </div>

        {/* Detalhes do Convite */}
        <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Campanha:</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {details.campaignName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Compartilhado por:</span>
            <span className="font-medium text-foreground/90">{details.ownerName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Permissão:</span>
            <span className="font-bold text-primary">
              {details.permission === "EDIT" ? "Editor" : "Visualizador"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
            <span className="text-muted-foreground">Seu e-mail:</span>
            <span className="font-mono text-muted-foreground">{details.email}</span>
          </div>
        </div>

        {/* Formulário de Criação de Senha / Aceite */}
        <AcceptInviteForm token={token} email={details.email} />
      </div>
    </div>
  );
}
