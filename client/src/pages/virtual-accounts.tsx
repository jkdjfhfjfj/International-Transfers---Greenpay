import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Wallet,
  ArrowRightLeft,
} from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PINModal } from "@/components/pin-modal";

const currencyMeta: Record<string, { flag: string; name: string; enabled: boolean }> = {
  USD: { flag: "🇺🇸", name: "US Dollar",        enabled: true  },
  GBP: { flag: "🇬🇧", name: "British Pound",     enabled: true  },
  EUR: { flag: "🇪🇺", name: "Euro",              enabled: true  },
  KES: { flag: "🇰🇪", name: "Kenyan Shilling",   enabled: false },
  NGN: { flag: "🇳🇬", name: "Nigerian Naira",    enabled: false },
  GHS: { flag: "🇬🇭", name: "Ghanaian Cedi",     enabled: false },
};

type Application = {
  id: string;
  currency: string;
  status: string;
  adminNotes?: string;
  accountDetails?: Record<string, any> | null;
  virtualAccount?: {
    id: string;
    balance: string | number;
    holdAmount: string | number;
    availableBalance: string | number;
    isActive: boolean;
    status?: string;
  } | null;
};

const ACCOUNT_FIELDS: { key: string; label: string }[] = [
  { key: "accountName",        label: "Account Name"         },
  { key: "bankName",           label: "Bank Name"            },
  { key: "accountNumber",      label: "Account Number"       },
  { key: "routingNumber",      label: "Routing Number"       },
  { key: "sortCode",           label: "Sort Code"            },
  { key: "iban",               label: "IBAN"                 },
  { key: "swiftCode",          label: "SWIFT / BIC"         },
  { key: "bankAddress",        label: "Bank Address"         },
  { key: "beneficiaryAddress", label: "Beneficiary Address"  },
];

const DECLARATIONS: [string, string][] = [
  ["notUsCitizen",          "I confirm I am not a US citizen, resident, or tax person."],
  ["notPoliticallyExposed", "I am not a politically exposed person (PEP) or related to one."],
  ["beneficialOwner",       "I am the ultimate beneficial owner of these funds."],
  ["truthfulInformation",   "All information I have provided is true and accurate."],
  ["acceptsTerms",          "I accept the terms and conditions."],
];

