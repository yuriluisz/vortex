"use client";

import { useEffect, useRef, useState, useTransition, FormEvent } from "react";
import DOMPurify from "isomorphic-dompurify";
import DynamicForm from "./DynamicForm";
import parse, { Element, HTMLReactParserOptions, domToReact } from "html-react-parser";
import Script from "next/script";
import { trackCampaignViewAction, submitLeadAction } from "./actions";
import VortexFooter from "@/components/VortexFooter";

interface FormField {
  id: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface HtmlRendererProps {
  rawHtml: string;
  campaignId: string;
  slug: string;
  formSchema: FormField[];
  campaignName?: string;
  tenantSlug?: string;
  showVortexFooter?: boolean;
  isCustomDomain?: boolean;
  isPreview?: boolean;
}

/**
 * Extrai apenas o conteúdo interno do <body> do HTML da campanha,
 * removendo <html>, <head> e <body> para evitar conflito com o
 * shell do Next.js (hydration mismatch / duplicate html/body).
 */
function extractBodyContent(html: string): string {
  // Tenta extrair o conteúdo entre <body...> e </body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const raw = bodyMatch
    ? bodyMatch[1]
    : html
        .replace(/<\/?html[^>]*>/gi, "")
        .replace(/<head[^>]*>[\s\S]*<\/head>/gi, "")
        .replace(/<\/?body[^>]*>/gi, "")
        .replace(/<!DOCTYPE[^>]*>/gi, "")
        .trim();

  // 🔒 Sanitizar: permite HTML de layout mas bloqueia scripts e event handlers
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ["style", "link", "iframe", "form", "input", "select", "textarea", "button", "label", "option", "optgroup", "fieldset", "legend"],
    ADD_ATTR: [
      "target", "rel", "data-vortex-form-slot", "data-vortex-custom-form",
      "style", "class", "id", "src", "href", "allow", "allowfullscreen",
      "name", "value", "placeholder", "required", "disabled", "readonly",
      "min", "max", "step", "rows", "cols", "multiple", "checked", "selected",
      "for", "autocomplete", "maxlength", "minlength", "pattern", "type",
    ],
    FORBID_TAGS: ["script", "object", "embed", "applet"],
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "onmouseover", "onfocus",
      "onblur", "onsubmit", "onchange", "onkeydown", "onkeyup",
      "action", "method", "enctype", "formaction", "formmethod",
      "formtarget", "formnovalidate", "formenctype",
    ],
  });
}

/**
 * Extrai <link> e <style> do <head> para injetar separadamente.
 */
function extractHeadAssets(html: string): string {
  const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  if (!headMatch) return "";

  const headContent = headMatch[1];
  const assets: string[] = [];

  // Pega links de stylesheets
  const linkMatches = headContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi);
  if (linkMatches) assets.push(...linkMatches);

  // Pega blocos de estilo
  const styleMatches = headContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
  if (styleMatches) assets.push(...styleMatches);

  return assets.join("\n");
}

/**
 * Wrapper para forms customizados — intercepta o submit e envia via server action.
 * Mantém 100% do design do autor, só "adota" o envio com segurança.
 */
