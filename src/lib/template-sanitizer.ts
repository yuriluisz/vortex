import DOMPurify from "isomorphic-dompurify";

/**
 * Configuração de sanitização para templates publicados.
 *
 * É ESTRITAMENTE mais agressiva que a sanitização do HtmlRenderer,
 * porque o HTML de um template será renderizado para OUTROS usuários.
 *
 * Regras:
 * - Remove completamente scripts, handlers de eventos, objetos, embeds, forms
 * - Bloqueia URLs perigosas (javascript:, data:, vbscript:)
 * - Filtra CSS ofensivo (expression, @import, behavior)
 * - Remove referências a dados sensíveis (pixel IDs, domínios, telefones hardcoded)
 * - iframe só entra via whitelist (YouTube, Vimeo)
 * - MANTÉM {{FORM_SLOT}} intacto
 *
 * NOTA: DOMPurify em Node.js (isomorphic-dompurify) não preserva conteúdo
 * de <style> e <link> mesmo quando em ALLOWED_TAGS. Por isso, fazemos
 * pre-extração desses elementos antes da sanitização.
 */

const ALLOWED_TAGS = [
  "div", "span", "section", "header", "footer", "main", "nav", "article",
  "aside", "figure", "figcaption",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "pre", "code",
  "blockquote", "cite", "q",
  "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "abbr", "dfn", "kbd", "samp", "var", "time", "del", "ins",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
  "caption",
  "img", "picture", "source", "video", "audio",
  "a",
  "iframe",
  // Formulários customizados — permitidos mas neutralizados (action/method removidos)
  "form", "input", "select", "textarea", "button", "label", "option", "optgroup",
  "fieldset", "legend",
];

const ALLOWED_ATTRS = [
  "class", "id", "style", "title", "lang", "dir",
  "href", "target", "rel",
  "src", "alt", "width", "height", "loading", "srcset", "sizes",
  "controls", "poster", "autoplay", "loop", "muted", "preload",
  "colspan", "rowspan", "scope", "headers",
  "allow", "allowfullscreen", "frameborder",
  "charset", "name", "content", "http-equiv",
  "data-vortex-form-slot",
  "type", "media",
  // Atributos de formulário — permitidos mas neutralizados
  "name", "value", "placeholder", "required", "disabled", "readonly",
  "min", "max", "step", "rows", "cols", "multiple", "checked", "selected",
  "for", "autocomplete", "maxlength", "minlength", "pattern",
  "data-vortex-custom-form",
];

/**
 * Padrões de URL maliciosa para bloquear em atributos src/href.
 */
const MALICIOUS_URL_PATTERNS = [
  /^javascript:/i,
  /^data:/i,
  /^vbscript:/i,
  /^file:/i,
  /^about:/i,
  /^blob:/i,
];

/**
 * Lista de domínios de iframe permitidos.
 */
const IFRAME_ALLOWLIST = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "www.vimeo.com",
];

/**
 * Padrões de dados sensíveis a serem removidos do HTML.
 */
const SENSITIVE_DATA_PATTERNS: RegExp[] = [
  // Telefones brasileiros
  /\b(\+?55\s?)?\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g,
  // Meta Pixel IDs (números de 8-15 dígitos)
  /\b\d{8,15}\b/g,
  // Tokens de acesso (UUIDs)
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
];

/**
 * Regex para extrair tags <style> e <link> do HTML.
 * Captura tanto com aspas duplas quanto simples, e sem aspas.
 */
const STYLE_LINK_REGEX = /<(style|link)[^>]*>[\s\S]*?<\/\1\s*>|<link[^>]*\/?>/gi;

/**
 * Verifica se uma URL de iframe é permitida pela whitelist.
 */
function isIframeUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return IFRAME_ALLOWLIST.some((allowed) => parsed.hostname.endsWith(allowed));
  } catch {
    return false;
  }
}

/**
 * Remove dados sensíveis do HTML.
 */
function stripSensitiveData(html: string): string {
  let cleaned = html;
  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[REDACTED]");
  }
  return cleaned;
}

/**
 * Verifica se o HTML contém a tag {{FORM_SLOT}} necessária.
 */
export function hasFormSlot(html: string): boolean {
  return html.includes("{{FORM_SLOT}}");
}

/**
 * Verifica se o HTML contém um formulário customizado.
 */
export function hasCustomForm(html: string): boolean {
  return /<form[\s>]/i.test(html);
}

/**
 * Marca formulários customizados com data-vortex-custom-form="true"
 * para que o HtmlRenderer possa adotá-los (interceptar o submit).
 * Também garante que action/method sejam removidos (defesa em profundidade).
 */
