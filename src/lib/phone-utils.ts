/**
 * Utilitários para sanitização, normalização e comparação de números de telefone (WhatsApp).
 * Lida com variações de máscaras, formatos internacionais (+55) e 9º dígito no Brasil.
 */

/**
 * Extrai apenas os dígitos numéricos de uma string.
 */
export function cleanDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Normaliza um número de telefone para o padrão internacional (E.164 simplificado sem +).
 * - Remove espaços, máscaras e caracteres não numéricos.
 * - Remove 0 à esquerda de DDDs nacionais.
 * - Adiciona DDI 55 caso seja um número brasileiro (10 ou 11 dígitos).
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  const digits = cleanDigits(phone);
  if (!digits) return "";

  // Se começa com 0 (ex: 011987654321), remove o 0 inicial
  let clean = digits.startsWith("0") ? digits.slice(1) : digits;

  // Se tem 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 dígitos), adiciona DDI 55
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }

  return clean;
}

/**
 * Extrai o DDD brasileiro de um número de telefone, se aplicável.
 */
export function extractDDD(phone: string | null | undefined): string | null {
  const digits = cleanDigits(phone);
  if (!digits) return null;

  const clean = digits.startsWith("0") ? digits.slice(1) : digits;

  // 5511987654321 ou 551187654321
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) {
    return clean.slice(2, 4);
  }

  // 11987654321 ou 1187654321
  if (clean.length === 10 || clean.length === 11) {
    return clean.slice(0, 2);
  }

  return null;
}

/**
 * Extrai os últimos 8 dígitos (corpo base do telefone no Brasil).
 */
export function extractBaseNumber(phone: string | null | undefined): string | null {
  const digits = cleanDigits(phone);
  if (!digits || digits.length < 8) return null;
  return digits.slice(-8);
}

/**
 * Gera uma lista de todas as representações possíveis de um número de telefone
 * para uso em queries de banco de dados (Prisma OR conditions).
 */
export function extractPhoneVariants(phone: string | null | undefined): string[] {
  if (!phone) return [];

  const rawDigits = cleanDigits(phone);
  if (!rawDigits || rawDigits.length < 4) return [];

  const variants = new Set<string>();

  // 1. O próprio número original limpo
  variants.add(phone.trim());
  variants.add(rawDigits);

  const normalized = normalizePhoneNumber(phone);
  if (normalized) {
    variants.add(normalized);
    variants.add(`+${normalized}`);
  }

  const ddd = extractDDD(phone);
  const base8 = extractBaseNumber(phone);

  if (base8) {
    const part1_8 = base8.slice(0, 4); // ex: 8765
    const part2 = base8.slice(4);      // ex: 4321
    const hyphen8 = `${part1_8}-${part2}`; // ex: 8765-4321
    const hyphen9 = `9${part1_8}-${part2}`; // ex: 98765-4321

    variants.add(base8);
    variants.add(`9${base8}`);
    variants.add(hyphen8);
    variants.add(hyphen9);

    if (ddd) {
      // Sem o 9
      variants.add(`${ddd}${base8}`);
      variants.add(`55${ddd}${base8}`);
      variants.add(`+55${ddd}${base8}`);
      variants.add(`(${ddd}) ${base8}`);
      variants.add(`(${ddd}) ${hyphen8}`);
      variants.add(`(${ddd})${hyphen8}`);
      variants.add(`(${ddd}) ${part1_8} ${part2}`);
      variants.add(`${ddd} ${hyphen8}`);
      variants.add(`+55 (${ddd}) ${hyphen8}`);
      variants.add(`+55 ${ddd} ${hyphen8}`);

      // Com o 9
      variants.add(`${ddd}9${base8}`);
      variants.add(`55${ddd}9${base8}`);
      variants.add(`+55${ddd}9${base8}`);
      variants.add(`(${ddd}) 9${base8}`);
      variants.add(`(${ddd}) ${hyphen9}`);
      variants.add(`(${ddd})${hyphen9}`);
      variants.add(`(${ddd}) 9 ${part1_8} ${part2}`);
      variants.add(`(${ddd}) 9${part1_8}-${part2}`);
      variants.add(`${ddd} ${hyphen9}`);
      variants.add(`+55 (${ddd}) ${hyphen9}`);
      variants.add(`+55 ${ddd} ${hyphen9}`);
    }
  }

  return Array.from(variants).filter((v) => v.length >= 4);
}

/**
 * Compara dois telefones e verifica se correspondem à mesma pessoa.
 * Tolerante a:
 * - Presença ou ausência de DDI (+55)
 * - Presença ou ausência de 9º dígito
 * - Máscaras, parênteses, traços e espaços
 */
export function matchesPhoneNumber(
  phoneA: string | null | undefined,
  phoneB: string | null | undefined
): boolean {
  if (!phoneA || !phoneB) return false;

  const digitsA = cleanDigits(phoneA);
  const digitsB = cleanDigits(phoneB);

  if (!digitsA || !digitsB) return false;

  // 1. Comparação exata de dígitos
  if (digitsA === digitsB) return true;

  // 2. Comparação normalizada (E.164 sem +)
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (normA && normB && normA === normB) return true;

  // 3. Comparação com tolerância ao 9º dígito no Brasil
  const baseA = extractBaseNumber(digitsA);
  const baseB = extractBaseNumber(digitsB);

  if (baseA && baseB && baseA === baseB) {
    const dddA = extractDDD(digitsA);
    const dddB = extractDDD(digitsB);

    // Se ambos possuem DDD identificado, os DDDs DEVEM coincidir
    if (dddA && dddB) {
      return dddA === dddB;
    }

    // Se um dos dois não tem DDD (apenas número local), os 8 dígitos batem
    return true;
  }

  return false;
}
