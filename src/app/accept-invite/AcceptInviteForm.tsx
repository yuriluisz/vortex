"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "./actions";
import { Lock, User, Loader2, ArrowRight } from "lucide-react";

interface AcceptInviteFormProps {
  token: string;
  email: string;
}

export function AcceptInviteForm({ token, email }: AcceptInviteFormProps) {
  const [state, formAction, isPending] = useActionState(acceptInviteAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive font-medium">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
          Seu Nome Completo
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="name"
            required
            placeholder="ex: Lucas Silveira"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground/90 mb-1.5">
          Crie sua Senha de Acesso
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="Mínimo de 6 caracteres"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Configurando acesso...</span>
          </>
        ) : (
          <>
            <span>Aceitar Convite e Entrar</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
