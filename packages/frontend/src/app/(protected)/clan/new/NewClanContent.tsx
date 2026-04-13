"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, Check, AlertCircle,
  Search, Shield, Users, Sparkles, QrCode, Copy,
  CheckCircle2, Clock, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatBRL, type Period } from "@/lib/plans";
import { getPlanIcon, getPlanColors } from "@/lib/plan-presets";
import { cn } from "@/lib/utils";
import QRCodeLib from "qrcode";
import {
  fetchClanData,
  checkTrialStatus,
  createClanWithTrial,
  getPendingClanStatus,
  getPlans,
  type PixPaymentData,
  type PlanConfig,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface ClanPreview {
  tag: string;
  name: string;
  badgeUrls?: { small?: string; medium?: string; large?: string } | null;
  clanLevel?: number;
  members?: number;
  description?: string;
}

interface Props {
  planKey: string;
  period: Period;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERIOD_LABEL: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

const PERIOD_UNIT: Record<string, string> = {
  monthly: "mês",
  quarterly: "trimestre",
  yearly: "ano",
};

const PERIOD_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

function getPlanPrice(plan: PlanConfig, period: string) {
  if (period === "quarterly") return { amount: plan.quarterlyPrice, original: plan.originalQuarterlyPrice };
  if (period === "yearly")    return { amount: plan.yearlyPrice,    original: plan.originalYearlyPrice };
  return                             { amount: plan.monthlyPrice,   original: null };
}

// ─── PixStep (step 3 separado para hooks inicializarem com dados reais) ───────

function PixStep({ pix, onPaid }: { pix: PixPaymentData; onPaid: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(pix.pixExpiresAt).getTime() - Date.now()) / 1000))
  );
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPaidRef = useRef(onPaid);
  useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);

  const expired = secondsLeft <= 0;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const countdown = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  // Countdown
  useEffect(() => {
    if (expired) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = Math.max(0, Math.floor((new Date(pix.pixExpiresAt).getTime() - Date.now()) / 1000));
        if (next <= 0) clearInterval(t);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // QR code
  useEffect(() => {
    if (!pix.pixCode) return;
    QRCodeLib.toDataURL(pix.pixCode, { type: "image/png", width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [pix.pixCode]);

  // Polling automático a cada 5s
  useEffect(() => {
    if (paid) return;

    async function tick() {
      try {
        const result = await getPendingClanStatus();
        if (!result.pending || result.pending.status === "PAID") {
          clearInterval(pollingRef.current!);
          setPaid(true);
          setTimeout(() => onPaidRef.current(), 1500);
        }
      } catch {
        // ignora erro de rede, tenta novamente no próximo tick
      }
    }

    // Primeira verificação imediata ao montar
    tick();
    pollingRef.current = setInterval(tick, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pix.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="p-5 rounded-full bg-green-500/10">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
        </div>
        <div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">Pagamento confirmado!</p>
          <p className="text-sm text-muted-foreground mt-1">Redirecionando para o clan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Amount + countdown */}
      <div className="rounded-xl border bg-card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Valor</p>
          <p className="text-2xl font-bold">{formatBRL(pix.amount)}</p>
        </div>
        {!expired ? (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-semibold">{countdown}</span>
          </div>
        ) : (
          <Badge variant="destructive">QR expirado</Badge>
        )}
      </div>

      {/* QR Code */}
      {qrDataUrl && !expired && (
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl border shadow-sm">
            <img src={qrDataUrl} alt="QR Code PIX" className="w-52 h-52 object-contain" />
          </div>
        </div>
      )}

      {/* Copy */}
      {!expired && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Código PIX (copia e cola):</p>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg border bg-muted text-xs font-mono truncate text-muted-foreground">
              {pix.pixCode.slice(0, 60)}...
            </div>
            <Button size="sm" variant={copied ? "default" : "outline"} onClick={handleCopy} className="shrink-0">
              {copied ? <><CheckCircle2 className="h-4 w-4 mr-1" />Copiado</> : <><Copy className="h-4 w-4 mr-1" />Copiar</>}
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        A confirmação é automática — você será redirecionado assim que o pagamento for identificado.
      </p>
    </div>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Clan" },
    { n: 2, label: "Checkout" },
    { n: 3, label: "Pagamento" },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-all",
            current === s.n
              ? "bg-primary border-primary text-primary-foreground"
              : current > s.n
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-muted border-border text-muted-foreground"
          )}>
            {current > s.n ? <Check className="h-4 w-4" /> : s.n}
          </div>
          <span className={cn(
            "ml-2 text-sm font-medium hidden sm:block",
            current === s.n ? "text-foreground" : "text-muted-foreground"
          )}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={cn(
              "w-8 sm:w-12 h-0.5 mx-2",
              current > s.n ? "bg-primary/40" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NewClanContent({ planKey, period }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Plan data
  const [planData, setPlanData] = useState<PlanConfig | null>(null);

  // Step 1
  const [tagInput, setTagInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [clanPreview, setClanPreview] = useState<ClanPreview | null>(null);

  // Step 2
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean | null>(null);
  const [loadingStep2, setLoadingStep2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 3
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const submittedTagRef = useRef<string>("");

  // Load plan
  useEffect(() => {
    getPlans().then((plans) => {
      setPlanData(plans.find((p) => p.key === planKey) ?? null);
    });
  }, [planKey]);

  function handlePixPaid() {
    const tagSlug = submittedTagRef.current.replace("#", "").toLowerCase();
    router.push(`/clan/${tagSlug}`);
  }

  // ── Step 1: search clan ────────────────────────────────────────────────────

  async function handleSearch() {
    const tag = tagInput.trim();
    if (!tag) return;
    setSearching(true);
    setSearchError(null);
    setClanPreview(null);
    try {
      const data = await fetchClanData(tag, undefined, false);
      if (!data?.name) throw new Error("Clan não encontrado");
      setClanPreview({
        tag: data.tag ?? (tag.startsWith("#") ? tag : `#${tag.toUpperCase()}`),
        name: data.name,
        badgeUrls: data.badgeUrls,
        clanLevel: data.clanLevel,
        members: data.members,
        description: data.description,
      });
    } catch {
      setSearchError("Clan não encontrado. Verifique a tag e tente novamente.");
    } finally {
      setSearching(false);
    }
  }

  async function handleConfirmClan() {
    if (!clanPreview) return;
    submittedTagRef.current = clanPreview.tag;
    setLoadingStep2(true);
    try {
      const trial = await checkTrialStatus();
      setHasUsedTrial(trial.hasUsedTrial);
      setStep(2);
    } finally {
      setLoadingStep2(false);
    }
  }

  // ── Step 2: submit ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!clanPreview) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createClanWithTrial({
        clanTag: clanPreview.tag,
        plan: planKey,
        period,
      });
      if (result.requiresPayment && result.pix) {
        setPixData(result.pix);
        setStep(3);
      } else {
        const tagSlug = (result.clan?.tag ?? clanPreview.tag).replace("#", "").toLowerCase();
        router.push(`/clan/${tagSlug}`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const price = planData ? getPlanPrice(planData, period) : null;
  const monthlyEquiv = price ? price.amount / PERIOD_MONTHS[period] : 0;
  const Icon = planData ? getPlanIcon(planData.icon) : null;
  const colors = planData ? getPlanColors(planData.color) : null;
  const isTrial = hasUsedTrial === false;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className={cn(
        "mx-auto px-4 py-10",
        step === 2 ? "max-w-4xl" : "max-w-lg",
        "container"
      )}>

        {/* Back link */}
        {step < 3 && (
          <div className="mb-6">
            {step === 1 ? (
              <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar para Planos
              </Link>
            ) : (
              <button
                onClick={() => { setStep((s) => (s - 1) as Step); setSubmitError(null); }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
            )}
          </div>
        )}

        <StepIndicator current={step} />

        {/* ── STEP 1: Clan Tag ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Qual é o seu clan?</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Informe a tag do seu clan no Clash of Clans para continuar.
              </p>
            </div>

            {/* Search input */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="#ABC123"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={searching}
                  className="h-11 font-mono text-base flex-1"
                  autoFocus
                />
                <Button onClick={handleSearch} disabled={searching || !tagInput.trim()} className="h-11 px-5">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre a tag nas configurações do clan dentro do Clash of Clans.
              </p>
            </div>

            {/* Error */}
            {searchError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {searchError}
              </div>
            )}

            {/* Clan preview */}
            {clanPreview && (
              <Card className="border-2 border-primary/30 bg-primary/3">
                <CardContent className="pt-5 pb-5 space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Badge */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                      {clanPreview.badgeUrls?.medium ? (
                        <img src={clanPreview.badgeUrls.medium} alt={clanPreview.name} className="h-12 w-12 object-contain" />
                      ) : (
                        <Shield className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg truncate">{clanPreview.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{clanPreview.tag}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {clanPreview.clanLevel != null && (
                          <span className="text-xs text-muted-foreground">Nível {clanPreview.clanLevel}</span>
                        )}
                        {clanPreview.members != null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {clanPreview.members} membros
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {clanPreview.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{clanPreview.description}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setClanPreview(null); setTagInput(""); }}
                    >
                      Não é esse
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleConfirmClan}
                      disabled={loadingStep2}
                    >
                      {loadingStep2 ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Check className="h-4 w-4 mr-1.5" />Confirmar clan</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STEP 2: Checkout ─────────────────────────────────────────── */}
        {step === 2 && clanPreview && planData && price && Icon && colors && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Resumo do pedido</h1>
              <p className="text-sm text-muted-foreground mt-1">Revise as informações antes de continuar.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-5">
              {/* LEFT: Order summary */}
              <div className="md:col-span-3 space-y-4">
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  {/* Clan */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Clan</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted border">
                        {clanPreview.badgeUrls?.small ? (
                          <img src={clanPreview.badgeUrls.small} alt={clanPreview.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{clanPreview.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{clanPreview.tag}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* Plan */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Plano</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl border bg-linear-to-br", colors.gradient, colors.border)}>
                          <Icon className={cn("h-5 w-5", colors.icon)} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{planData.name}</p>
                          <p className="text-xs text-muted-foreground">{PERIOD_LABEL[period]}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {price.original && (
                          <p className="text-xs text-muted-foreground line-through">{formatBRL(price.original)}</p>
                        )}
                        <p className="font-bold">{formatBRL(price.amount)}</p>
                        <p className="text-xs text-muted-foreground">/{PERIOD_UNIT[period]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {planData.features.length > 0 && (
                    <>
                      <div className="border-t" />
                      <div className="space-y-1.5">
                        {planData.features.slice(0, 5).map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="border-t" />

                  {/* Pricing breakdown */}
                  <div className="space-y-1.5 text-sm">
                    {period !== "monthly" && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Equivalente/mês</span>
                        <span>{formatBRL(monthlyEquiv)}</span>
                      </div>
                    )}
                    {price.original && (
                      <div className="flex justify-between text-green-600 dark:text-green-400 text-xs">
                        <span>Desconto aplicado</span>
                        <span>-{formatBRL(price.original - price.amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t">
                      <span>Total</span>
                      <span>{formatBRL(price.amount)}</span>
                    </div>
                  </div>
                </div>

                {isTrial && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400 text-sm">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">3 dias grátis disponíveis</p>
                      <p className="text-xs mt-0.5 opacity-80">Ative agora sem precisar pagar. Cobrança apenas após o trial.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Payment method */}
              <div className="md:col-span-2 space-y-4">
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Forma de pagamento</p>

                  {/* PIX option */}
                  <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">PIX</p>
                      <p className="text-xs text-muted-foreground">Aprovação instantânea</p>
                    </div>
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  {/* CTA */}
                  {isTrial ? (
                    <div className="space-y-2">
                      <Button className="w-full h-11" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Iniciar com Trial gratuito
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Sem cobranças nos primeiros 3 dias
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button className="w-full h-11" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4 mr-2" />
                        )}
                        Gerar QR Code PIX
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Você será redirecionado para o pagamento
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-center text-muted-foreground px-2">
                  Ao continuar você concorda com nossos termos de uso. Cancele quando quiser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: PIX Payment ───────────────────────────────────────── */}
        {step === 3 && pixData && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Pagar via PIX</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Escaneie o QR Code ou copie o código abaixo para pagar.
              </p>
            </div>
            <PixStep pix={pixData} onPaid={handlePixPaid} />
          </div>
        )}
      </div>
    </div>
  );
}
