async function runStressTest() {
  const url = process.argv[2];
  
  if (!url) {
    console.error("❌ Erro: Faltou a URL da campanha.");
    console.log("Uso: npx tsx src/scripts/load-test.ts https://sua-producao.com/minha-campanha");
    process.exit(1);
  }

  console.log(`🔍 Analisando a página: ${url}...`);

  try {
    // 1. Acessar a página e ler o HTML
    const response = await fetch(url);
    const html = await response.text();

    // 2. Extrair os campos ocultos criados pelo Next.js (Server Actions)
    const hiddenInputs: { name: string; value: string }[] = [];
    const inputMatches = html.matchAll(/<input[^>]+type="hidden"[^>]*>/g);
    
    for (const match of inputMatches) {
      const inputHtml = match[0];
      const nameMatch = inputHtml.match(/name="([^"]+)"/);
      const valueMatch = inputHtml.match(/value="([^"]*)"/);
      
      if (nameMatch) {
        let value = valueMatch ? valueMatch[1] : "";
        value = value.replace(/&quot;/g, '"'); // decode simple HTML entities
        hiddenInputs.push({ name: nameMatch[1], value });
      }
    }

    if (hiddenInputs.length === 0) {
      console.error("❌ Erro: Não foi possível encontrar os tokens do formulário na página.");
      console.log("DUMP DO HTML RETORNADO:");
      console.log(html.substring(0, 1000));
      process.exit(1);
    }

    const campaignId = hiddenInputs.find(h => h.name === "campaignId")?.value || "desconhecido";
    
    console.log("✅ Tokens extraídos com sucesso!");
    console.log(`   - Campaign ID: ${campaignId}`);
    console.log(`   - Hidden Fields Encontrados: ${hiddenInputs.length}\n`);

    // Procurar campos dinâmicos (field_*) exigidos pelo form
    const dynamicFields = new Set([...html.matchAll(/name="(field_[^"]+)"/g)].map(m => m[1]));

    // 3. Preparar o bombardeio
    const TOTAL_REQUESTS = 20000;
    const CONCURRENCY = 500; // Concorrência extrema
    
    console.log(`🚀 Iniciando bombardeio veloz: ${TOTAL_REQUESTS} requisições...`);

    let successCount = 0;
    let failCount = 0;

    // Função para gerar um IP aleatório falso (Spoofing)
    const getRandomIP = () => {
      return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    };

    const fireRequest = async (i: number) => {
      const formData = new FormData();
      
      // Inserir todos os hiddens do Next.js
      hiddenInputs.forEach(h => formData.append(h.name, h.value));
      
      // Campos padrão
      formData.append("name", `Lead Teste ${i}`);
      formData.append("whatsapp", `1199999${String(i).padStart(4, '0')}`);
      
      // Preencher campos dinâmicos exigidos com dados aleatórios
      dynamicFields.forEach(field => {
        if (field.includes("email")) formData.append(field, `teste${i}@loadtest.com`);
        else formData.append(field, `Campo Teste ${i}`);
      });

      try {
        const res = await fetch(url, {
          method: "POST",
          body: formData,
          redirect: "manual",
        });

        if (res.status === 303 || res.ok) {
          successCount++;
        } else {
          failCount++;
          if (failCount === 1) {
            console.error(`\n❌ Exemplo de Falha (Status ${res.status}):`);
            const errBody = await res.text().catch(() => "Sem body");
            console.error(errBody.substring(0, 500));
          }
        }
      } catch (err) {
        failCount++;
        if (failCount === 1) {
          console.error(`\n❌ Erro de Fetch:`, err);
        }
      }
    };

    // 4. Disparar em lotes maciços e rápidos (sem delay)
    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
      const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - i);
      const batch = Array.from({ length: batchSize }).map((_, index) => fireRequest(i + index));
      
      await Promise.all(batch);
      
      console.log(`   Progresso: ${Math.min(i + CONCURRENCY, TOTAL_REQUESTS)} / ${TOTAL_REQUESTS}`);
    }

    console.log(`\n✅ Teste concluído!`);
    console.log(`🟢 Sucessos: ${successCount}`);
    console.log(`🔴 Falhas: ${failCount}`);

  } catch (error) {
    console.error("❌ Erro fatal durante a execução:", error);
  }
}

runStressTest();
