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
 * - Filtra CSS ofensivo (expression, @import, behavior, -moz-binding)
 * - Remove referências a dados sensíveis (pixel IDs, domínios, telefones hardcoded)
 * - iframe só entra via whitelist (YouTube, Vimeo)
 * - MANTÉM {{FORM_SLOT}} intacto
 * - <style> e <link rel="stylesheet"> são EXTRAÍDOS, sanitizados e REINSERIDOS:
 *   o conteúdo CSS é limpo de vetores de exfiltração (@import, expression,
 *   url(javascript:), url(data:)) e <link> só é permitido com rel="stylesheet"
 *   e href http:// ou https:// (qualquer host — suporta MinIO/VPS sem https).
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
 * Padrões de CSS perigoso a remover do conteúdo de <style>.
 * Neutraliza vetores de exfiltração e execução via CSS.
 */
const DANGEROUS_CSS_PATTERNS: RegExp[] = [
  /@import[^;]*;?/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /-moz-binding\s*:/gi,
  /url\s*\(\s*['"]?\s*javascript:/gi,
  /url\s*\(\s*['"]?\s*data:/gi,
  /url\s*\(\s*['"]?\s*vbscript:/gi,
  /url\s*\(\s*['"]?\s*file:/gi,
];

/**
 * Verifica se uma URL de iframe é permitida pela whitelist.
 */
function isIframeUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return IFRAME_ALLOWLIST.some(
      (allowed) => parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`)
    );
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
 * Sanitiza o conteúdo de um bloco <style>, removendo vetores de exfiltração
 * e execução via CSS. Mantém o restante do CSS intacto.
 */
function sanitizeCssContent(css: string): string {
  let cleaned = css;
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned;
}

/**
 * Sanitiza uma tag <link>, permitindo apenas rel="stylesheet" com href
 * http:// ou https:// (qualquer host). Retorna a tag original se válida,
 * ou string vazia se não for um stylesheet seguro.
 */
function sanitizeLinkTag(linkTag: string): string {
  const relMatch = linkTag.match(/\brel\s*=\s*["']?stylesheet["']?/i);
  if (!relMatch) return "";

  const hrefMatch = linkTag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
  if (!hrefMatch) return "";

  const href = hrefMatch[1].trim();
  if (!/^https?:\/\//i.test(href)) return "";

  // Reconstruir a tag apenas com rel e href (descarta outros atributos)
  return `<link rel="stylesheet" href="${href}">`;
}

/**
 * Extrai <style> e <link rel="stylesheet"> do HTML, sanitiza cada um e
 * retorna a lista de assets seguros para reinserção.
 */
function extractAndSanitizeAssets(html: string): string[] {
  const assets: string[] = [];
  const matches = html.match(STYLE_LINK_REGEX) || [];

  for (const match of matches) {
    if (/^<style/i.test(match)) {
      const content = match.replace(/^<style[^>]*>/i, "").replace(/<\/style>$/i, "");
      const cleaned = sanitizeCssContent(content).trim();
      if (cleaned) {
        assets.push(`<style>${cleaned}</style>`);
      }
    } else if (/^<link/i.test(match)) {
      const safe = sanitizeLinkTag(match);
      if (safe) assets.push(safe);
    }
  }

  return assets;
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

  // Extrair e sanitizar <style> e <link rel="stylesheet"> ANTES do DOMPurify.
  // O DOMPurify remove style/link crus (FORBID_TAGS), então os assets seguros
  // são reinseridos no final.
  const safeAssets = extractAndSanitizeAssets(rawHtml);

  // Primeira passada: DOMPurify com regras estritas.
  // <style> e <link> estão em FORBID_TAGS — qualquer estilo não extraído
  // (ou malformado) é descartado.
  let sanitized = DOMPurify.sanitize(rawHtml, {
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

  // Segunda passada: remover iframes com URLs não permitidas.
  // Cobre aspas duplas, simples e sem aspas.
  sanitized = sanitized.replace(
    /<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi,
    (match, dq, sq, unquoted) => {
      const src = dq || sq || unquoted || "";
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

  // Quinta passada: reinserir os assets de estilo seguros no início do body
  if (safeAssets.length > 0) {
    sanitized = safeAssets.join("\n") + "\n" + sanitized;
  }

  // Sexta passada: verificar que pelo menos um mecanismo de form sobreviveu
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

  // Extrair e sanitizar <style> e <link rel="stylesheet"> ANTES do DOMPurify.
  const safeAssets = extractAndSanitizeAssets(rawHtml);

  // Sanitização estrita para preview: remove <script> e <style>/<link> crus,
  // mas NÃO exige {{FORM_SLOT}}/<form> (o preview pode ser de um rascunho
  // ainda sem formulário). O preview é renderizado via iframe sandbox.
  let sanitized = DOMPurify.sanitize(rawHtml, {
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
      "action", "method", "enctype", "formaction", "formmethod",
      "formtarget", "formnovalidate", "formenctype",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp|mailto|tel|sms):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });

  // Reinserir os assets de estilo seguros
  if (safeAssets.length > 0) {
    sanitized = safeAssets.join("\n") + "\n" + sanitized;
  }

  return sanitized;
}