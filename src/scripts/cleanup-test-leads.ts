import { prisma } from "../lib/prisma";

async function main() {
  console.log("🧹 Iniciando limpeza dos leads de teste...");
  
  const result = await prisma.lead.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "Lead Teste" } },
        { whatsapp: { startsWith: "1199999" } },
      ],
    },
  });

  console.log(`✅ Sucesso! ${result.count} leads de teste foram deletados do banco de dados.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao deletar leads:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
