import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Seed não pode rodar em produção!");
    process.exit(1);
  }

  console.log("🌱 Seeding database...");

  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const userPasswordHash = await bcrypt.hash("Teste123!", 12);

  // === DEFAULT TENANT ===
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: "default" },
    update: {},
    create: {
      name: "Default",
      slug: "default",
      plan: "FREE",
      maxCampaigns: 1,
      maxGroups: 3,
      maxLeads: 100,
    },
  });

  console.log(`  ✓ Tenant "default"`);

  // === SUPER ADMIN (sem tenant) ===
  await prisma.user.upsert({
    where: { email: "admin@vortex.app" },
    update: {},
    create: {
      email: "admin@vortex.app",
      name: "Super Admin",
      passwordHash: adminPasswordHash,
      tenantId: null,
      role: "SUPER_ADMIN",
    },
  });

  console.log(`  ✓ Super Admin (admin@vortex.app)`);

  // === DEMO USER (com tenant) ===
  await prisma.user.upsert({
    where: { email: "demo@vortex.app" },
    update: {},
    create: {
      email: "demo@vortex.app",
      name: "Usuário Demo",
      passwordHash: userPasswordHash,
      tenantId: defaultTenant.id,
      role: "ADMIN",
    },
  });

  console.log(`  ✓ Demo User (demo@vortex.app)`);

  // === DEMO CAMPAIGN ===
  const demoCampaign = await prisma.campaign.upsert({
    where: {
      tenantId_slug: { tenantId: defaultTenant.id, slug: "demo" },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      slug: "demo",
      name: "Campanha Demo",
      rawHtml: `<div class="container">
  <h1>{{FORM_SLOT}}</h1>
</div>`,
      formSchema: [
        { type: "text", label: "Nome", name: "name", required: true },
        { type: "text", label: "WhatsApp", name: "whatsapp", required: true },
      ],
      active: true,
    },
  });

  console.log(`  ✓ Demo Campaign (${demoCampaign.slug})`);

  // === DEMO GROUP ===
  await prisma.group.upsert({
    where: {
      id: "demo-group",
    },
    update: {},
    create: {
      id: "demo-group",
      tenantId: defaultTenant.id,
      campaignId: demoCampaign.id,
      name: "Grupo VIP Demo",
      url: "https://chat.whatsapp.com/demo",
      maxCapacity: 150,
      active: true,
    },
  });

  console.log(`  ✓ Demo Group`);

  console.log("\n✅ Seed concluído!");
  console.log("\n📧 Acessos:");
  console.log("  Super Admin: admin@vortex.app / Admin123!");
  console.log("  Demo User:   demo@vortex.app / Teste123!");
  console.log("  Tenant:      default.vortex.app");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });