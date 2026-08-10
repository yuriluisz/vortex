"use client";

import { useState } from "react";
import { X, Globe, Lock, Eye, EyeOff, Smartphone, Loader2 } from "lucide-react";

interface CampaignSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  tenantId: string;
}

export function CampaignSettingsDrawer({
  open,
  onOpenChange,
  campaignId,
  tenantId,
}: CampaignSettingsDrawerProps) {
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">Configurações da Campanha</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Status */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Status
            </h3>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Campanha Ativa</div>
                  <div className="text-xs text-gray-500">Visível para visitantes</div>
                </div>
              </div>
              <div className="w-10 h-6 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </label>
          </section>

          {/* Slug */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Slug da Campanha
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500">vortex.com.br/</span>
              <input
                type="text"
                defaultValue="minha-campanha"
                className="flex-1 text-sm font-medium bg-transparent border-none outline-none p-0"
              />
            </div>
          </section>

          {/* Domínio Customizado */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Domínio Customizado
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Seu plano não permite domínio customizado"
                disabled
                className="flex-1 text-sm bg-transparent border-none outline-none p-0 text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Disponível apenas no plano ULTRA
            </p>
          </section>

          {/* Proteção */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Proteção
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Proteger com Código</div>
                    <div className="text-xs text-gray-500">Apenas quem tem o código acessa</div>
                  </div>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </label>

              <input
                type="text"
                placeholder="Código de acesso"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </section>

          {/* Pixel */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Meta Pixel ID
            </h3>
            <input
              type="text"
              placeholder="Ex: 1234567890"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </section>

          {/* Grupos */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Configurações de Grupo
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Capacidade Máxima</label>
                <input
                  type="number"
                  defaultValue={1000}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefones de Suporte</label>
                <input
                  type="text"
                  placeholder="5511999999999, 5511888888888"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Ações */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setSaving(true)}
              disabled={saving}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando
                </span>
              ) : (
                "Salvar Configurações"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}