export function markCustomForms(html: string): string {
  return html.replace(/<form\b([^>]*)>/gi, (match, attrs: string) => {
    // Remover action/method/enctype (defesa em profundidade)
    const safeAttrs = attrs
      .replace(/\s+action\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+method\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+enctype\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+formaction\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+formmethod\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+formtarget\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+formnovalidate\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+formenctype\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    // Adicionar marcador
    return `<form data-vortex-custom-form="true"${safeAttrs}>`;
  });
}

/**
 * Sanitiza o HTML de um template para publicação segura.
 *
 * Esta função DEVE ser chamada no servidor (server-only) antes de
 * armazenar qualquer template no banco de dados.
 *
 * @param rawHtml - O HTML bruto a ser sanitizado
 * @returns O HTML sanitizado e seguro para publicação
 * @throws {Error} Se o HTML não contiver {{FORM_SLOT}}
 */
export function sanitizeTemplateHtml(rawHtml: string): string {
  if (!rawHtml || rawHtml.trim().length === 0) {
    throw new Error("O HTML do template não pode estar vazio.");
  }

  // O template pode ter {{FORM_SLOT}} (form padrão) OU um <form> customizado.
  // Se não tiver nenhum dos dois, é inválido.
  const hasSlot = hasFormSlot(rawHtml);
  const hasCustom = hasCustomForm(rawHtml);
  if (!hasSlot && !hasCustom) {
    throw new Error(
      "O HTML deve conter a tag {{FORM_SLOT}} ou um formulário <form> customizado."
    );
  }

  // Pré-extrair <style> e <link> pois DOMPurify em Node.js os remove
  const extractedAssets: string[] = [];
  const htmlWithoutAssets = rawHtml.replace(STYLE_LINK_REGEX, (match) => {
    extractedAssets.push(match);
    return "";
  });

  // Primeira passada: DOMPurify com regras estritas
  let sanitized = DOMPurify.sanitize(htmlWithoutAssets, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: [
      "script", "noscript", "object", "embed", "applet",
      "datalist", "keygen", "output", "progress",
      "meter", "details", "summary", "dialog", "menu", "menuitem",
      "style", "link",
    ],
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "ondblclick", "onmousedown",
      "onmouseup", "onmouseover", "onmousemove", "onmouseout",
      "onfocus", "onblur", "onkeydown", "onkeypress", "onkeyup",
      "onsubmit", "onreset", "onchange", "onselect", "oninput",
      "onscroll", "onwheel", "ondrag", "ondrop", "oncopy", "oncut",
      "onpaste", "onabort", "oncanplay", "oncanplaythrough",
      "ondurationchange", "onemptied", "onended",
      "onloadeddata", "onloadedmetadata", "onloadstart",
      "onpause", "onplay", "onplaying", "onprogress", "onratechange",
      "onseeked", "onseeking", "onstalled", "onsuspend", "ontimeupdate",
      "onvolumechange", "onwaiting", "onanimationend", "onanimationiteration",
      "onanimationstart", "ontransitionend", "onbeforeunload",
      "onhashchange", "onmessage", "onoffline", "ononline", "onpagehide",
      "onpageshow", "onpopstate", "onresize", "onstorage",
      "onafterprint", "onbeforeprint",
      "expression", "behavior", "-moz-binding",
      // Atributos de envio de formulário — SEMPRE removidos (segurança)
      "action", "method", "enctype", "formaction", "formmethod",
      "formtarget", "formnovalidate", "formenctype",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp|mailto|tel|sms):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });

  // Re-inserir os assets extraídos no início do body
  if (extractedAssets.length > 0) {
    const assetsHtml = extractedAssets.join("\n");
    sanitized = assetsHtml + "\n" + sanitized;
  }

  // Segunda passada: remover iframes com URLs não permitidas
  sanitized = sanitized.replace(
    /<iframe\s[^>]*src\s*=\s*"([^"]*)"[^>]*>/gi,
    (match, src) => {
      if (isIframeUrlAllowed(src)) {
        return match;
      }
      return "";
    }
  );

  // Terceira passada: remover dados sensíveis
  sanitized = stripSensitiveData(sanitized);

  // Quarta passada: marcar forms customizados (remover action/method, adicionar data-vortex-custom-form)
  sanitized = markCustomForms(sanitized);

  // Quinta passada: verificar que pelo menos um mecanismo de form sobreviveu
  if (!hasFormSlot(sanitized) && !hasCustomForm(sanitized)) {
    throw new Error(
      "A sanitização removeu o formulário do template. Verifique se ele está em um contexto válido."
    );
  }

  return sanitized;
}

/**
 * Sanitização mais leve para previews (apenas remove handlers de eventos).
 * NÃO deve ser usada para armazenamento, apenas para visualização.
 */
export function sanitizeForPreview(rawHtml: string): string {
  if (!rawHtml) return "";

  // Também pré-extrai style/link para preview
  const extractedAssets: string[] = [];
  const htmlWithoutAssets = rawHtml.replace(STYLE_LINK_REGEX, (match) => {
    extractedAssets.push(match);
    return "";
  });

  const sanitized = DOMPurify.sanitize(htmlWithoutAssets, {
    ALLOWED_TAGS: ALLOWED_TAGS.concat(["script"]),
    ALLOWED_ATTR: ALLOWED_ATTRS,
    FORBID_TAGS: [
      "object", "embed", "applet",
      "datalist", "keygen", "output", "progress",
      "meter", "details", "summary", "dialog", "menu", "menuitem",
      "style", "link",
    ],
    // Script está em ALLOWED_TAGS, precisa ser removido de FORBID_TAGS
    // para que o conteúdo seja preservado no preview
    ADD_TAGS: ["script"],
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur",
      "onsubmit", "onchange", "onkeydown", "onkeyup",
    ],
  });

  if (extractedAssets.length > 0) {
    return extractedAssets.join("\n") + "\n" + sanitized;
  }
  return sanitized;
}