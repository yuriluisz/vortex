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
 * Renderiza o HTML customizado da campanha.
 * Onde existir {{FORM_SLOT}}, injeta o componente <DynamicForm> de forma segura,
 * convertendo o HTML bruto em React Elements para não quebrar a árvore do DOM.
 */
export default function HtmlRenderer({
  rawHtml,
  campaignId,
  slug,
  formSchema,
}: HtmlRendererProps) {
  const SLOT_MARKER = "{{FORM_SLOT}}";

  // Se não há {{FORM_SLOT}}, apenas renderiza o HTML e joga o form no final
  if (!rawHtml.includes(SLOT_MARKER)) {
    return (
      <>
        {parse(rawHtml)}
        <DynamicForm
          campaignId={campaignId}
          slug={slug}
          formSchema={formSchema}
        />
      </>
    );
  }

  // Prepara o HTML substituindo TODAS as tags por divs âncoras (usando replaceAll e data-attribute para permitir múltiplas)
  const htmlWithAnchor = rawHtml.replaceAll(
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

  return <>{parse(htmlWithAnchor, options)}</>;
}
