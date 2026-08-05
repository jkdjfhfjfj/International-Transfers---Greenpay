import { useMemo, useState } from "react";
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
} from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
    return p && ["USD", "GBP", "EUR"].includes(p) ? p : "USD";
  });
  const [step, setStep]           = useState(1);
  const [applying, setApplying]   = useState(false);
  const [form, setForm]           = useState({ sourceOfIncome: "", monthlyVolume: "", purpose: "", expectedSenders: "" });
  const [formError, setFormError] = useState("");
  const [declarations, setDeclarations] = useState({
    notUsCitizen: false, notPoliticallyExposed: false, beneficialOwner: false,
    truthfulInformation: false, acceptsTerms: false,
  });

  const { data, isLoading } = useQuery<{ applications: Application[]; supportedCurrencies: string[] }>({
    queryKey: ["/api/virtual-accounts"],
    queryFn: async () => (await apiRequest("GET", "/api/virtual-accounts")).json(),
  });

  const applications      = data?.applications || [];
  const selectedApp       = useMemo(() => applications.find(a => a.currency === currency), [applications, currency]);

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

  const step1Valid = form.sourceOfIncome.trim().length >= 2
    && form.monthlyVolume.trim().length > 0
    && form.purpose.trim().length >= 5;
  const step2Valid = Object.values(declarations).every(Boolean);

  // ─── Currency selector ────────────────────────────────────────────────────
  const CurrencySelector = (
    <div className="grid grid-cols-3 gap-2">
      {Object.entries(currencyMeta).map(([code, meta]) => (
        <button
          key={code}
          onClick={() => { if (meta.enabled) { setCurrency(code); setApplying(false); setStep(1); } }}
          disabled={!meta.enabled}
          className={[
            "relative rounded-2xl border-2 p-3 text-left transition-all",
            meta.enabled ? "hover:shadow-md cursor-pointer" : "opacity-50 cursor-not-allowed",
            currency === code && meta.enabled
              ? "border-emerald-500 bg-emerald-50 shadow-sm"
              : "border-transparent bg-white shadow-sm",
          ].join(" ")}
        >
          <div className="text-2xl mb-1">{meta.flag}</div>
          <div className="font-bold text-sm text-slate-800">{code}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{meta.enabled ? meta.name : "Coming soon"}</div>
          {currency === code && meta.enabled && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      ))}
    </div>
  );

  // ─── Approved state ───────────────────────────────────────────────────────
  const ApprovedCard = ({ app }: { app: Application }) => (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
        <CheckCircle2 className="text-emerald-600 w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800 text-sm">Your {currency} account is ready</p>
          <p className="text-xs text-emerald-600">Use these details to receive {currency} payments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {ACCOUNT_FIELDS.map(({ key, label }) => {
          const val = app.accountDetails?.[key];
          if (!val) return null;
          return (
            <div key={key} className="flex items-center justify-between px-4 py-3 border-b last:border-0 gap-3">
              <span className="text-xs text-slate-500 shrink-0 w-32">{label}</span>
              <div className="flex items-center gap-2 min-w-0 ml-auto">
                <span className="font-mono text-sm text-slate-800 truncate">{val}</span>
                <button
                  onClick={() => copy(val)}
                  className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {app.accountDetails?.paymentInstructions && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Payment instructions</p>
          <p className="text-xs leading-relaxed">{app.accountDetails.paymentInstructions}</p>
        </div>
      )}
    </motion.div>
  );

  // ─── Pending / rejected states ────────────────────────────────────────────
  const StatusCard = ({ app }: { app: Application }) => {
    const isPending  = app.status === "pending";
    const isRejected = app.status === "rejected";
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className={[
          "rounded-2xl border p-5 flex gap-4 items-start",
          isPending  ? "bg-amber-50 border-amber-200"  : "",
          isRejected ? "bg-red-50 border-red-200"      : "",
        ].join(" ")}
      >
        {isPending  && <Clock      className="w-8 h-8 text-amber-500 mt-0.5 shrink-0" />}
        {isRejected && <XCircle    className="w-8 h-8 text-red-500 mt-0.5 shrink-0" />}
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            {isPending  ? "Application under review"    : "Application not approved"}
          </p>
          <p className="text-sm text-slate-500">
            {isPending
              ? "Our compliance team is reviewing your request. This typically takes 1–3 business days."
              : "Your application was not approved at this time."}
          </p>
          {isRejected && app.adminNotes && (
            <p className="text-sm text-red-700 mt-2 font-medium">{app.adminNotes}</p>
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
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            Step {step} of 2 — {step === 1 ? "Funding profile" : "Compliance declarations"}
          </span>
          <span>{step === 1 ? "50%" : "100%"}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {formError && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4">
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
                <Label className="text-sm font-medium">Expected senders <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  value={form.expectedSenders}
                  onChange={e => setForm({ ...form, expectedSenders: e.target.value })}
                  placeholder="e.g. Employer, platforms, family, clients"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-sm font-medium text-slate-700 mb-2">Please confirm all declarations to continue</p>
              {DECLARATIONS.map(([key, label]) => (
                <label key={key} className={[
                  "flex gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-colors",
                  (declarations as any)[key] ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50",
                ].join(" ")}>
                  <Checkbox
                    checked={(declarations as any)[key]}
                    onCheckedChange={v => setDeclarations({ ...declarations, [key]: !!v })}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-slate-700 leading-relaxed">{label}</span>
                </label>
              ))}
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex gap-2 text-xs text-emerald-800">
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
      className="bg-white rounded-2xl border shadow-sm p-6 text-center space-y-4"
    >
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
        <Building2 className="w-7 h-7 text-emerald-600" />
      </div>
      <div>
        <p className="font-bold text-slate-800">Apply for a {currency} account</p>
        <p className="text-sm text-slate-500 mt-1">
          Get dedicated {currencyMeta[currency]?.name} bank details to receive international payments.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
        {["Dedicated IBAN / account number", "Multi-currency support", "Compliance-backed", "Fast approval"].map(f => (
          <div key={f} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {f}
          </div>
        ))}
      </div>
      <Button className="w-full" onClick={() => setApplying(true)}>
        Apply now <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-10">
      <WavyHeader size="sm" />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Page heading */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">Virtual Accounts</h1>
            <p className="text-xs text-slate-500">Receive USD, GBP &amp; EUR payments</p>
          </div>
        </div>

        {/* Currency picker */}
        {CurrencySelector}

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border shadow-sm p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applying || (!selectedApp && !applying) ? (
          applying ? ApplicationForm : NoApplication
        ) : selectedApp?.status === "approved" && selectedApp.accountDetails ? (
          <ApprovedCard app={selectedApp} />
        ) : selectedApp ? (
          <StatusCard app={selectedApp} />
        ) : null}
      </main>
    </div>
  );
}
