"use client";

import DynamicForm from "./DynamicForm";
import parse, { Element, HTMLReactParserOptions } from "html-react-parser";

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

  // Extrai <link> tags (fonts, stylesheets)
  const linkRegex = /<link[^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(headContent)) !== null) {
    assets.push(match[0]);
  }

  // Extrai <style> blocks
  const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
  while ((match = styleRegex.exec(headContent)) !== null) {
    assets.push(match[0]);
  }

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
}: HtmlRendererProps) {
  const SLOT_MARKER = "{{FORM_SLOT}}";

  // Sanitiza o HTML: extrai apenas o conteúdo do body
  const sanitizedHtml = extractBodyContent(rawHtml);
  const headAssets = extractHeadAssets(rawHtml);

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
          />
        );
      }
    },
  };

  return (
    <>
      {headAssets && parse(headAssets)}
      {parse(htmlWithAnchor, options)}
    </>
  );
}