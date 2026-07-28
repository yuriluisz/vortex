"use client";

import { useState } from "react";

interface ReportModalProps {
  campaignSlug: string;
  campaignName: string;
  tenantSlug: string;
  onClose: () => void;
}

/**
 * Modal de report de conteúdo.
 * Permite ao visitante denunciar uma campanha enviando um email para o suporte.
 */
export default function ReportModal({
  campaignSlug,
  campaignName,
  tenantSlug,
  onClose,
}: ReportModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterEmail: email.trim(),
          message: message.trim(),
          campaignSlug,
          campaignName,
          tenantSlug,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar report.");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  // Fechar ao clicar no overlay
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #262626",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "440px",
          width: "90%",
          color: "#e5e5e5",
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              Report enviado!
            </h2>
            <p style={{ color: "#a3a3a3", fontSize: "14px", marginTop: "8px" }}>
              Obrigado. Sua mensagem foi enviada para nossa equipe.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: "16px",
                background: "white",
                color: "#000",
                border: "none",
                borderRadius: "8px",
                padding: "8px 24px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "20px" }}>🚩</span>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                Reportar Conteúdo
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  htmlFor="report-email"
                  style={{ display: "block", fontSize: "13px", color: "#a3a3a3", marginBottom: "4px" }}
                >
                  Seu email
                </label>
                <input
                  id="report-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#1a1a1a",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="report-message"
                  style={{ display: "block", fontSize: "13px", color: "#a3a3a3", marginBottom: "4px" }}
                >
                  O que você encontrou?
                </label>
                <textarea
                  id="report-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva o problema..."
                  rows={4}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#1a1a1a",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {error && (
                <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "transparent",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    color: "#a3a3a3",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    background: sending ? "#525252" : "#ef4444",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    color: "white",
                    fontWeight: 600,
                    cursor: sending ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  {sending ? "Enviando..." : "Enviar Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}