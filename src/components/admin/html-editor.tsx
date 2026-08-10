"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Eye, Code, Loader2 } from "lucide-react";

interface HtmlEditorProps {
  defaultValue: string;
  error?: string;
  onChange?: (code: string) => void;
}

const PLACEHOLDER = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minha Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; }
    .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.25rem; color: #666; }
  </style>
</head>
<body>
  <div class="hero">
    <div>
      <h1>Sua Landing Page</h1>
      <p>Use como base e personalize.</p>
      {{FORM_SLOT}}
    </div>
  </div>
</body>
</html>`;

export function HtmlEditor({ defaultValue, error, onChange }: HtmlEditorProps) {
  const [html, setHtml] = useState(defaultValue || PLACEHOLDER);
  const [previewHtml, setPreviewHtml] = useState(defaultValue || PLACEHOLDER);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "split">("split");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setActiveTab("code");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updatePreview = useCallback((newHtml: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(newHtml);
    }, 400);
  }, []);

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      iframeRef.current.srcdoc = previewHtml;
    }
  }, [previewHtml]);

  const handleChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    setHtml(value);
    updatePreview(value);
    onChange?.(value);
  }, [onChange, updatePreview]);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editor.focus();
  }, []);

  return (
    <div className="space-y-2">
      <input type="hidden" name="rawHtml" value={html} />
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground/80">
          HTML da Página *
        </label>
        {/* View toggle */}
        {!isMobile && (
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("split")}
              className={`px-2.5 py-1 text-xs transition-colors ${
                activeTab === "split" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-2.5 py-1 text-xs transition-colors ${
                activeTab === "code" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Code className="w-3 h-3 inline" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-2.5 py-1 text-xs transition-colors ${
                activeTab === "preview" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Eye className="w-3 h-3 inline" />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden" style={{ height: "500px" }}>
        <div className="flex h-full">
          {/* Code Editor */}
          {(activeTab === "code" || activeTab === "split") && (
            <div className={`${activeTab === "split" ? "w-1/2" : "w-full"} border-r border-border min-w-0`}>
              <Editor
                height="100%"
                defaultLanguage="html"
                theme="vs-dark"
                value={html}
                onChange={handleChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  wordWrap: "on",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: true,
                  folding: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-muted/50">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}