"use client";

import { useActionState } from "react";
import { updateProfileAction } from "./actions";

interface ProfileFormProps {
  companyName: string;
  userName: string;
  slug: string;
}

export function ProfileForm({
  companyName,
  userName,
  slug,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Informações da Empresa
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Essas informações aparecem no seu painel e na página de captura.
        </p>

        <div className="space-y-5">
          {/* Nome da Empresa */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Nome da empresa
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              defaultValue={companyName}
              required
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="Minha Empresa Ltda"
            />
            {state?.fieldErrors?.companyName && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.companyName[0]}
              </p>
            )}
          </div>

          {/* Nome do Usuário */}
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Seu nome
            </label>
            <input
              id="userName"
              name="userName"
              type="text"
              defaultValue={userName}
              required
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="João Silva"
            />
            {state?.fieldErrors?.userName && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.userName[0]}
              </p>
            )}
          </div>

          {/* Subdomínio */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Subdomínio
            </label>
            <div className="flex rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-colors duration-150">
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={slug}
                required
                pattern="^[a-z0-9-]+$"
                className="block w-full rounded-l-lg bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="minha-empresa"
              />
              <span className="flex items-center px-4 text-sm text-muted-foreground border-l border-border bg-muted/30 rounded-r-lg">
                .vortex.app
              </span>
            </div>
            {state?.fieldErrors?.slug && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.slug[0]}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Apenas letras minúsculas, números e hífens.
            </p>
          </div>
        </div>
      </div>

      {/* Error / Success feedback */}
      {state?.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}