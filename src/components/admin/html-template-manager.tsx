"use client";

import { useState } from "react";
import { Code2, X, Check } from "lucide-react";

interface HtmlTemplateManagerProps {
  defaultValue?: string;
  error?: string;
  onChange?: (code: string) => void;
}

const TEMPLATES = [
  {
    id: "dark-premium",
    name: "Dark Evento Exclusivo",
    description: "Tema escuro Premium, imersivo e de alta conversão. Ideal para Masterclasses, Lançamentos e Eventos High-Ticket.",
    code: `<div class="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 selection:text-amber-200 overflow-hidden font-sans">
  <div class="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center min-h-screen">
    
    <!-- Lado Esquerdo: Copy e Detalhes -->
    <div class="space-y-8 relative z-10">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)]">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        Evento 100% Online e Gratuito
      </div>
      
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
        O Segredo dos <br />
        <span class="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
          Grandes Players
        </span>
      </h1>
      
      <p class="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-lg">
        Descubra o método validado que gerou múltiplos sete dígitos no último ano, sem depender de anúncios caros ou estruturas complexas. Tudo que você precisa é um celular e vontade de aprender.
      </p>
      
      <div class="flex flex-wrap gap-8 pt-6 border-t border-white/10">
        <div>
          <p class="text-xs text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Data</p>
          <p class="font-bold text-neutral-200 text-lg">15 de Novembro</p>
        </div>
        <div>
          <p class="text-xs text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Horário</p>
          <p class="font-bold text-neutral-200 text-lg">20h00 (Brasília)</p>
        </div>
        <div>
          <p class="text-xs text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Formato</p>
          <p class="font-bold text-neutral-200 text-lg">Ao Vivo no Zoom</p>
        </div>
      </div>
    </div>
    
    <!-- Lado Direito: Formulário -->
    <div class="relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
      <!-- Glow Effect -->
      <div class="absolute -inset-1 bg-gradient-to-br from-amber-500/30 to-purple-600/30 rounded-3xl blur-2xl z-0 pointer-events-none"></div>
      
      <div class="relative z-10 bg-neutral-900/80 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold mb-2">Garanta seu Convite</h3>
          <p class="text-sm text-neutral-400">Preencha os dados abaixo para receber o link de acesso exclusivo e materiais no seu WhatsApp.</p>
        </div>
        
        <!-- O FORMULÁRIO ENTRA AQUI -->
        {{FORM_SLOT}}
        
        <p class="text-[11px] text-center text-neutral-500 mt-6 flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Suas informações estão 100% seguras.
        </p>
      </div>
    </div>
    
  </div>
</div>`,
  },
  {
    id: "light-clean",
    name: "Light Clean Mentoria",
    description: "Tema claro, moderno e espaçoso. Focado em Autoridade e clareza, ideal para Workshops e Mentorias gratuitas.",
    code: `<div class="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-900">
  <!-- Decorative background shapes -->
  <div class="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
  
  <div class="max-w-5xl mx-auto px-6 py-16 md:py-24 relative z-10 flex flex-col items-center text-center">
    
    <span class="inline-block py-1.5 px-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-widest mb-8 shadow-sm ring-1 ring-emerald-500/20">
      Masterclass Online & Gratuita
    </span>
    
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
      A Arte da <span class="text-emerald-600 relative inline-block">Conversão<svg class="absolute w-full h-3 -bottom-1 left-0 text-emerald-200" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none"/></svg></span> Extrema
    </h1>
    
    <p class="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
      Descubra o passo a passo exato para escalar suas vendas usando automações simples, atraindo o cliente ideal sem precisar de uma grande equipe.
    </p>
    
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 text-left">
      <h3 class="text-xl font-extrabold text-slate-900 mb-2 text-center">Inscreva-se Gratuitamente</h3>
      <p class="text-sm text-slate-500 text-center mb-8">Vagas super limitadas para manter a qualidade da transmissão.</p>
      
      <!-- O FORMULÁRIO ENTRA AQUI -->
      {{FORM_SLOT}}
      
    </div>
    
    <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl w-full">
      <div class="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
        <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <h4 class="font-bold text-slate-900 mb-2 text-lg">Estratégia Rápida</h4>
        <p class="text-sm text-slate-600 leading-relaxed">Métodos validados que você pode aplicar no mesmo dia para ver resultados imediatos no faturamento.</p>
      </div>
      <div class="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
        <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
        </div>
        <h4 class="font-bold text-slate-900 mb-2 text-lg">Escala Real</h4>
        <p class="text-sm text-slate-600 leading-relaxed">Como lidar com centenas de leads diários de forma humana e sem perder a qualidade do atendimento.</p>
      </div>
      <div class="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
        <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <h4 class="font-bold text-slate-900 mb-2 text-lg">Automação 100%</h4>
        <p class="text-sm text-slate-600 leading-relaxed">Ferramentas e scripts que transformam o seu WhatsApp em uma máquina de conversão silenciosa.</p>
      </div>
    </div>
    
  </div>
</div>`,
  }
];

export function HtmlTemplateManager({ defaultValue, error, onChange }: HtmlTemplateManagerProps) {
  const [htmlCode, setHtmlCode] = useState(defaultValue || TEMPLATES[0].code);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectTemplate = (code: string) => {
    setHtmlCode(code);
    onChange?.(code);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <label htmlFor="rawHtml" className="block text-sm font-medium text-foreground/80">
            HTML da Página Customizada *
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Cole seu HTML. Use a tag <code className="text-primary bg-primary/10 px-1 py-0.5 rounded font-mono">{"{{"}FORM_SLOT{"}}"}</code> onde o formulário dinâmico deve ser injetado.
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          Ver Templates Prontos
        </button>
      </div>

      <textarea
        rows={12}
        value={htmlCode}
        onChange={(e) => {
          setHtmlCode(e.target.value);
          onChange?.(e.target.value);
        }}
        className="w-full font-mono text-xs leading-relaxed rounded-lg border border-input bg-muted px-4 py-4 text-foreground/80 outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 resize-y"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-card-foreground">Galeria de Templates</h3>
                <p className="text-sm text-muted-foreground mt-1">Escolha um layout estrutural pronto para iniciar.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-background/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TEMPLATES.map((tpl) => (
                  <div key={tpl.id} className="border border-border rounded-xl overflow-hidden bg-card flex flex-col">
                    <div className="p-4 border-b border-border bg-muted">
                      <h4 className="font-semibold text-card-foreground">{tpl.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                    </div>
                    <div className="flex-1 p-4 overflow-hidden relative group">
                      <pre className="text-[10px] text-muted-foreground font-mono overflow-hidden opacity-50 group-hover:opacity-30 transition-opacity">
                        {tpl.code.split('\n').slice(0, 10).join('\n')}...
                      </pre>
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => handleSelectTemplate(tpl.code)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-xl hover:bg-primary/90 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Usar Template
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
