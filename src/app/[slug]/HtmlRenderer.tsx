"use client";

import { useEffect, useRef } from "react";
import DynamicForm from "./DynamicForm";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";
import { trackCampaignViewAction } from "./actions";
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
}

/**
 * Extrai apenas o conteúdo interno do <body> do HTML da campanha,
 * removendo <html>, <head> e <body> para evitar conflito com o
 * shell do Next.js (hydration mismatch / duplicate html/body).
 */
function extractBodyContent(html: string): string {
  // Tenta extrair o conteúdo entre <body...> e </body>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }

  // Se não encontrou <body>, remove as tags estruturais manualmente
  return html
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<head[^>]*>[\s\S]*<\/head>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .trim();
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
 * Renderiza o HTML customizado da campanha.
 * Onde existir {{FORM_SLOT}}, injeta o componente <DynamicForm> de forma segura,
 * convertendo o HTML bruto em React Elements para não quebrar a árvore do DOM.
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
}: HtmlRendererProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackCampaignViewAction(campaignId);
    }
  }, [campaignId]);

  const sanitizedHtml = extractBodyContent(rawHtml);
  const headAssets = extractHeadAssets(rawHtml);
  const SLOT_MARKER = "{{FORM_SLOT}}";

  // Se não há {{FORM_SLOT}}, apenas renderiza o HTML e joga o form no final
  if (!sanitizedHtml.includes(SLOT_MARKER)) {
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

  // Parseia o HTML e substitui as divs âncoras pelo React Component
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
          />
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