export default function VirtualAccountsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currency, setCurrency] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("currency")?.toUpperCase();
    return p || "USD";
  });
  const [step, setStep]           = useState(1);
  const [applying, setApplying]   = useState(false);
  const [form, setForm]           = useState({ sourceOfIncome: "", monthlyVolume: "", purpose: "", expectedSenders: "" });
  const [formError, setFormError] = useState("");
  const [declarations, setDeclarations] = useState({
    notUsCitizen: false, notPoliticallyExposed: false, beneficialOwner: false,
    truthfulInformation: false, acceptsTerms: false,
  });
  const [securityPrompt, setSecurityPrompt] = useState<{ pin: boolean; authenticator: boolean } | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<{ accountId: string; amount: number } | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  const { data, isLoading } = useQuery<{ applications: Application[]; supportedCurrencies: string[] }>({
    queryKey: ["/api/virtual-accounts"],
    queryFn: async () => (await apiRequest("GET", "/api/virtual-accounts")).json(),
  });

  const applications      = data?.applications || [];
  const supportedCurrencies = data?.supportedCurrencies || Object.keys(currencyMeta).filter(code => currencyMeta[code].enabled);
  const selectedCurrencyMeta = currencyMeta[currency] || { flag: "🌍", name: currency, enabled: true };
  const selectedApp       = useMemo(() => applications.find(a => a.currency === currency), [applications, currency]);

  useEffect(() => {
    if (supportedCurrencies.length > 0 && !supportedCurrencies.includes(currency)) {
      setCurrency(supportedCurrencies[0]);
    }
  }, [supportedCurrencies, currency]);

  const applyMutation = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", "/api/virtual-accounts/apply", { currency, ...form, declarations })).json(),
    onSuccess: () => {
      setFormError("");
      setApplying(false);
      setStep(1);
      setForm({ sourceOfIncome: "", monthlyVolume: "", purpose: "", expectedSenders: "" });
      setDeclarations({ notUsCitizen: false, notPoliticallyExposed: false, beneficialOwner: false, truthfulInformation: false, acceptsTerms: false });
      toast({ title: "Application submitted", description: "Your request is now pending admin review." });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-accounts"] });
    },
    onError: (e: any) => {
      const raw = e?.message || "Failed to submit application";
      let friendly = raw;
      try { friendly = JSON.parse(raw.replace(/^\d+:\s*/, "")).message || friendly; } catch {}
      setFormError(friendly);
      toast({ title: "Could not submit", description: friendly, variant: "destructive" });
    },
  });

  const copy = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const [transferAmount, setTransferAmount] = useState("");
  const transferMutation = useMutation({
    mutationFn: async ({ accountId, amount, pin, authenticatorCode }: { accountId: string; amount: number; pin?: string; authenticatorCode?: string }) => {
      const response = await apiRequest("POST", `/api/virtual-accounts/${accountId}/transfer`, { amount, pin, authenticatorCode });
      const result = await response.json();
      if (!response.ok) throw Object.assign(new Error(result.message || "Transfer failed"), result);
      return result;
    },
    onSuccess: () => {
      setTransferAmount("");
      toast({ title: "Transfer complete", description: `Funds moved to your ${currency} wallet.` });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      if (error?.requiresSetup) {
        toast({ title: "Security setup required", description: "Set up a PIN or authenticator in Settings before moving funds.", variant: "destructive" });
        return;
      }
      const requiresPin = Boolean(error?.requiresPin ?? error?.securityOptions?.pin);
      const requiresAuthenticator = Boolean(error?.requiresAuthenticator ?? error?.securityOptions?.authenticator);
      if (requiresPin || requiresAuthenticator) {
        setPendingTransfer((current) => current || null);
        setSecurityPrompt({ pin: requiresPin, authenticator: requiresAuthenticator });
        return;
      }
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
    },
  });

  const step1Valid = form.sourceOfIncome.trim().length >= 2
    && form.monthlyVolume.trim().length > 0
    && form.purpose.trim().length >= 5;
  const step2Valid = Object.values(declarations).every(Boolean);

  // ─── Currency selector ────────────────────────────────────────────────────
  const CurrencySelector = (
    <div className="grid grid-cols-3 gap-2">
      {supportedCurrencies.map((code) => {
        const meta = currencyMeta[code] || { flag: "🌍", name: code, enabled: true };
        return (
        <button
          key={code}
          onClick={() => { setCurrency(code); setApplying(false); setStep(1); }}
          className={[
            "relative rounded-2xl border-2 p-3 text-left transition-all",
            "hover:shadow-md cursor-pointer",
            currency === code
               ? "border-primary bg-primary/5 shadow-sm"
              : "border-transparent bg-card shadow-sm",
          ].join(" ")}
        >
          <div className="text-2xl mb-1">{meta.flag}</div>
          <div className="font-bold text-sm text-foreground">{code}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{meta.name}</div>
          {currency === code && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
        );
      })}
    </div>
  );

  // ─── Approved state ───────────────────────────────────────────────────────
  const ApprovedCard = ({ app }: { app: Application }) => {
    const account = app.virtualAccount;
    const balance = Number(account?.balance || 0);
    const held = Number(account?.holdAmount || 0);
    const available = Number(account?.availableBalance ?? Math.max(0, balance - held));
    return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3">
        <CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">Your {currency} account is ready</p>
          <p className="text-xs text-muted-foreground">Use these details to receive {currency} payments</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Deposit details</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {app.accountDetails?.bankName || "Configured bank"} · {app.accountDetails?.accountNumber || "Account number available"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAccountDetails(true)}>
            View details
          </Button>
        </div>
      </div>

      {app.accountDetails?.paymentInstructions && (
        <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-foreground">
          <p className="font-semibold mb-1">Payment instructions</p>
          <p className="text-xs leading-relaxed">{app.accountDetails.paymentInstructions}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Balance", balance],
          ["On hold", held],
          ["Available", available],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-bold text-foreground">{Number(value).toFixed(2)} {currency}</p>
          </div>
        ))}
      </div>

      {account && account.isActive && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Move funds to your wallet</p>
          </div>
          <p className="text-xs text-muted-foreground">Only your available virtual-account balance can be transferred.</p>
           <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
            <Input
               type="text"
               inputMode="decimal"
               pattern="[0-9]*[.]?[0-9]*"
              min="0.01"
              step="0.01"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              placeholder={`Amount in ${currency}`}
            />
            <Button
              disabled={transferMutation.isPending || !transferAmount || Number(transferAmount) <= 0 || Number(transferAmount) > available}
              onClick={() => {
                const next = { accountId: account.id, amount: Number(transferAmount) };
                setPendingTransfer(next);
                transferMutation.mutate(next);
              }}
              className="shrink-0 gap-1"
            >
              <ArrowRightLeft className="w-4 h-4" /> Transfer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={transferMutation.isPending || available <= 0}
              onClick={() => setTransferAmount(available.toFixed(2))}
            >
              Max
            </Button>
          </div>
           {transferAmount && Number(transferAmount) > 0 && (
             <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 text-xs">
               <div><span className="text-muted-foreground">Available</span><p className="font-semibold text-foreground">{available.toFixed(2)} {currency}</p></div>
               <div><span className="text-muted-foreground">Fee</span><p className="font-semibold text-foreground">0.00 {currency}</p></div>
               <div><span className="text-muted-foreground">Rate</span><p className="font-semibold text-foreground">1 {currency} = 1 {currency}</p></div>
               <div><span className="text-muted-foreground">You receive</span><p className="font-semibold text-primary">{Math.min(Number(transferAmount), available).toFixed(2)} {currency}</p></div>
             </div>
           )}
        </div>
      )}
    </motion.div>
    );
  };

  // ─── Pending / rejected states ────────────────────────────────────────────
  const StatusCard = ({ app }: { app: Application }) => {
    const isPending  = app.status === "pending";
    const isRejected = app.status === "rejected";
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={[
          "rounded-2xl border p-5 flex gap-4 items-start",
           isPending  ? "bg-muted border-border"  : "",
           isRejected ? "bg-destructive/5 border-destructive/20" : "",
        ].join(" ")}
      >
        {isPending  && <Clock      className="w-8 h-8 text-primary mt-0.5 shrink-0" />}
        {isRejected && <XCircle    className="w-8 h-8 text-destructive mt-0.5 shrink-0" />}
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {isPending  ? "Application under review"    : "Application not approved"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Our compliance team is reviewing your request. This typically takes 1–3 business days."
              : "Your application was not approved at this time."}
          </p>
          {isRejected && app.adminNotes && (
            <p className="text-sm text-destructive mt-2 font-medium">{app.adminNotes}</p>
          )}
          {isRejected && (
            <Button size="sm" className="mt-3" onClick={() => setApplying(true)}>
              Reapply
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  // ─── Application form ─────────────────────────────────────────────────────
  const ApplicationForm = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* progress */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Step {step} of 2 — {step === 1 ? "Funding profile" : "Compliance declarations"}
          </span>
          <span>{step === 1 ? "50%" : "100%"}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
             className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {formError && (
        <div className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Source of income <span className="text-red-500">*</span></Label>
                <Input
                  value={form.sourceOfIncome}
                  onChange={e => { setFormError(""); setForm({ ...form, sourceOfIncome: e.target.value }); }}
                  placeholder="e.g. Employment, freelancing, business"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Expected monthly volume <span className="text-red-500">*</span></Label>
                <Input
                  value={form.monthlyVolume}
                  onChange={e => { setFormError(""); setForm({ ...form, monthlyVolume: e.target.value }); }}
                  placeholder="e.g. $1,000 – $5,000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Purpose of account <span className="text-red-500">*</span></Label>
                <Textarea
                  value={form.purpose}
                  onChange={e => { setFormError(""); setForm({ ...form, purpose: e.target.value }); }}
                  placeholder="e.g. Receiving salary, client payments, remittances"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Expected senders <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={form.expectedSenders}
                  onChange={e => setForm({ ...form, expectedSenders: e.target.value })}
                  placeholder="e.g. Employer, platforms, family, clients"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
               <p className="text-sm font-medium text-foreground mb-2">Compliance declarations</p>
               <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                 These confirmations help us meet banking-partner requirements. Select each statement only if it is accurate for you.
               </p>
              {DECLARATIONS.map(([key, label]) => (
                <label key={key} className={[
                  "flex gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-colors",
                  (declarations as any)[key] ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted",
                ].join(" ")}>
                  <Checkbox
                    checked={(declarations as any)[key]}
                    onCheckedChange={v => setDeclarations({ ...declarations, [key]: !!v })}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-foreground leading-relaxed">{label}</span>
                </label>
              ))}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex gap-2 text-xs text-foreground">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Approved users see admin-configured account details after compliance review.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => { if (step === 1) { setApplying(false); setStep(1); } else setStep(1); }}
          className="gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1" />
        {step === 1 ? (
          <Button disabled={!step1Valid} onClick={() => setStep(2)} className="gap-1">
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            disabled={!step2Valid || applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            {applyMutation.isPending ? "Submitting…" : "Submit application"}
          </Button>
        )}
      </div>
    </motion.div>
  );

  // ─── No application yet ───────────────────────────────────────────────────
  const NoApplication = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm p-6 text-center space-y-4"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Building2 className="w-7 h-7 text-primary" />
      </div>
      <div>
        <p className="font-bold text-foreground">Apply for a {currency} account</p>
        <p className="text-sm text-muted-foreground mt-1">
          Get dedicated {selectedCurrencyMeta.name} bank details to receive international payments.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        {["Dedicated IBAN / account number", "Multi-currency support", "Compliance-backed", "Fast approval"].map(f => (
          <div key={f} className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
          </div>
        ))}
      </div>
      <Button className="w-full" onClick={() => setApplying(true)}>
        Apply now <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground bottom-nav-safe md:pb-10">
      <WavyHeader size="sm" />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Page heading */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Virtual Accounts</h1>
        <p className="text-xs text-muted-foreground">Receive payments in your configured currencies</p>
          </div>
        </div>

        {/* Currency picker */}
        {CurrencySelector}

        {/* Content */}
        {isLoading ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applying || (!selectedApp && !applying) ? (
          applying ? ApplicationForm : NoApplication
        ) : selectedApp?.status === "approved" && selectedApp.accountDetails ? (
          <ApprovedCard app={selectedApp} />
        ) : selectedApp ? (
          <StatusCard app={selectedApp} />
        ) : null}
      </main>
      <AnimatePresence>
        {showAccountDetails && selectedApp?.accountDetails && (
          <motion.div
            className="fixed inset-0 z-[160] flex items-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAccountDetails(false)}
          >
            <motion.div
              className="bottom-sheet-safe max-h-[calc(100dvh-var(--bottom-nav-height))] w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">How to receive {currency}</p>
                  <p className="text-xs text-muted-foreground">Use these details for incoming payments.</p>
                </div>
                <button className="text-sm text-muted-foreground" onClick={() => setShowAccountDetails(false)}>Close</button>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
                {ACCOUNT_FIELDS.map(({ key, label }) => {
                  const val = selectedApp.accountDetails?.[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0">
                      <span className="w-32 shrink-0 text-xs text-muted-foreground">{label}</span>
                      <div className="ml-auto flex min-w-0 items-center gap-2">
                        <span className="truncate font-mono text-sm text-foreground">{val}</span>
                        <button onClick={() => copy(val)} className="shrink-0 text-muted-foreground hover:text-primary">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedApp.accountDetails.paymentInstructions && (
                <div className="mt-4 rounded-2xl border border-border bg-muted p-4 text-sm">
                  <p className="font-semibold text-foreground">Payment instructions</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{selectedApp.accountDetails.paymentInstructions}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PINModal
        isOpen={!!securityPrompt}
        onClose={() => { setSecurityPrompt(null); setPendingTransfer(null); }}
        requiresPin={securityPrompt?.pin}
        requiresAuthenticator={securityPrompt?.authenticator}
        title="Confirm virtual-account transfer"
        description="Verify your PIN or authenticator to move funds into your wallet."
        onSuccess={(pin, authenticatorCode) => {
          const next = pendingTransfer;
          setSecurityPrompt(null);
          setPendingTransfer(null);
          if (next) transferMutation.mutate({ ...next, pin, authenticatorCode });
        }}
        isLoading={transferMutation.isPending}
      />
    </div>
  );
}