function CustomForm({
  children,
  campaignId,
  slug,
  isCustomDomain,
  isPreview = false,
}: {
  children: React.ReactNode;
  campaignId: string;
  slug: string;
  isCustomDomain: boolean;
  isPreview?: boolean;
}) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    if (isPreview || campaignId === "preview") {
      alert("✅ Modo Preview: Botão 1-Click testado com sucesso! Ao publicar a campanha, ele contabilizará o clique e redirecionará para o grupo de WhatsApp.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Sempre injetar os campos hidden do Vortex
    formData.set("campaignId", campaignId);
    formData.set("slug", slug);
    if (isCustomDomain) formData.set("isCustomDomain", "true");

    // Disparar evento Lead no Pixel
    try {
      const fbq = (window as unknown as { fbq?: (action: string, event: string) => void }).fbq;
      if (fbq) fbq("track", "Lead");
    } catch {
      // silencioso
    }

    // Disparar evento generate_lead no Google Tag Manager
    try {
      const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: "generate_lead",
        campaign_id: campaignId,
        campaign_slug: slug,
      });
    } catch {
      // silencioso
    }

    const executeSubmit = () => {
      startTransition(async () => {
        const result = await submitLeadAction(undefined, formData);
        if (result?.error) {
          setError(result.error);
        }
      });
    };

    const grecaptcha = (window as unknown as {
      grecaptcha?: {
        ready: (cb: () => void) => void;
        execute: (key: string, opts: { action: string }) => Promise<string>;
      };
    }).grecaptcha;

    if (siteKey && campaignId !== "preview" && grecaptcha) {
      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action: "submit" }).then((token: string) => {
          formData.set("g-recaptcha-response", token);
          executeSubmit();
        });
      });
      return;
    }

    executeSubmit();
  }

  return (
    <>
      {siteKey && campaignId !== "preview" && (
        <Script src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`} strategy="lazyOnload" />
      )}
      <form onSubmit={handleSubmit} data-vortex-custom-form="true">
      {children}
      {error && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#f87171", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.5rem", padding: "0.75rem" }}>
          {error}
        </div>
      )}
      {isPending && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#94a3b8", textAlign: "center" }}>
          Enviando...
        </div>
      )}
    </form>
    </>
  );
}

/**
 * Renderiza o HTML customizado da campanha.
 * Onde existir {{FORM_SLOT}}, injeta o componente <DynamicForm> de forma segura.
 *
 * Forms customizados (com data-vortex-custom-form) são adotados: o design é
 * preservado 100%, mas o submit é interceptado e enviado via submitLeadAction.
 *
 * O HTML é sanitizado para remover <html>, <head> e <body>, evitando
 * hydration mismatch com o shell do Next.js.
 */
export default function HtmlRenderer({
  rawHtml,
  campaignId,
  slug,
  formSchema,
  campaignName,
  tenantSlug,
  showVortexFooter = false,
  isCustomDomain = false,
  isPreview = false,
}: HtmlRendererProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current && !isPreview) {
      tracked.current = true;
      trackCampaignViewAction(campaignId);
    }
  }, [campaignId, isPreview]);

  const sanitizedHtml = extractBodyContent(rawHtml);
  const headAssets = extractHeadAssets(rawHtml);
  const SLOT_MARKER = "{{FORM_SLOT}}";

  const hasSlot = sanitizedHtml.includes(SLOT_MARKER);
  const hasCustomForm = sanitizedHtml.includes("data-vortex-custom-form");

  // Se não há {{FORM_SLOT}} nem form customizado, renderiza HTML e joga o form no final
  if (!hasSlot && !hasCustomForm) {
    return (
      <>
        {headAssets && parse(headAssets)}
        {parse(sanitizedHtml)}
        <DynamicForm
          campaignId={campaignId}
          slug={slug}
          formSchema={formSchema}
          isCustomDomain={isCustomDomain}
        />
      </>
    );
  }

  // Prepara o HTML substituindo TODAS as tags por divs âncoras (usando replaceAll e data-attribute para permitir múltiplas)
  const htmlWithAnchor = sanitizedHtml.replaceAll(
    SLOT_MARKER,
    '<div data-vortex-form-slot="true"></div>'
  );

  // Parseia o HTML e substitui as divs âncoras / forms customizados
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (
        domNode instanceof Element &&
        domNode.attribs &&
        domNode.attribs["data-vortex-form-slot"] === "true"
      ) {
        return (
          <DynamicForm
            campaignId={campaignId}
            slug={slug}
            formSchema={formSchema}
            isCustomDomain={isCustomDomain}
            isPreview={isPreview}
          />
        );
      }

      // Adotar forms customizados marcados na sanitização
      if (
        domNode instanceof Element &&
        domNode.attribs &&
        domNode.attribs["data-vortex-custom-form"] === "true" &&
        domNode.name === "form"
      ) {
        // Preservar 100% do conteúdo interno do form (inputs, labels, botões)
        return (
          <CustomForm
            campaignId={campaignId}
            slug={slug}
            isCustomDomain={isCustomDomain}
            isPreview={isPreview}
          >
            {domToReact(domNode.children as any, options)}
          </CustomForm>
        );
      }
    },
  };

  return (
    <>
      {headAssets && parse(headAssets)}
      {parse(htmlWithAnchor, options)}
      <VortexFooter
        campaignSlug={slug}
        campaignName={campaignName || slug}
        tenantSlug={tenantSlug || "unknown"}
        hidden={!showVortexFooter}
      />
    </>
  );
}
