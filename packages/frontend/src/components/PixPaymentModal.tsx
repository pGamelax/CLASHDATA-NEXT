"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";
import {
  Copy,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPixStatus, type PixPaymentData } from "@/lib/api";
import { formatBRL } from "@/lib/plans";

interface Props {
  pix: PixPaymentData;
  organizationId: string;
  onPaid: () => void;
  onClose?: () => void;
}

function useCountdown(expiresAt: string) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const formatted = h > 0
    ? `${h}h ${m.toString().padStart(2, "0")}m`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return { secondsLeft, formatted, expired: secondsLeft <= 0 };
}

export function PixPaymentModal({ pix, organizationId, onPaid, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const { formatted, expired } = useCountdown(pix.pixExpiresAt);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pix.pixCode) return;
    QRCodeLib.toDataURL(pix.pixCode, {
      type: "image/png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl).catch(() => {});
  }, [pix.pixCode]);

  // Polling automático a cada 5 segundos
  useEffect(() => {
    if (paid || expired) return;

    pollingRef.current = setInterval(async () => {
      try {
        const result = await getPixStatus(organizationId);
        if (!result.pix || result.pix.status === "PAID") {
          clearInterval(pollingRef.current!);
          setPaid(true);
          setTimeout(onPaid, 1500);
        }
      } catch {
        // ignora erros de polling
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [paid, expired, organizationId, onPaid]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pix.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback silencioso
    }
  }

  async function handleCheckNow() {
    setChecking(true);
    try {
      const result = await getPixStatus(organizationId);
      if (!result.pix || result.pix.status === "PAID") {
        setPaid(true);
        setTimeout(onPaid, 1500);
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-background border rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Pagar via PIX</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Pague via PIX para ativar sua organização.
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {paid ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                Pagamento confirmado!
              </p>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          ) : (
            <>
              {/* Amount + timer */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Valor</p>
                  <p className="text-2xl font-bold">{formatBRL(pix.amount)}</p>
                </div>
                {!expired ? (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono font-semibold">{formatted}</span>
                  </div>
                ) : (
                  <Badge variant="destructive">QR expirado</Badge>
                )}
              </div>

              {/* QR Code */}
              {qrDataUrl && !expired && (
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border shadow-sm">
                    <img
                      src={qrDataUrl}
                      alt="QR Code PIX"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Copia e cola */}
              {!expired && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Ou copie o código PIX:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg border bg-muted text-xs font-mono truncate text-muted-foreground">
                      {pix.pixCode.slice(0, 50)}...
                    </div>
                    <Button
                      size="sm"
                      variant={copied ? "default" : "outline"}
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <><CheckCircle2 className="h-4 w-4 mr-1" /> Copiado</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-1" /> Copiar</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Verificação manual */}
              {!expired && (
                <Button
                  onClick={handleCheckNow}
                  disabled={checking}
                  className="w-full"
                >
                  {checking ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verificando...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Já paguei — verificar</>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
