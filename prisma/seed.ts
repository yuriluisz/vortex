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

  // === ADMIN USER (VortexPages) ===
  const vortexAdminPasswordHash = await bcrypt.hash("Vortex123!", 12);
  const vortexAdmin = await prisma.user.upsert({
    where: { email: "yulusica@gmail.com" },
    update: {},
    create: {
      email: "yulusica@gmail.com",
      name: "VortexPages",
      passwordHash: vortexAdminPasswordHash,
      tenantId: defaultTenant.id,
      role: "ADMIN",
      handle: "vortexpages",
      displayName: "VortexPages",
      bio: "Criador de templates e landing pages de alta conversão. Explore nossos templates gratuitos e eleve seus projetos.",
      publicProfile: true,
      profileLinks: JSON.stringify({
        website: "https://vortexpages.online",
        instagram: "https://instagram.com/vortexpages",
        youtube: "https://youtube.com/@vortexpages",
        whatsapp: "https://wa.me/5511999999999",
      }),
    },
  });

  console.log(`  ✓ VortexPages Admin (yulusica@gmail.com)`);

  // === OFFICIAL TEMPLATES ===
  
  // Template 1: Evento Exclusivo
  const eventoTemplate = await prisma.template.upsert({
    where: { slug: "evento-exclusivo" },
    update: {},
    create: {
      id: "template-evento-exclusivo",
      slug: "evento-exclusivo",
      name: "Dark Evento Exclusivo",
      description: "Tema imersivo de alta conversão para masterclasses, lançamentos e eventos online. Com countdown, speakers e CTA de inscrição.",
      thumbnailUrl: "",
      category: "EVENT",
      theme: "DARK",
      primaryColor: "#050505",
      typography: "Inter",
      productType: "Evento Online / Masterclass",
      tags: ["evento", "masterclass", "lançamento", "countdown", "inscrição", "dark", "imersivo"],
      status: "PUBLISHED",
      isFeatured: true,
      authorId: vortexAdmin.id,
      versions: {
        create: {
          version: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          formSchema: [
            { type: "text", label: "Nome", name: "name", required: true },
            { type: "text", label: "WhatsApp", name: "whatsapp", required: true },
          ],
          rawHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evento Exclusivo</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #050505; color: #fff; overflow-x: hidden; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    
    /* Hero */
    .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(251, 146, 60, 0.1) 0%, transparent 50%); }
    .badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 100px; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); font-size: 14px; font-weight: 600; color: #c084fc; margin-bottom: 32px; position: relative; }
    .badge::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #a855f7; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    h1 { font-size: clamp(40px, 8vw, 80px); font-weight: 900; line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 24px; position: relative; }
    h1 span { background: linear-gradient(135deg, #fbbf24, #f59e0b, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { font-size: 20px; color: #a1a1aa; max-width: 600px; margin: 0 auto 48px; line-height: 1.6; position: relative; }
    .cta-btn { display: inline-flex; align-items: center; gap: 12px; padding: 18px 40px; border-radius: 100px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; font-size: 18px; font-weight: 700; text-decoration: none; transition: all 0.3s; box-shadow: 0 0 40px rgba(168, 85, 247, 0.3); }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(168, 85, 247, 0.5); }
    
    /* Countdown */
    .countdown-section { padding: 80px 0; text-align: center; }
    .countdown-label { font-size: 14px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-bottom: 32px; }
    .countdown { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
    .countdown-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px 32px; min-width: 120px; }
    .countdown-number { font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #fbbf24, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .countdown-unit { font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; margin-top: 4px; }
    
    /* Speakers */
    .speakers-section { padding: 80px 0; }
    .section-title { font-size: 36px; font-weight: 800; text-align: center; margin-bottom: 64px; }
    .speakers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 32px; }
    .speaker-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px; text-align: center; transition: all 0.3s; }
    .speaker-card:hover { border-color: rgba(168, 85, 247, 0.3); transform: translateY(-4px); }
    .speaker-avatar { width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; background: linear-gradient(135deg, #a855f7, #fbbf24); display: flex; align-items: center; justify-content: center; font-size: 36px; }
    .speaker-name { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .speaker-role { font-size: 14px; color: #71717a; }
    
    /* Form Section */
    .form-section { padding: 80px 0; text-align: center; }
    .form-container { max-width: 500px; margin: 0 auto; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 48px; }
    
    /* Footer */
    footer { padding: 40px 0; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); }
    footer p { color: #52525b; font-size: 14px; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="container">
      <div class="badge">🔥 Vagas Limitadas</div>
      <h1>O Evento Que Vai<br><span>Transformar Seu Negócio</span></h1>
      <p class="subtitle">Aprenda as estratégias que os maiores players do mercado usam para faturar 7 dígitos. Ao vivo, com acesso por tempo limitado.</p>
      <a href="#inscricao" class="cta-btn">Garantir Minha Vaga →</a>
    </div>
  </section>

  <section class="countdown-section">
    <div class="container">
      <div class="countdown-label">O evento começa em</div>
      <div class="countdown">
        <div class="countdown-item"><div class="countdown-number">03</div><div class="countdown-unit">Dias</div></div>
        <div class="countdown-item"><div class="countdown-number">14</div><div class="countdown-unit">Horas</div></div>
        <div class="countdown-item"><div class="countdown-number">27</div><div class="countdown-unit">Min</div></div>
        <div class="countdown-item"><div class="countdown-number">45</div><div class="countdown-unit">Seg</div></div>
      </div>
    </div>
  </section>

  <section class="speakers-section">
    <div class="container">
      <h2 class="section-title">Quem Vai Palestrar</h2>
      <div class="speakers-grid">
        <div class="speaker-card">
          <div class="speaker-avatar">👨‍💻</div>
          <div class="speaker-name">Carlos Silva</div>
          <div class="speaker-role">CEO & Fundador · R$50M em vendas</div>
        </div>
        <div class="speaker-card">
          <div class="speaker-avatar">👩‍🚀</div>
          <div class="speaker-name">Ana Oliveira</div>
          <div class="speaker-role">Head de Growth · ScaleUp Inc</div>
        </div>
        <div class="speaker-card">
          <div class="speaker-avatar">🧑‍🎤</div>
          <div class="speaker-name">Pedro Santos</div>
          <div class="speaker-role">Investidor · 3 exits bem-sucedidos</div>
        </div>
      </div>
    </div>
  </section>

  <section class="form-section" id="inscricao">
    <div class="container">
      <h2 class="section-title">Inscreva-se Agora</h2>
      <div class="form-container">
        {{FORM_SLOT}}
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>© 2025 Evento Exclusivo. Todos os direitos reservados.</p>
    </div>
  </footer>
</body>
</html>`,
        },
      },
    },
  });

  console.log(`  ✓ Template: ${eventoTemplate.name}`);

  // Template 2: Mentoria
  const mentoriaTemplate = await prisma.template.upsert({
    where: { slug: "mentoria-autoridade" },
    update: {},
    create: {
      id: "template-mentoria-autoridade",
      slug: "mentoria-autoridade",
      name: "Light Clean Mentoria",
      description: "Layout espaçoso e moderno focado em autoridade e clareza. Ideal para páginas de mentoria, coaching e consultoria premium.",
      thumbnailUrl: "",
      category: "LANDING_PAGE",
      theme: "LIGHT",
      primaryColor: "#F8FAFC",
      typography: "Inter",
      productType: "Mentoria / Coaching Premium",
      tags: ["mentoria", "coaching", "consultoria", "autoridade", "premium", "light", "clean"],
      status: "PUBLISHED",
      isFeatured: true,
      authorId: vortexAdmin.id,
      versions: {
        create: {
          version: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          formSchema: [
            { type: "text", label: "Nome", name: "name", required: true },
            { type: "text", label: "WhatsApp", name: "whatsapp", required: true },
          ],
          rawHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mentoria Premium</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #F8FAFC; color: #1E293B; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    
    /* Nav */
    nav { padding: 24px 0; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 24px; font-weight: 800; color: #0F172A; }
    .nav-cta { padding: 12px 28px; border-radius: 100px; background: #0F172A; color: #fff; font-weight: 600; text-decoration: none; font-size: 14px; }
    
    /* Hero */
    .hero { padding: 100px 0 80px; text-align: center; }
    .hero-badge { display: inline-block; padding: 8px 20px; border-radius: 100px; background: #ECFDF4; color: #059669; font-size: 14px; font-weight: 600; margin-bottom: 32px; }
    h1 { font-size: clamp(36px, 6vw, 64px); font-weight: 800; line-height: 1.1; color: #0F172A; margin-bottom: 24px; letter-spacing: -0.02em; }
    h1 span { color: #059669; }
    .hero-sub { font-size: 20px; color: #64748B; max-width: 600px; margin: 0 auto 48px; line-height: 1.6; }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { padding: 16px 36px; border-radius: 100px; background: #059669; color: #fff; font-weight: 700; text-decoration: none; font-size: 16px; transition: all 0.3s; }
    .btn-primary:hover { background: #047857; transform: translateY(-2px); }
    .btn-secondary { padding: 16px 36px; border-radius: 100px; background: transparent; color: #0F172A; font-weight: 600; text-decoration: none; font-size: 16px; border: 2px solid #E2E8F0; }
    
    /* Social Proof */
    .proof { padding: 60px 0; text-align: center; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; }
    .proof-logos { display: flex; justify-content: center; gap: 48px; flex-wrap: wrap; opacity: 0.4; margin-bottom: 32px; }
    .proof-logo { font-size: 24px; font-weight: 700; color: #475569; }
    .proof-stats { display: flex; justify-content: center; gap: 64px; flex-wrap: wrap; }
    .stat-number { font-size: 48px; font-weight: 900; color: #059669; }
    .stat-label { font-size: 14px; color: #64748B; margin-top: 4px; }
    
    /* About */
    .about { padding: 100px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
    .about-image { aspect-ratio: 4/5; border-radius: 24px; background: linear-gradient(135deg, #059669, #34D399); display: flex; align-items: center; justify-content: center; font-size: 120px; }
    .about-label { font-size: 14px; text-transform: uppercase; letter-spacing: 0.15em; color: #059669; font-weight: 600; margin-bottom: 16px; }
    .about-title { font-size: 40px; font-weight: 800; color: #0F172A; margin-bottom: 24px; line-height: 1.15; }
    .about-text { font-size: 16px; color: #64748B; line-height: 1.7; margin-bottom: 32px; }
    
    /* Testimonials */
    .testimonials { padding: 100px 0; background: #fff; }
    .section-title { font-size: 36px; font-weight: 800; text-align: center; margin-bottom: 64px; color: #0F172A; }
    .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px; }
    .testimonial-card { background: #F8FAFC; border-radius: 20px; padding: 32px; }
    .testimonial-stars { color: #FBBF24; font-size: 18px; margin-bottom: 16px; }
    .testimonial-text { font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px; font-style: italic; }
    .testimonial-author { display: flex; align-items: center; gap: 12px; }
    .testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #059669, #34D399); }
    .testimonial-name { font-weight: 600; color: #0F172A; }
    .testimonial-role { font-size: 14px; color: #64748B; }
    
    /* CTA */
    .cta-section { padding: 100px 0; text-align: center; }
    .cta-box { background: #0F172A; border-radius: 32px; padding: 80px 48px; text-align: center; }
    .cta-box h2 { font-size: 40px; font-weight: 800; color: #fff; margin-bottom: 16px; }
    .cta-box p { font-size: 18px; color: #94A3B8; margin-bottom: 40px; }
    
    /* Form */
    .form-container { max-width: 480px; margin: 0 auto; }
    
    footer { padding: 40px 0; text-align: center; border-top: 1px solid #E2E8F0; }
    footer p { color: #94A3B8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <div class="logo">MENTORIA</div>
      <a href="#inscricao" class="nav-cta">Agendar Conversa</a>
    </nav>
  </div>

  <section class="hero">
    <div class="container">
      <div class="hero-badge">✨ Vagas Abertas — Turma 2025</div>
      <h1>Alcance o próximo nível<br>com <span>mentoria estratégica</span></h1>
      <p class="hero-sub">Programa exclusivo para empreendedores que querem escalar seus negócios para R$100k/mês em 90 dias ou menos.</p>
      <div class="hero-buttons">
        <a href="#inscricao" class="btn-primary">Quero Saber Mais</a>
        <a href="#sobre" class="btn-secondary">Conhecer o Programa</a>
      </div>
    </div>
  </section>

  <section class="proof">
    <div class="container">
      <div class="proof-logos">
        <div class="proof-logo">FORBES</div>
        <div class="proof-logo">EXAME</div>
        <div class="proof-logo">IPO</div>
        <div class="proof-logo">STARTERS</div>
      </div>
      <div class="proof-stats">
        <div><div class="stat-number">500+</div><div class="stat-label">Alunos mentorados</div></div>
        <div><div class="stat-number">R$50M+</div><div class="stat-label">Faturamento gerado</div></div>
        <div><div class="stat-number">97%</div><div class="stat-label">Taxa de satisfação</div></div>
      </div>
    </div>
  </section>

  <section class="about" id="sobre">
    <div class="about-image">👤</div>
    <div>
      <div class="about-label">Sua Mentora</div>
      <h2 class="about-title">Maria Souza — 12 anos de mercado</h2>
      <p class="about-text">Fundadora de 3 empresas exitosas, investidora anjo e palestrante internacional. Já ajudou mais de 500 empreendedores a alcançarem resultados extraordinários através de mentoria individualizada.</p>
      <p class="about-text">Seu método único combina estratégia financeira com mindset de crescimento, criando um caminho claro do ponto A ao ponto B.</p>
    </div>
  </section>

  <section class="testimonials">
    <div class="container">
      <h2 class="section-title">O Que Dizem Nossos Alunos</h2>
      <div class="testimonials-grid">
        <div class="testimonial-card">
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-text">"Em 3 meses de mentoria, tripliquei meu faturamento. O programa é transformador."</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar"></div>
            <div><div class="testimonial-name">João Mendes</div><div class="testimonial-role">CEO, TechStart</div></div>
          </div>
        </div>
        <div class="testimonial-card">
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-text">"A mentoria me deu clareza e estratégia. Saí da estaca zero e faturei R$1M no primeiro ano."</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar"></div>
            <div><div class="testimonial-name">Camila Rocha</div><div class="testimonial-role">Fundadora, Digital Pro</div></div>
          </div>
        </div>
        <div class="testimonial-card">
          <div class="testimonial-stars">★★★★★</div>
          <p class="testimonial-text">"Investimento com maior retorno que já fiz na minha carreira. Simples assim."</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar"></div>
            <div><div class="testimonial-name">Rafael Lima</div><div class="testimonial-role">Investidor</div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="cta-section" id="inscricao">
    <div class="container">
      <div class="cta-box">
        <h2>Pronto para o próximo nível?</h2>
        <p>Agende uma conversa gratuita e descubra se você se encaixa no programa.</p>
        <div class="form-container">
          {{FORM_SLOT}}
        </div>
      </div>
    </div>
  </section>

  <footer>
    <p>© 2025 Mentoria Premium. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`,
        },
      },
    },
  });

  console.log(`  ✓ Template: ${mentoriaTemplate.name}`);

  // Template 3: E-commerce Launch
  const ecommerceTemplate = await prisma.template.upsert({
    where: { slug: "ecommerce-launch" },
    update: {},
    create: {
      id: "template-ecommerce-launch",
      slug: "ecommerce-launch",
      name: "E-commerce Launch",
      description: "Página de lançamento com contagem regressiva, urgência visual e grid de produtos. Ideal para drops, pré-venda e lançamentos de produtos físicos/digitais.",
      thumbnailUrl: "",
      category: "ECOMMERCE",
      theme: "COLORFUL",
      primaryColor: "#1a1a2e",
      typography: "Inter",
      productType: "E-commerce / Drop / Pré-venda",
      tags: ["ecommerce", "drop", "pré-venda", "lançamento", "produtos", "urgência", "contagem regressiva"],
      status: "PUBLISHED",
      isFeatured: true,
      authorId: vortexAdmin.id,
      versions: {
        create: {
          version: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          formSchema: [
            { type: "text", label: "Nome", name: "name", required: true },
            { type: "text", label: "WhatsApp", name: "whatsapp", required: true },
          ],
          rawHtml: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lançamento Exclusivo</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #1a1a2e; color: #fff; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    
    /* Nav */
    nav { padding: 20px 0; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 22px; font-weight: 900; background: linear-gradient(135deg, #EC4899, #F97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .live-badge { padding: 6px 16px; border-radius: 100px; background: rgba(236, 72, 153, 0.15); border: 1px solid rgba(236, 72, 153, 0.3); font-size: 12px; font-weight: 700; color: #EC4899; display: flex; align-items: center; gap: 6px; }
    .live-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #EC4899; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    
    /* Hero */
    .hero { padding: 80px 0 60px; text-align: center; }
    .hero-tag { display: inline-block; padding: 8px 20px; border-radius: 100px; background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); font-size: 13px; font-weight: 700; color: #F97316; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { font-size: clamp(36px, 7vw, 72px); font-weight: 900; line-height: 1.05; margin-bottom: 20px; letter-spacing: -0.03em; }
    h1 span { background: linear-gradient(135deg, #EC4899, #F97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-sub { font-size: 18px; color: #9CA3AF; max-width: 550px; margin: 0 auto 40px; line-height: 1.6; }
    
    /* Countdown */
    .countdown-bar { display: flex; justify-content: center; gap: 16px; margin-bottom: 48px; flex-wrap: wrap; }
    .cd-item { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 90px; }
    .cd-num { font-size: 36px; font-weight: 900; background: linear-gradient(135deg, #EC4899, #F97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cd-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #6B7280; margin-top: 2px; }
    
    /* Urgency */
    .urgency { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 64px; }
    .urgency-item { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 100px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); font-size: 14px; font-weight: 600; color: #FCA5A5; }
    
    /* Products */
    .products-section { padding: 60px 0 80px; }
    .section-title { font-size: 32px; font-weight: 800; text-align: center; margin-bottom: 48px; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .product-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; overflow: hidden; transition: all 0.3s; }
    .product-card:hover { border-color: rgba(236, 72, 153, 0.3); transform: translateY(-4px); }
    .product-image { aspect-ratio: 16/10; background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(249, 115, 22, 0.2)); display: flex; align-items: center; justify-content: center; font-size: 64px; position: relative; }
    .product-badge { position: absolute; top: 12px; left: 12px; padding: 4px 12px; border-radius: 100px; background: #EF4444; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .product-info { padding: 20px; }
    .product-name { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .product-price { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
    .price-old { font-size: 14px; color: #6B7280; text-decoration: line-through; }
    .price-new { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #EC4899, #F97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .product-btn { display: block; width: 100%; padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #EC4899, #F97316); color: #fff; font-weight: 700; text-align: center; text-decoration: none; font-size: 14px; }
    
    /* Form */
    .form-section { padding: 60px 0; text-align: center; }
    .form-container { max-width: 480px; margin: 0 auto; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; }
    
    footer { padding: 40px 0; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); }
    footer p { color: #4B5563; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <div class="logo">DROP STORE</div>
      <div class="live-badge">AO VIVO</div>
    </nav>
  </div>

  <section class="hero">
    <div class="container">
      <div class="hero-tag">⚡ Pré-Venda Aberta</div>
      <h1>O produto que vai<br><span>revolucionar seu dia</span></h1>
      <p class="hero-sub">Tecnologia de ponta design premium, preço de lançamento. Apenas 200 unidades disponíveis.</p>
      
      <div class="countdown-bar">
        <div class="cd-item"><div class="cd-num">02</div><div class="cd-label">Dias</div></div>
        <div class="cd-item"><div class="cd-num">18</div><div class="cd-label">Horas</div></div>
        <div class="cd-item"><div class="cd-num">45</div><div class="cd-label">Min</div></div>
        <div class="cd-item"><div class="cd-num">30</div><div class="cd-label">Seg</div></div>
      </div>

      <div class="urgency">
        <div class="urgency-item">🔥 127 pessoas vendo agora</div>
        <div class="urgency-item">⚠️ Restam 43 unidades</div>
      </div>

      <a href="#produtos" style="display:inline-flex;align-items:center;gap:8px;padding:16px 36px;border-radius:100px;background:linear-gradient(135deg,#EC4899,#F97316);color:#fff;font-weight:700;text-decoration:none;font-size:16px;">Ver Produtos →</a>
    </div>
  </section>

  <section class="products-section" id="produtos">
    <div class="container">
      <h2 class="section-title">Linha de Lançamento</h2>
      <div class="products-grid">
        <div class="product-card">
          <div class="product-image">
            📦
            <div class="product-badge">-40%</div>
          </div>
          <div class="product-info">
            <div class="product-name">Produto Starter</div>
            <div class="product-price">
              <span class="price-old">R$ 297</span>
              <span class="price-new">R$ 177</span>
            </div>
            <a href="#comprar" class="product-btn">Comprar Agora</a>
          </div>
        </div>
        <div class="product-card">
          <div class="product-image">
            🎁
            <div class="product-badge">MAIS VENDIDO</div>
          </div>
          <div class="product-info">
            <div class="product-name">Kit Completo</div>
            <div class="product-price">
              <span class="price-old">R$ 497</span>
              <span class="price-new">R$ 297</span>
            </div>
            <a href="#comprar" class="product-btn">Comprar Agora</a>
          </div>
        </div>
        <div class="product-card">
          <div class="product-image">
            👑
            <div class="product-badge">EDITION</div>
          </div>
          <div class="product-info">
            <div class="product-name">Edição Premium</div>
            <div class="product-price">
              <span class="price-old">R$ 797</span>
              <span class="price-new">R$ 497</span>
            </div>
            <a href="#comprar" class="product-btn">Comprar Agora</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="form-section">
    <div class="container">
      <h2 class="section-title">Garanta o Seu</h2>
      <div class="form-container">
        {{FORM_SLOT}}
      </div>
    </div>
  </section>

  <footer>
    <p>© 2025 Drop Store. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`,
        },
      },
    },
  });

  console.log(`  ✓ Template: ${ecommerceTemplate.name}`);

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