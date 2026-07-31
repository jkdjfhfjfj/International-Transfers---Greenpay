import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
<<<<<<< ours
import { ArrowLeft, Building2, CheckCircle2, Clock, Copy, ShieldCheck } from "lucide-react";
=======
import { AlertCircle, Building2, CheckCircle2, Clock, Copy, ShieldCheck } from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";
>>>>>>> theirs
import { useToast } from "@/hooks/use-toast";

const currencyMeta: Record<string, { flag: string; name: string; enabled: boolean }> = {
  USD: { flag: "🇺🇸", name: "US Dollar", enabled: true },
  GBP: { flag: "🇬🇧", name: "British Pound", enabled: true },
  EUR: { flag: "🇪🇺", name: "Euro", enabled: true },
  KES: { flag: "🇰🇪", name: "Kenyan Shilling", enabled: false },
  NGN: { flag: "🇳🇬", name: "Nigerian Naira", enabled: false },
  GHS: { flag: "🇬🇭", name: "Ghanaian Cedi", enabled: false },
};

type Application = { id: string; currency: string; status: string; adminNotes?: string; accountDetails?: any };

export default function VirtualAccountsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("currency")?.toUpperCase();
    return requested && ["USD", "GBP", "EUR"].includes(requested) ? requested : "USD";
  });
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ sourceOfIncome: "", monthlyVolume: "", purpose: "", expectedSenders: "" });
<<<<<<< ours
=======
  const [formError, setFormError] = useState("");
>>>>>>> theirs
  const [declarations, setDeclarations] = useState({ notUsCitizen: false, notPoliticallyExposed: false, beneficialOwner: false, truthfulInformation: false, acceptsTerms: false });

  const { data } = useQuery<{ applications: Application[]; supportedCurrencies: string[] }>({
    queryKey: ["/api/virtual-accounts"],
    queryFn: async () => (await apiRequest("GET", "/api/virtual-accounts")).json(),
  });
  const applications = data?.applications || [];
  const selectedApplication = useMemo(() => applications.find(a => a.currency === currency), [applications, currency]);

  const applyMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/virtual-accounts/apply", { currency, ...form, declarations })).json(),
<<<<<<< ours
    onSuccess: () => { toast({ title: "Application submitted", description: "Your request is now pending admin review." }); queryClient.invalidateQueries({ queryKey: ["/api/virtual-accounts"] }); setStep(1); },
    onError: (e: any) => toast({ title: "Could not submit", description: e.message, variant: "destructive" }),
  });

  const copy = (text?: string) => { if (text) navigator.clipboard.writeText(text); toast({ title: "Copied" }); };
  const canContinue = step === 1 ? form.sourceOfIncome && form.monthlyVolume && form.purpose : Object.values(declarations).every(Boolean);

  return <div className="min-h-screen bg-slate-50 pb-28 md:pb-8">
    <div className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white px-4 pt-12 pb-6 rounded-b-[2rem]">
      <button onClick={() => setLocation("/dashboard")} className="mb-4 flex items-center gap-2 text-white/90"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold">Virtual Currency Accounts</h1>
      <p className="text-sm text-white/80 mt-1">Apply once per wallet to receive local USD, GBP or EUR bank details after compliance review.</p>
    </div>

    <main className="max-w-3xl mx-auto px-4 -mt-3 space-y-4">
=======
    onSuccess: () => { setFormError(""); toast({ title: "Application submitted", description: "Your request is now pending admin review." }); queryClient.invalidateQueries({ queryKey: ["/api/virtual-accounts"] }); setStep(1); },
    onError: (e: any) => {
      const raw = e?.message || "Failed to submit application";
      let friendly = raw;
      try {
        const jsonText = raw.replace(/^\d+:\s*/, "");
        const parsed = JSON.parse(jsonText);
        friendly = parsed.message || parsed.errors?.[0]?.message || friendly;
      } catch {}
      setFormError(friendly);
      toast({ title: "Could not submit", description: friendly, variant: "destructive" });
    },
  });

  const copy = (text?: string) => { if (text) navigator.clipboard.writeText(text); toast({ title: "Copied" }); };
  const fieldErrors = {
    sourceOfIncome: form.sourceOfIncome.trim().length > 0 && form.sourceOfIncome.trim().length < 2 ? "Enter at least 2 characters." : "",
    monthlyVolume: form.monthlyVolume.trim().length === 0 ? "Expected monthly volume is required." : "",
    purpose: form.purpose.trim().length > 0 && form.purpose.trim().length < 5 ? "Purpose must be at least 5 characters." : "",
  };
  const canContinue = step === 1
    ? form.sourceOfIncome.trim().length >= 2 && form.monthlyVolume.trim().length > 0 && form.purpose.trim().length >= 5
    : Object.values(declarations).every(Boolean);

  return <div className="min-h-screen bg-slate-50 pb-28 md:pb-8">
    <WavyHeader title="Virtual Currency Accounts" subtitle="Apply for USD, GBP or EUR account details after review" onBack={() => setLocation("/dashboard")} size="lg" icon={<Building2 className="w-5 h-5 text-white" />} />

    <main className="max-w-3xl mx-auto px-4 -mt-6 space-y-4">
