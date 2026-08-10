"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Maximize2, Minimize2, Settings, Eye, Code, Loader2 } from "lucide-react";
import { TemplatePicker } from "@/components/templates/template-picker";
import { CampaignSettingsDrawer } from "./campaign-settings-drawer";

interface CampaignEditorProps {
  initialHtml: string;
  initialFormSchema: unknown;
  campaignId: string;
  tenantId: string;
  onSave: (html: string, formSchema: unknown) => Promise<void>;
}

const DEBOUNCE_MS = 400;
const PLACEHOLDER_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minha Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
    .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; color: #666; max-width: 600px; }
  </style>
</head>
<body>
  <div class="hero">
    <div>
      <h1>Sua Landing Page</h1>
      <p>Use esta página como ponto de partida. Edite o HTML ao lado para personalizar.</p>
      {{FORM_SLOT}}
    </div>
  </div>
</body>
</html>`;

export function CampaignEditor({
  initialHtml,
  initialFormSchema,
  campaignId,
  tenantId,
  onSave,
}: CampaignEditorProps) {
  const [html, setHtml] = useState(initialHtml || PLACEHOLDER_HTML);
  const [previewHtml, setPreviewHtml] = useState(initialHtml || PLACEHOLDER_HTML);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "split">("split");
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setActiveTab("code");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Atualizar preview com debounce
  const updatePreview = useCallback((newHtml: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(newHtml);
    }, DEBOUNCE_MS);
  }, []);

  // Handler do Monaco
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      setHtml(value);
      updatePreview(value);
    },
    [updatePreview]
  );

  // Atualizar iframe quando o HTML do preview mudar
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current;
      iframe.srcdoc = previewHtml;
    }
  }, [previewHtml]);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(html, {});
    } finally {
      setIsSaving(false);
    }
  }, [html, onSave]);

  const handleTemplateSelect = useCallback((templateHtml: string) => {
    setHtml(templateHtml);
    setPreviewHtml(templateHtml);
    setShowPicker(false);
  }, []);

  return (
    <div className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-[calc(100vh-8rem)]"}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          {isMobile && (
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 transition-colors ${
                  activeTab === "code" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Código
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 text-sm flex items-center gap-1 transition-colors ${
                  activeTab === "preview" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            Templates
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            Configurações
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border hover:bg-muted transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                Salvando
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor (Monaco) */}
        {(activeTab === "code" || activeTab === "split") && (
          <div className={`${activeTab === "split" ? "w-1/2" : "w-full"} border-r border-border/40 min-w-0`}>
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={html}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                suggestOnTriggerCharacters: false,
                quickSuggestions: false,
                folding: true,
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-muted/50">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              }
            />
          </div>
        )}

        {/* Preview */}
        {(activeTab === "preview" || activeTab === "split") && (
          <div className={`${activeTab === "split" ? "w-1/2" : "w-full"} bg-white min-w-0`}>
            <iframe
              ref={iframeRef}
              title="Preview"
              className="w-full h-full"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>

      {/* Template Picker Modal */}
      {showPicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Settings Drawer */}
      <CampaignSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        campaignId={campaignId}
        tenantId={tenantId}
      />
    </div>
  );
}