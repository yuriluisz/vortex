const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";

function getHeaders() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const key = process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;

  if (token && token !== "seu_token_aqui") {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }
  
  if (key && email) {
    return {
      "Content-Type": "application/json",
      "X-Auth-Email": email,
      "X-Auth-Key": key,
    };
  }

  throw new Error("Credenciais da Cloudflare não configuradas no .env");
}

function getZoneId() {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!zoneId) {
    throw new Error("CLOUDFLARE_ZONE_ID não configurado no .env");
  }
  return zoneId;
}

/**
 * Adiciona um Custom Hostname na zona da Cloudflare.
 * Isso emite o certificado SSL automaticamente e permite o roteamento CNAME.
 */
export async function addCustomHostname(hostname: string) {
  try {
    const zoneId = getZoneId();
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          hostname: hostname,
          ssl: {
            method: "http", // Autenticação do SSL via HTTP (ideal para CNAME)
            type: "dv",
            settings: {
              http2: "on",
              min_tls_version: "1.2",
              tls_1_3: "on",
            },
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("[Cloudflare API Error - ADD]", JSON.stringify(data, null, 2));
      throw new Error(data.errors?.[0]?.message || "Falha ao adicionar Custom Hostname");
    }
    console.log(`[Cloudflare API] Hostname ${hostname} adicionado com sucesso!`, data.result);
    return data.result;
  } catch (error) {
    console.error(`[Cloudflare API] Error adding hostname ${hostname}:`, error);
    // Não quebraremos o sistema inteiro se a API da Cloudflare falhar (pode estar desconfigurado)
    // Mas logamos o erro.
  }
}

/**
 * Remove um Custom Hostname.
 * Primeiro busca o ID do hostname na API, depois envia um DELETE.
 */
export async function removeCustomHostname(hostname: string) {
  try {
    const zoneId = getZoneId();

    // 1. Buscar o ID do Custom Hostname
    const searchResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames?hostname=${hostname}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    const searchData = await searchResponse.json();
    if (!searchResponse.ok) {
      console.error("[Cloudflare API Error - SEARCH]", JSON.stringify(searchData, null, 2));
      throw new Error(searchData.errors?.[0]?.message || "Falha ao buscar Custom Hostname");
    }

    const hostnames = searchData.result || [];
    const targetHostname = hostnames.find((h: any) => h.hostname === hostname);

    if (!targetHostname) {
      console.log(`[Cloudflare API] Hostname ${hostname} não encontrado na Cloudflare para remoção.`);
      return;
    }

    // 2. Deletar usando o ID
    const deleteResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames/${targetHostname.id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    const deleteData = await deleteResponse.json();
    if (!deleteResponse.ok) {
      console.error("[Cloudflare API Error - DELETE]", JSON.stringify(deleteData, null, 2));
      throw new Error(deleteData.errors?.[0]?.message || "Falha ao remover Custom Hostname");
    }

    console.log(`[Cloudflare API] Hostname ${hostname} removido com sucesso.`);
    return deleteData.result;
  } catch (error) {
    console.error(`[Cloudflare API] Error removing hostname ${hostname}:`, error);
  }
}

export async function getCustomHostnameStatus(hostname: string) {
  try {
    const zoneId = getZoneId();
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames?hostname=${hostname}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );
    const data = await response.json();
    if (!response.ok) return null;
    const hostnames = data.result || [];
    const target = hostnames.find((h: any) => h.hostname === hostname);
    if (!target) return null;
    return target.status;
  } catch (error) {
    return null;
  }
}
