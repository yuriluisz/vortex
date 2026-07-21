"use client";

import { useState } from "react";
import { Code2, X, Check } from "lucide-react";

interface HtmlTemplateManagerProps {
  defaultValue?: string;
  error?: string;
}

const TEMPLATES = [
  {
    id: "dark-premium",
    name: "Dark Premium",
    description: "Tema escuro, focado em alta conversão e minimalismo.",
    code: `<div class="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
  <div class="max-w-md w-full bg-white/[0.03] border border-white/[0.08] p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Vagas Abertas</h1>
      <p class="text-neutral-400 text-sm">Inscreva-se abaixo para garantir sua vaga na nova turma.</p>
    </div>
    
    <!-- O FORMULÁRIO ENTRA AQUI -->
    {{FORM_SLOT}}
    
  </div>
</div>`,
  },
  {
    id: "light-clean",
    name: "Light Clean",
    description: "Tema claro, visual corporativo e direto ao ponto.",
    code: `<div class="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center p-4">
  <div class="max-w-md w-full bg-white border border-neutral-200 p-8 rounded-2xl shadow-xl">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2 text-neutral-800">Participe do Evento</h1>
      <p class="text-neutral-500 text-sm">Deixe seus dados para receber o link de acesso exclusivo.</p>
    </div>
    
    <!-- O FORMULÁRIO ENTRA AQUI -->
    {{FORM_SLOT}}
    
  </div>
</div>`,
  }
];

export function HtmlTemplateManager({ defaultValue, error }: HtmlTemplateManagerProps) {
  const [htmlCode, setHtmlCode] = useState(defaultValue || TEMPLATES[0].code);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectTemplate = (code: string) => {
    setHtmlCode(code);
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
        id="rawHtml"
        name="rawHtml"
        required
        rows={12}
        value={htmlCode}
        onChange={(e) => setHtmlCode(e.target.value)}
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
