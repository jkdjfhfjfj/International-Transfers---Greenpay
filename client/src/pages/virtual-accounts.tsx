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
import { ArrowLeft, Building2, CheckCircle2, Clock, Copy, ShieldCheck } from "lucide-react";
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
  const [declarations, setDeclarations] = useState({ notUsCitizen: false, notPoliticallyExposed: false, beneficialOwner: false, truthfulInformation: false, acceptsTerms: false });

  const { data } = useQuery<{ applications: Application[]; supportedCurrencies: string[] }>({
    queryKey: ["/api/virtual-accounts"],
    queryFn: async () => (await apiRequest("GET", "/api/virtual-accounts")).json(),
  });
  const applications = data?.applications || [];
  const selectedApplication = useMemo(() => applications.find(a => a.currency === currency), [applications, currency]);

  const applyMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/virtual-accounts/apply", { currency, ...form, declarations })).json(),
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
          <div className="flex items-center gap-2"><Badge>{step} of 2</Badge><span className="text-sm text-slate-500">{step === 1 ? "Funding profile" : "Compliance declarations"}</span></div>
          {step === 1 ? <div className="space-y-3">
            <div><Label>Source of income</Label><Input value={form.sourceOfIncome} onChange={e => setForm({ ...form, sourceOfIncome: e.target.value })} placeholder="Employment, business, investments..." /></div>
            <div><Label>Expected monthly volume</Label><Input value={form.monthlyVolume} onChange={e => setForm({ ...form, monthlyVolume: e.target.value })} placeholder="e.g. 1,000 - 5,000" /></div>
            <div><Label>Purpose of account</Label><Textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Receiving salary, client payments, remittances..." /></div>
            <div><Label>Expected senders</Label><Input value={form.expectedSenders} onChange={e => setForm({ ...form, expectedSenders: e.target.value })} placeholder="Employer, platforms, family, clients" /></div>
          </div> : <div className="space-y-3">
            {[
              ["notUsCitizen", "I confirm I am not a US citizen, resident, or tax person."], ["notPoliticallyExposed", "I am not politically exposed and am not related to a politically exposed person."], ["beneficialOwner", "I am the beneficial owner of funds received into this account."], ["truthfulInformation", "All information supplied is truthful and current."], ["acceptsTerms", "I accept GreenPay virtual account terms and monitoring requirements."],
            ].map(([key, label]) => <label key={key} className="flex gap-3 rounded-xl border p-3 text-sm"><Checkbox checked={(declarations as any)[key]} onCheckedChange={v => setDeclarations({ ...declarations, [key]: Boolean(v) })} /><span>{label}</span></label>)}
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5" /> Approved users see one admin-configured account per currency. Incoming credits remain subject to compliance checks.</div>
          </div>}
          <div className="flex gap-2">{step > 1 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}<Button disabled={!canContinue || applyMutation.isPending} onClick={() => step === 1 ? setStep(2) : applyMutation.mutate()}>{step === 1 ? "Continue" : "Submit for review"}</Button></div>
        </CardContent>
      </Card>}
    </main>
  </div>;
}
