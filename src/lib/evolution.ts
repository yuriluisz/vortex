import "server-only";

// ============================================================================
// EVOLUTION API CLIENT
// ============================================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

/**
 * Helper para requisições à Evolution API.
 */
async function evolutionFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${EVOLUTION_API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(
      `Evolution API error [${res.status}] ${path}: ${text}`
    );
  }

  // Some endpoints return empty body
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return {} as T;
}

// ============================================================================
// INSTANCE MANAGEMENT
// ============================================================================

export interface CreateInstancePayload {
  instanceName: string;
  number?: string;
  qrcode?: boolean;
  integration?: string;
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
  };
  hash: string;
  qrcode?: {
    base64: string;
    code: string;
  };
}

/**
 * Cria uma instância na Evolution API.
 */
export async function createInstance(
  instanceName: string,
  phoneNumber: string
): Promise<CreateInstanceResponse> {
  return evolutionFetch<CreateInstanceResponse>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      number: phoneNumber,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

export interface QRCodeResponse {
  base64?: string;
  code?: string;
  pairingCode?: string;
}

/**
 * Obtém o QR Code para conexão da instância.
 */
export async function getQRCode(
  instanceName: string
): Promise<QRCodeResponse> {
  return evolutionFetch<QRCodeResponse>(
    `/instance/connect/${instanceName}`
  );
}

export interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: string; // "open" | "close" | "connecting"
  };
}

/**
 * Verifica o estado da conexão da instância.
 */
export async function getConnectionState(
  instanceName: string
): Promise<ConnectionStateResponse> {
  return evolutionFetch<ConnectionStateResponse>(
    `/instance/connectionState/${instanceName}`
  );
}

/**
 * Deleta uma instância da Evolution API.
 */
export async function deleteInstance(
  instanceName: string
): Promise<void> {
  await evolutionFetch(`/instance/delete/${instanceName}`, {
    method: "DELETE",
  });
}

/**
 * Reinicia a instância (útil para reconectar).
 */
export async function restartInstance(
  instanceName: string
): Promise<void> {
  await evolutionFetch(`/instance/restart/${instanceName}`, {
    method: "PUT",
  });
}

// ============================================================================
// WEBHOOK
// ============================================================================

/**
 * Configura o webhook da instância para receber eventos.
 */
export async function setWebhook(
  instanceName: string,
  webhookUrl: string
): Promise<void> {
  await evolutionFetch(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        byEvents: false,
        base64: false,
        events: [
          "GROUP_PARTICIPANTS_UPDATE",
          "CONNECTION_UPDATE",
        ],
      }
    }),
  });
}

// ============================================================================
// GROUP OPERATIONS
// ============================================================================

export interface EvolutionGroupParticipant {
  id: string;
  admin?: string | null;
}

export interface EvolutionGroup {
  id: string; // JID
  subject: string;
  size: number;
  participants: EvolutionGroupParticipant[];
  inviteCode?: string;
}

/**
 * Lista todos os grupos da instância com participantes.
 */
export async function fetchAllGroups(
  instanceName: string
): Promise<EvolutionGroup[]> {
  const result = await evolutionFetch<EvolutionGroup[]>(
    `/group/fetchAllGroups/${instanceName}?getParticipants=true`
  );
  return Array.isArray(result) ? result : [];
}

export interface GroupInviteInfo {
  id: string; // groupJid
  subject: string;
  size: number;
  participants?: EvolutionGroupParticipant[];
}

/**
 * Busca informações de um grupo pelo invite code.
 */
export async function fetchGroupByInviteCode(
  instanceName: string,
  inviteCode: string
): Promise<GroupInviteInfo | null> {
  try {
    return await evolutionFetch<GroupInviteInfo>(
      `/group/inviteInfo/${instanceName}?inviteCode=${inviteCode}`
    );
  } catch {
    return null;
  }
}

/**
 * Busca o invite code de um grupo pelo JID.
 */
export async function fetchInviteCode(
  instanceName: string,
  groupJid: string
): Promise<string | null> {
  try {
    const result = await evolutionFetch<{ inviteCode?: string }>(
      `/group/inviteCode/${instanceName}?groupJid=${groupJid}`
    );
    return result.inviteCode || null;
  } catch {
    return null;
  }
}

