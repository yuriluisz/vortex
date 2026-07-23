"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export type FormField = {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
};

interface CampaignFormBuilderProps {
  defaultValue?: string;
  error?: string;
  onChange?: (schema: string) => void;
}

export function CampaignFormBuilder({ defaultValue, error, onChange }: CampaignFormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(() => {
    try {
      if (defaultValue) return JSON.parse(defaultValue);
      return [
        {
          id: "name",
          type: "text",
          label: "Nome Completo",
          placeholder: "Seu nome",
          required: true,
        },
        {
          id: "whatsapp",
          type: "tel",
          label: "WhatsApp",
          placeholder: "(11) 99999-9999",
          required: true,
        },
      ];
    } catch {
      return [];
    }
  });

  const notifyChange = (newFields: FormField[]) => {
    onChange?.(JSON.stringify(newFields));
  };

  const addField = () => {
    const newFields = [
      ...fields,
      {
        id: `field_${Date.now()}`,
        type: "text",
        label: "Nova Pergunta",
        placeholder: "Ex: Digite sua resposta",
        required: false,
      },
    ];
    setFields(newFields);
    notifyChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    notifyChange(newFields);
  };

  const updateField = (index: number, key: keyof FormField, value: string | boolean) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
    notifyChange(newFields);
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    setFields(newFields);
    notifyChange(newFields);
  };

  const moveFieldDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
    setFields(newFields);
    notifyChange(newFields);
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass the JSON back to the native form action */}
      <input type="hidden" name="formSchema" value={JSON.stringify(fields)} />

      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-muted/50 relative group transition-colors focus-within:border-ring"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveFieldUp(index)}
                    disabled={index === 0}
                    className="p-1 hover:text-foreground hover:bg-muted rounded disabled:opacity-30 transition-colors"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFieldDown(index)}
                    disabled={index === fields.length - 1}
                    className="p-1 hover:text-foreground hover:bg-muted rounded disabled:opacity-30 transition-colors"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-2">
                  Campo {index + 1}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                title="Remover campo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">ID Único (Nome da Variável)</label>
                <input
                  type="text"
                  value={field.id}
                  onChange={(e) => updateField(index, "id", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  className="w-full bg-transparent border-b border-border focus:border-ring text-sm text-foreground py-1 outline-none transition-colors font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Rótulo (Aparece pro usuário)</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-ring text-sm text-foreground py-1 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Placeholder (Dica no campo)</label>
                <input
                  type="text"
                  value={field.placeholder}
                  onChange={(e) => updateField(index, "placeholder", e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-ring text-sm text-foreground py-1 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-xs text-muted-foreground">Tipo do Campo</label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, "type", e.target.value)}
                    className="w-full bg-card border-b border-border focus:border-ring text-sm text-foreground py-1 outline-none transition-colors"
                  >
                    <option value="text">Texto Curto</option>
                    <option value="email">E-mail</option>
                    <option value="number">Número</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, "required", e.target.checked)}
                    id={`req_${index}`}
                    className="accent-primary w-4 h-4 rounded"
                  />
                  <label htmlFor={`req_${index}`} className="text-xs text-foreground/80 cursor-pointer select-none">
                    Obrigatório
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-2">Adicionar campos rápidos:</span>
        {!fields.some(f => f.id === "email") && (
          <button
            type="button"
            onClick={() => {
              const newFields = [...fields, { id: "email", type: "email", label: "E-mail", placeholder: "seu@email.com", required: true }];
              setFields(newFields);
              notifyChange(newFields);
            }}
            className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> E-mail
          </button>
        )}
        {!fields.some(f => f.id === "whatsapp") && (
          <button
            type="button"
            onClick={() => {
              const newFields = [...fields, { id: "whatsapp", type: "text", label: "WhatsApp", placeholder: "(11) 99999-9999", required: true }];
              setFields(newFields);
              notifyChange(newFields);
            }}
            className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> WhatsApp
          </button>
        )}
        {!fields.some(f => f.id === "endereco") && (
          <button
            type="button"
            onClick={() => {
              const newFields = [...fields, { id: "endereco", type: "text", label: "Endereço Completo", placeholder: "Rua, Número, Bairro", required: false }];
              setFields(newFields);
              notifyChange(newFields);
            }}
            className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> Endereço
          </button>
        )}
        {!fields.some(f => f.id === "idade") && (
          <button
            type="button"
            onClick={() => {
              const newFields = [...fields, { id: "idade", type: "number", label: "Idade", placeholder: "Ex: 25", required: false }];
              setFields(newFields);
              notifyChange(newFields);
            }}
            className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> Idade
          </button>
        )}
        
        {fields.some(f => f.id === "email") && 
         fields.some(f => f.id === "whatsapp") && 
         fields.some(f => f.id === "endereco") && 
         fields.some(f => f.id === "idade") && (
          <span className="text-xs text-muted-foreground italic">Todos os campos rápidos já adicionados.</span>
        )}
      </div>

      <button
        type="button"
        onClick={addField}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-ring transition-all"
      >
        <Plus className="w-4 h-4" />
        Adicionar campo personalizado
      </button>

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
