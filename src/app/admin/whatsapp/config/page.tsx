"use client";

import { useState, useEffect, useCallback, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RefreshCw,
  Unplug,
  Wifi,
} from "lucide-react";
import {
  setupWhatsAppAction,
  refreshQRCodeAction,
  checkConnectionAction,
  disconnectWhatsAppAction,
} from "../actions";
import type { WhatsAppConfigState } from "../actions";

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({
  currentStep,
}: {
  currentStep: "phone" | "qrcode" | "connected";
}) {
  const steps = [
    { id: "phone", label: "Número", icon: Smartphone },
    { id: "qrcode", label: "QR Code", icon: QrCode },
    { id: "connected", label: "Conectado", icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : isComplete
                    ? "bg-chart-1/10 text-chart-1"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <step.icon className="h-4 w-4" />
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-px w-8 transition-colors duration-300 ${
                  isComplete ? "bg-chart-1" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// STEP 1: PHONE NUMBER
// ============================================================================

function PhoneStep({
  state,
  formAction,
  pending,
}: {
  state: WhatsAppConfigState;
  formAction: (payload: FormData) => void;
  pending: boolean;
}) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Smartphone className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Conecte seu WhatsApp
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Insira o número de telefone do WhatsApp que será utilizado para
          gerenciar seus grupos e disparar mensagens.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-foreground/80"
          >
            Número de WhatsApp
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            required
            placeholder="5511999999999"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all font-mono text-lg tracking-wider"
          />
          <p className="text-xs text-muted-foreground">
            Formato: código do país + DDD + número (ex: 5511999999999)
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Gerar QR Code
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// STEP 2: QR CODE
// ============================================================================

function QRCodeStep({
  qrCode,
  pairingCode,
  onRefresh,
  onConnected,
  onBack,
}: {
  qrCode?: string;
  pairingCode?: string;
  onRefresh: () => void;
  onConnected: () => void;
  onBack: () => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentQR, setCurrentQR] = useState(qrCode);
  const [currentPairingCode, setCurrentPairingCode] = useState(pairingCode);
  const [copied, setCopied] = useState(false);

  // Polling para verificar conexão a cada 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await checkConnectionAction();
        if (result.connected) {
          clearInterval(interval);
          onConnected();
        }
      } catch {
        // Silently fail
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [onConnected]);

  // Auto-refresh QR Code a cada 45s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await refreshQRCodeAction();
        if (result.connected) {
          onConnected();
          return;
        }
        if (result.qrCode) {
          setCurrentQR(result.qrCode);
        }
        if (result.pairingCode) {
          setCurrentPairingCode(result.pairingCode);
        }
      } catch {
        // Silently fail
      }
    }, 45_000);

    return () => clearInterval(interval);
  }, [onConnected]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshQRCodeAction();
      if (result.connected) {
        onConnected();
        return;
      }
      if (result.qrCode) {
        setCurrentQR(result.qrCode);
      }
      if (result.pairingCode) {
        setCurrentPairingCode(result.pairingCode);
      }
    } catch {
      // Silently fail
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyPairingCode = () => {
    if (!currentPairingCode) return;
    navigator.clipboard.writeText(currentPairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <QrCode className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">
        Conecte seu Aparelho
      </h2>
      <p className="mt-2 text-sm text-muted-foreground mb-8">
        Você receberá uma notificação no WhatsApp para inserir o código abaixo, ou pode escanear o QR Code em <strong>Dispositivos conectados</strong>.
      </p>

      {/* Pairing Code (Se disponível) */}
      {currentPairingCode && (
        <div className="mb-8">
          <p className="text-sm font-medium text-foreground mb-2">
            Código de Confirmação (Token):
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-4">
              <span className="text-3xl font-mono font-bold tracking-[0.2em] text-primary">
                {currentPairingCode}
              </span>
            </div>
            <button
              type="button"
              onClick={copyPairingCode}
              className="p-3 rounded-xl border border-border bg-secondary hover:bg-accent transition-colors"
              title="Copiar Código"
            >
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-chart-1" />
              ) : (
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            O WhatsApp solicitará este código. Digite-o para autorizar a conexão.
          </p>
        </div>
      )}

      {/* Separador Visual */}
      {currentPairingCode && currentQR && (
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou escaneie o qr code</span>
          </div>
        </div>
      )}

      {/* QR Code Container */}
      <div className="relative inline-block rounded-2xl border-2 border-border bg-white p-6 shadow-lg mb-6">
        {currentQR ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentQR.startsWith("data:") ? currentQR : `data:image/png;base64,${currentQR}`}
            alt="QR Code WhatsApp"
            className="h-64 w-64"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Overlay de loading */}
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
        <div className="h-2 w-2 rounded-full bg-chart-2 animate-pulse" />
        Aguardando conexão...
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-secondary/50 px-4 py-2.5 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-secondary disabled:opacity-50"
        >
          Número Incorreto?
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary border border-primary/20 transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Gerar novo código
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3: CONNECTED
// ============================================================================

function ConnectedStep({
  phoneNumber,
  onDisconnect,
}: {
  phoneNumber?: string;
  onDisconnect: () => void;
}) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectWhatsAppAction();
      onDisconnect();
    } catch {
      // Error handled
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 mb-4">
        <Wifi className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">
        WhatsApp Conectado!
      </h2>
      <p className="mt-2 text-sm text-muted-foreground mb-2">
        Seu WhatsApp está conectado e pronto para uso.
      </p>
      {phoneNumber && (
        <p className="text-sm font-mono text-primary mb-8">
          {phoneNumber}
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/whatsapp/broadcast")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
        >
          <ArrowRight className="h-4 w-4" />
          Ir para Disparos
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-destructive border border-border transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {isDisconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Unplug className="h-4 w-4" />
          )}
          Desconectar
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function WhatsAppConfigPage() {
  const [currentStep, setCurrentStep] = useState<
    "phone" | "qrcode" | "connected"
  >("phone");
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [pairingCode, setPairingCode] = useState<string | undefined>();
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>();

  // Verificar status inicial
  useEffect(() => {
    async function checkInitialStatus() {
      try {
        const result = await checkConnectionAction();
        if (result.connected) {
          setCurrentStep("connected");
        } else if (result.status === "CONNECTING") {
          // Já tem instância, ir direto pro QR
          const qr = await refreshQRCodeAction();
          if (qr.connected) {
            setCurrentStep("connected");
          } else {
            if (qr.qrCode) setQrCode(qr.qrCode);
            if (qr.pairingCode) setPairingCode(qr.pairingCode);
            setCurrentStep("qrcode");
          }
        }
      } catch {
        // Sem instância, ficar no step 1
      }
    }

    checkInitialStatus();
  }, []);

  const [state, formAction, pending] = useActionState<
    WhatsAppConfigState,
    FormData
  >(setupWhatsAppAction, undefined);

  // Reagir ao resultado do setupWhatsAppAction
  useEffect(() => {
    if (state?.step === "qrcode") {
      if (state.qrCode) setQrCode(state.qrCode);
      if (state.pairingCode) setPairingCode(state.pairingCode);
      setCurrentStep("qrcode");
    }
  }, [state]);

  const handleConnected = useCallback(async () => {
    // Buscar phoneNumber do banco
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.phoneNumber) {
        setPhoneNumber(data.phoneNumber);
      }
    } catch {
      // Silently fail
    }
    setCurrentStep("connected");
  }, []);

  const handleDisconnect = () => {
    setCurrentStep("phone");
    setQrCode(undefined);
    setPairingCode(undefined);
    setPhoneNumber(undefined);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        {currentStep === "phone" && (
          <PhoneStep
            state={state}
            formAction={formAction}
            pending={pending}
          />
        )}

        {currentStep === "qrcode" && (
          <QRCodeStep
            qrCode={qrCode}
            pairingCode={pairingCode}
            onRefresh={() => {}}
            onConnected={handleConnected}
            onBack={handleDisconnect}
          />
        )}

        {currentStep === "connected" && (
          <ConnectedStep
            phoneNumber={phoneNumber}
            onDisconnect={handleDisconnect}
          />
        )}
      </div>
    </div>
  );
}
