"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  UploadCloud,
  ImageIcon,
  Search,
  Copy,
  Check,
  Link as LinkIcon,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileImage,
} from "lucide-react";
import {
  uploadTenantAssetAction,
  listTenantAssetsAction,
  deleteTenantAssetAction,
  type TenantAssetDTO,
} from "@/app/admin/assets/actions";

// ============================================================================
// Types & Helpers
// ============================================================================

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset?: (filename: string, url: string) => void;
  onAssetsUpdated?: (assets: TenantAssetDTO[]) => void;
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFormatBadge(mimeType: string, filename: string): string {
  if (mimeType.includes("png")) return "PNG";
  if (mimeType.includes("webp")) return "WEBP";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "JPG";
  if (mimeType.includes("svg")) return "SVG";
  if (mimeType.includes("icon") || mimeType.includes("ico")) return "ICO";
  const ext = filename.split(".").pop();
  return ext ? ext.toUpperCase() : "IMG";
}

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================================================
// Component
// ============================================================================

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectAsset,
  onAssetsUpdated,
}: MediaLibraryModalProps) {
  // State
  const [assets, setAssets] = useState<TenantAssetDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Toast Notification Dispatcher
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Fetch Assets (User-triggered or refresh)
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listTenantAssetsAction();
      if (result.success && result.assets) {
        setAssets(result.assets);
        onAssetsUpdated?.(result.assets);
      } else {
        showToast(result.error || "Erro ao carregar mídias.", "error");
      }
    } catch {
      showToast("Falha na comunicação ao buscar mídias.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [onAssetsUpdated, showToast]);

  // Initial load when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    listTenantAssetsAction()
      .then((result) => {
        if (!ignore) {
          if (result.success && result.assets) {
            setAssets(result.assets);
            onAssetsUpdated?.(result.assets);
          } else if (result.error) {
            showToast(result.error, "error");
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          showToast("Falha na comunicação ao buscar mídias.", "error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, onAssetsUpdated, showToast]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle File Upload Process
  const handleUploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.from(files);
      if (fileList.length === 0) return;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          showToast(`Formato não suportado para "${file.name}". Use PNG, JPG, WEBP, SVG ou ICO.`, "error");
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          showToast(`"${file.name}" excede o tamanho máximo permitido de 5MB.`, "error");
          continue;
        }

        setUploadProgress(`Enviando ${file.name} (${i + 1}/${fileList.length})...`);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const result = await uploadTenantAssetAction(formData);

          if (result.success && result.asset) {
            showToast(`"${result.asset.filename}" enviado com sucesso!`, "success");
            // Atualiza lista local
            setAssets((prev) => {
              const filtered = prev.filter((a) => a.id !== result.asset!.id && a.filename !== result.asset!.filename);
              const next = [result.asset!, ...filtered];
              onAssetsUpdated?.(next);
              return next;
            });
          } else {
            showToast(result.error || `Erro ao enviar ${file.name}.`, "error");
          }
        } catch (err) {
          showToast(err instanceof Error ? err.message : `Erro no upload de ${file.name}`, "error");
        }
      }

      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onAssetsUpdated, showToast]
  );

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Delete Asset
  const handleDelete = async (asset: TenantAssetDTO) => {
    setDeletingId(asset.id);
    try {
      const result = await deleteTenantAssetAction(asset.id);
      if (result.success) {
        showToast(`"${asset.filename}" excluído com sucesso.`, "success");
        setAssets((prev) => {
          const next = prev.filter((a) => a.id !== asset.id);
          onAssetsUpdated?.(next);
          return next;
        });
      } else {
        showToast(result.error || "Erro ao excluir arquivo.", "error");
      }
    } catch {
      showToast("Erro inesperado ao excluir arquivo.", "error");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`${label} copiado!`, "success");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedKey(key);
      showToast(`${label} copiado!`, "success");
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Filtered assets by search
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase().trim();
    return assets.filter((asset) => asset.filename.toLowerCase().includes(query));
  }, [assets, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploadProgress) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-library-title"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl shadow-purple-950/20 overflow-hidden animate-in zoom-in-95 duration-200"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag Overlay visual feedback */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md border-2 border-dashed border-primary text-primary transition-all">
            <UploadCloud className="w-16 h-16 animate-bounce text-primary mb-3" />
            <h4 className="text-xl font-bold text-foreground">Solte as imagens aqui</h4>
            <p className="text-sm text-muted-foreground mt-1">Upload automático para a nuvem Cloudflare R2</p>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* MODAL HEADER                                                      */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-inner">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 id="media-library-title" className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                Biblioteca de Mídias
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Cloudflare R2
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Hospedagem nativa com CDN global. Referencie apenas o nome do arquivo no HTML.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAssets}
              disabled={isLoading}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Recarregar mídias"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* DRAG AND DROP UPLOAD ZONE                                         */}
        {/* ----------------------------------------------------------------- */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.01]">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.webp,.svg,.ico"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUploadFiles(e.target.files);
              }
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                {uploadProgress ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {uploadProgress || "Clique para fazer upload ou arraste imagens aqui"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Suporta PNG, JPEG, WEBP, SVG e ICO até 5MB. Imagens transparentes preservadas.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-foreground text-xs font-semibold border border-white/10 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary shrink-0 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Selecionar Imagens</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SEARCH & FILTERS BAR                                              */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-zinc-950/80 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do arquivo..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-medium shrink-0">
            {filteredAssets.length}{" "}
            {filteredAssets.length === 1 ? "mídia" : "mídias"}{" "}
            {searchQuery && `(de ${assets.length})`}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ASSET GRID AREA                                                   */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[280px]">
          {isLoading && assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Carregando mídias do Cloudflare R2...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground mb-3">
                <FileImage className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                {searchQuery ? "Nenhuma imagem encontrada" : "Sua biblioteca está vazia"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                {searchQuery
                  ? `Não encontramos nenhum arquivo correspondente a "${searchQuery}". Tente outro termo.`
                  : "Faça upload de logos, banners, ícones e mockups para usar diretamente em qualquer campanha."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredAssets.map((asset) => {
                const isCopiedName = copiedKey === `name-${asset.id}`;
                const isCopiedUrl = copiedKey === `url-${asset.id}`;
                const isDeleting = deletingId === asset.id;
                const isConfirmingDelete = confirmDeleteId === asset.id;

                return (
                  <div
                    key={asset.id}
                    className="group relative flex flex-col rounded-xl border border-white/10 bg-zinc-900/90 overflow-hidden hover:border-primary/50 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-primary/5"
                  >
                    {/* Thumbnail container with checkered background for transparencies */}
                    <div className="relative aspect-square w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
                      {/* Checkered pattern background */}
                      <div
                        className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{
                          backgroundImage: `
                            linear-gradient(45deg, #1e1e24 25%, transparent 25%),
                            linear-gradient(-45deg, #1e1e24 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #1e1e24 75%),
                            linear-gradient(-45deg, transparent 75%, #1e1e24 75%)
                          `,
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }}
                      />

                      {/* Image Preview */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        loading="lazy"
                        className="relative z-10 w-full h-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Format Badge (Top Left) */}
                      <div className="absolute top-2 left-2 z-20">
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-white shadow-sm">
                          {getFormatBadge(asset.mimeType, asset.filename)}
                        </span>
                      </div>

                      {/* Size Badge (Top Right) */}
                      <div className="absolute top-2 right-2 z-20">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-neutral-300 shadow-sm">
                          {formatBytes(asset.size)}
                        </span>
                      </div>

                      {/* Hover Overlay with Quick Actions */}
                      <div className="absolute inset-0 z-30 flex flex-col justify-end p-2.5 bg-black/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="space-y-1.5">
                          {/* Botão Copiar Nome */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(asset.filename, `name-${asset.id}`, "Nome do arquivo");
                              onSelectAsset?.(asset.filename, asset.url);
                            }}
                            className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                              isCopiedName
                                ? "bg-emerald-500 text-white"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                            title="Copiar nome para usar em <img src='...'>"
                          >
                            {isCopiedName ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopiedName ? "Copiado!" : "Copiar Nome"}</span>
                          </button>

                          {/* Botão Copiar URL Completa */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(asset.url, `url-${asset.id}`, "URL pública");
                            }}
                            className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                              isCopiedUrl
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
                            }`}
                            title="Copiar URL pública direta do R2"
                          >
                            {isCopiedUrl ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                            <span>{isCopiedUrl ? "URL Copiada" : "Copiar URL"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: File details and Delete action */}
                    <div className="p-2.5 border-t border-white/10 bg-zinc-950/70 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs font-medium text-foreground truncate"
                          title={asset.filename}
                        >
                          {asset.filename}
                        </p>
                      </div>

                      {/* Excluir com confirmação inline */}
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDelete(asset)}
                            disabled={isDeleting}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                            title="Confirmar exclusão"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sim"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded text-muted-foreground hover:text-white"
                            title="Cancelar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(asset.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          title="Excluir do R2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* MODAL FOOTER                                                      */}
        {/* ----------------------------------------------------------------- */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Resolução automática ativa: use <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-[11px]">&lt;img src=&quot;nome-do-arquivo.png&quot;&gt;</code></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-foreground text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLOATING TOASTS                                                   */}
      {/* ----------------------------------------------------------------- */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl border pointer-events-auto animate-in slide-in-from-bottom-2 duration-200 ${
                toast.type === "success"
                  ? "bg-zinc-900/95 text-emerald-400 border-emerald-500/30 shadow-emerald-950/20"
                  : toast.type === "error"
                  ? "bg-zinc-900/95 text-destructive border-destructive/30 shadow-destructive/20"
                  : "bg-zinc-900/95 text-foreground border-white/15"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className="flex-1">{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
