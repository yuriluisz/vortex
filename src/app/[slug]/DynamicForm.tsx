"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitLeadAction } from "./actions";
import type { LeadFormState } from "./actions";

interface FormField {
  id: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // Para select
}

interface DynamicFormProps {
  campaignId: string;
  slug: string;
  formSchema: FormField[];
  isCustomDomain?: boolean;
}

export default function DynamicForm({
  campaignId,
  slug,
  formSchema,
  isCustomDomain = false,
}: DynamicFormProps) {
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(
    submitLeadAction,
    undefined
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Disparar evento Lead no Pixel da Meta antes de enviar o formulário
    try {
      const fbq = (window as any).fbq;
      if (fbq) {
        fbq("track", "Lead");
      }
    } catch {
      // Silencioso — não quebrar o fluxo se o pixel não estiver carregado
    }
  }

  // ==========================================================================
  // CLOUDFLARE TURNSTILE
  // ==========================================================================
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;
    
    // Evitar injetar o script mais de uma vez
    if (document.getElementById("turnstile-script")) return;

    const script = document.createElement("script");
    script.id = "turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore
      if (window.turnstile) {
        // @ts-ignore
        window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          theme: "dark",
          appearance: "interaction-only",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup opcional
    };
  }, [siteKey]);

  return (
    <form action={formAction} onSubmit={handleSubmit} className="vortex-form space-y-4">
      {/* Hidden fields */}
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="slug" value={slug} />
      {isCustomDomain && <input type="hidden" name="isCustomDomain" value="true" />}

      {/* Campos dinâmicos do formSchema */}
      {formSchema.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <label
            htmlFor={`vortex-${field.id}`}
            className="block text-sm font-medium text-neutral-200"
          >
            {field.label}
            {field.required && " *"}
          </label>

          {field.type === "select" && field.options ? (
            <select
              id={`vortex-${field.id}`}
              name={field.id === "whatsapp" ? "whatsapp" : field.id === "name" ? "name" : `field_${field.id}`}
              required={field.required}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="" className="bg-neutral-900">
                {field.placeholder || "Selecione..."}
              </option>
              {field.options.map((opt) => (
                <option key={opt} value={opt} className="bg-neutral-900">
                  {opt}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              id={`vortex-${field.id}`}
              name={field.id === "whatsapp" ? "whatsapp" : field.id === "name" ? "name" : `field_${field.id}`}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
          ) : (
            <input
              id={`vortex-${field.id}`}
              name={field.id === "whatsapp" ? "whatsapp" : field.id === "name" ? "name" : `field_${field.id}`}
              type={field.type || "text"}
              required={field.required}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
          )}
        </div>
      ))}

      {/* Erro */}
      {state?.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Cloudflare Turnstile Widget */}
      {siteKey && (
        <>
          <div ref={turnstileRef} className="flex justify-center my-4" />
          <input type="hidden" name="cf-turnstile-response" value={turnstileToken} />
        </>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-green-500/25 transition-all duration-200 hover:from-green-400 hover:to-emerald-500 hover:shadow-green-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </span>
        ) : (
          "QUERO PARTICIPAR"
        )}
      </button>
    </form>
  );
}