>>>>>>> theirs
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(currencyMeta).map(([code, meta]) => <button key={code} onClick={() => meta.enabled && setCurrency(code)} disabled={!meta.enabled} className={`rounded-2xl border p-3 text-left bg-white ${currency === code ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200"} ${!meta.enabled ? "opacity-60" : ""}`}>
          <div className="text-xl">{meta.flag}</div><div className="font-bold text-sm">{code}</div><div className="text-[10px] text-slate-500">{meta.enabled ? meta.name : "Coming soon"}</div>
        </button>)}
      </div>

      {selectedApplication?.status === "approved" && selectedApplication.accountDetails ? <Card className="border-emerald-200">
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600" /> {currency} account approved</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {["accountName","bankName","accountNumber","routingNumber","sortCode","iban","swiftCode","bankAddress","beneficiaryAddress"].map(k => selectedApplication.accountDetails?.[k] && <div key={k} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between gap-3"><div><p className="text-xs uppercase text-slate-500">{k.replace(/([A-Z])/g, " $1")}</p><p className="font-semibold break-all">{selectedApplication.accountDetails[k]}</p></div><Button size="sm" variant="ghost" onClick={() => copy(selectedApplication.accountDetails[k])}><Copy className="w-4 h-4" /></Button></div>)}
          {selectedApplication.accountDetails.paymentInstructions && <p className="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl p-3">{selectedApplication.accountDetails.paymentInstructions}</p>}
        </CardContent>
      </Card> : selectedApplication ? <Card><CardContent className="py-8 text-center"><Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" /><h2 className="font-bold capitalize">{selectedApplication.status}</h2><p className="text-sm text-slate-500 mt-1">{selectedApplication.status === "pending" ? "Admin is reviewing your declarations and source of income." : selectedApplication.adminNotes || "You may apply again after updating your information."}</p></CardContent></Card> : <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Apply for {currency} account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
<<<<<<< ours
          <div className="flex items-center gap-2"><Badge>{step} of 2</Badge><span className="text-sm text-slate-500">{step === 1 ? "Funding profile" : "Compliance declarations"}</span></div>
          {step === 1 ? <div className="space-y-3">
            <div><Label>Source of income</Label><Input value={form.sourceOfIncome} onChange={e => setForm({ ...form, sourceOfIncome: e.target.value })} placeholder="Employment, business, investments..." /></div>
            <div><Label>Expected monthly volume</Label><Input value={form.monthlyVolume} onChange={e => setForm({ ...form, monthlyVolume: e.target.value })} placeholder="e.g. 1,000 - 5,000" /></div>
            <div><Label>Purpose of account</Label><Textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Receiving salary, client payments, remittances..." /></div>
=======
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2"><Badge>{step} of 2</Badge><span className="text-sm text-slate-500">{step === 1 ? "Funding profile" : "Compliance declarations"}</span></div>
            <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-100 sm:max-w-56"><div className="bg-emerald-500 transition-all" style={{ width: step === 1 ? "50%" : "100%" }} /></div>
          </div>
          {formError && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{formError}</span></div>}
          {step === 1 ? <div className="space-y-3">
            <div><Label>Source of income</Label><Input value={form.sourceOfIncome} onChange={e => { setFormError(""); setForm({ ...form, sourceOfIncome: e.target.value }); }} placeholder="Employment, business, investments..." />{fieldErrors.sourceOfIncome && <p className="mt-1 text-xs text-red-600">{fieldErrors.sourceOfIncome}</p>}</div>
            <div><Label>Expected monthly volume</Label><Input value={form.monthlyVolume} onChange={e => { setFormError(""); setForm({ ...form, monthlyVolume: e.target.value }); }} placeholder="e.g. 1,000 - 5,000" />{fieldErrors.monthlyVolume && <p className="mt-1 text-xs text-red-600">{fieldErrors.monthlyVolume}</p>}</div>
            <div><Label>Purpose of account</Label><Textarea value={form.purpose} onChange={e => { setFormError(""); setForm({ ...form, purpose: e.target.value }); }} placeholder="Receiving salary, client payments, remittances..." />{fieldErrors.purpose && <p className="mt-1 text-xs text-red-600">{fieldErrors.purpose}</p>}</div>
>>>>>>> theirs
            <div><Label>Expected senders</Label><Input value={form.expectedSenders} onChange={e => setForm({ ...form, expectedSenders: e.target.value })} placeholder="Employer, platforms, family, clients" /></div>
          </div> : <div className="space-y-3">
            {[
              ["notUsCitizen", "I confirm I am not a US citizen, resident, or tax person."], ["notPoliticallyExposed", "I am not politically exposed and am not related to a politically exposed person."], ["beneficialOwner", "I am the beneficial owner of funds received into this account."], ["truthfulInformation", "All information supplied is truthful and current."], ["acceptsTerms", "I accept GreenPay virtual account terms and monitoring requirements."],
            ].map(([key, label]) => <label key={key} className="flex gap-3 rounded-xl border p-3 text-sm"><Checkbox checked={(declarations as any)[key]} onCheckedChange={v => setDeclarations({ ...declarations, [key]: Boolean(v) })} /><span>{label}</span></label>)}
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5" /> Approved users see one admin-configured account per currency. Incoming credits remain subject to compliance checks.</div>
          </div>}
<<<<<<< ours
          <div className="flex gap-2">{step > 1 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}<Button disabled={!canContinue || applyMutation.isPending} onClick={() => step === 1 ? setStep(2) : applyMutation.mutate()}>{step === 1 ? "Continue" : "Submit for review"}</Button></div>
=======
          <div className="sticky bottom-24 z-10 -mx-2 flex gap-2 rounded-2xl border bg-white/95 p-2 shadow-lg backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">{step > 1 && <Button className="flex-1" variant="outline" onClick={() => setStep(1)}>Back</Button>}<Button className="flex-1" disabled={!canContinue || applyMutation.isPending} onClick={() => step === 1 ? setStep(2) : applyMutation.mutate()}>{step === 1 ? "Continue" : "Submit for review"}</Button></div>
>>>>>>> theirs
        </CardContent>
      </Card>}
    </main>
  </div>;
}