/**
 * Lista participantes de um grupo específico.
 */
export async function fetchGroupParticipants(
  instanceName: string,
  groupJid: string
): Promise<EvolutionGroupParticipant[]> {
  try {
    const result = await evolutionFetch<{ participants: EvolutionGroupParticipant[] }>(
      `/group/participants/${instanceName}?groupJid=${groupJid}`
    );
    return result.participants || [];
  } catch {
    return [];
  }
}

export interface CreateGroupResponse {
  id: string; // JID do grupo criado
  inviteCode?: string;
}

/**
 * Cria um novo grupo via Evolution API.
 */
export async function createEvolutionGroup(
  instanceName: string,
  groupName: string,
  participants: string[] = []
): Promise<CreateGroupResponse | null> {
  try {
    return await evolutionFetch<CreateGroupResponse>(
      `/group/create/${instanceName}`,
      {
        method: "POST",
        body: JSON.stringify({
          subject: groupName,
          participants,
        }),
      }
    );
  } catch {
    return null;
  }
}

export type GroupSettingAction = "announcement" | "not_announcement" | "locked" | "unlocked";

/**
 * Atualiza configurações de um grupo.
 */
export async function updateGroupSetting(
  instanceName: string,
  groupJid: string,
  action: GroupSettingAction
): Promise<boolean> {
  try {
    await evolutionFetch(
      `/group/updateSetting/${instanceName}?groupJid=${groupJid}`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      }
    );
    return true;
  } catch (error) {
    console.error(`Error updating group setting ${action}:`, error);
    return false;
  }
}

/**
 * Atualiza a foto do grupo.
 */
export async function updateGroupPicture(
  instanceName: string,
  groupJid: string,
  base64Image: string
): Promise<boolean> {
  try {
    await evolutionFetch(`/group/updateGroupPicture/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        groupJid,
        image: base64Image,
      }),
    });
    return true;
  } catch (error) {
    console.error(`Error updating group picture:`, error);
    return false;
  }
}

/**
 * Atualiza a descrição do grupo.
 */
export async function updateGroupDescription(
  instanceName: string,
  groupJid: string,
  description: string
): Promise<boolean> {
  try {
    await evolutionFetch(`/group/updateGroupDescription/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        groupJid,
        description,
      }),
    });
    return true;
  } catch (error) {
    console.error(`Error updating group description:`, error);
    return false;
  }
}

/**
 * Promove ou rebaixa participantes de um grupo.
 * action pode ser "add", "remove", "promote", "demote"
 */
export async function updateGroupParticipant(
  instanceName: string,
  groupJid: string,
  action: "add" | "remove" | "promote" | "demote",
  participants: string[]
): Promise<boolean> {
  if (!participants.length) return false;
  
  try {
    await evolutionFetch(`/group/updateParticipant/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        groupJid,
        action,
        participants,
      }),
    });
    return true;
  } catch (error) {
    console.error(`Error updating group participants (${action}):`, error);
    return false;
  }
}

// ============================================================================
// MESSAGING
// ============================================================================

export interface SendMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  status: string;
}

/**
 * Envia uma mensagem de texto para um grupo.
 */
export async function sendTextMessage(
  instanceName: string,
  groupJid: string,
  text: string
): Promise<SendMessageResponse> {
  return evolutionFetch<SendMessageResponse>(
    `/message/sendText/${instanceName}`,
    {
      method: "POST",
      body: JSON.stringify({
        number: groupJid,
        text,
      }),
    }
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrai o invite code de uma URL de convite do WhatsApp.
 * Ex: "https://chat.whatsapp.com/ABC123" → "ABC123"
 */
export function extractInviteCode(url: string): string | null {
  const match = url.match(
    /chat\.whatsapp\.com\/([a-zA-Z0-9]+)/
  );
  return match?.[1] || null;
}

/**
 * Normaliza um número de telefone para o formato da Evolution API.
 * Remove caracteres não numéricos e garante formato internacional.
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, "");

  // Se começa com 0, remove (número nacional brasileiro)
  if (digits.startsWith("0")) {
    return `55${digits.slice(1)}`;
  }

  // Se não começa com 55, adiciona DDI brasileiro
  if (!digits.startsWith("55")) {
    return `55${digits}`;
  }

  return digits;
}
