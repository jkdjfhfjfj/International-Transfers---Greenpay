import AdminShell from "@/components/admin/admin-shell";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle, Building2, Check, Save, X, ChevronDown, ChevronUp,
  User, Clock, CheckCircle2, XCircle, FileText,
} from "lucide-react";

const CURRENCIES = ["USD", "GBP", "EUR"] as const;
type Currency = string;

const CURRENCY_META: Record<Currency, { flag: string; name: string }> = {
  USD: { flag: "🇺🇸", name: "US Dollar"     },
  GBP: { flag: "🇬🇧", name: "British Pound" },
  EUR: { flag: "🇪🇺", name: "Euro"          },
};

const SETTINGS_FIELDS: { key: string; label: string; multiline?: boolean; optional?: boolean }[] = [
  { key: "accountName",        label: "Account name"         },
  { key: "bankName",           label: "Bank name"            },
  { key: "accountNumber",      label: "Account number"       },
  { key: "routingNumber",      label: "Routing number",       optional: true },
  { key: "sortCode",           label: "Sort code",            optional: true },
  { key: "iban",               label: "IBAN",                 optional: true },
  { key: "swiftCode",          label: "SWIFT / BIC",          optional: true },
  { key: "bankAddress",        label: "Bank address",         optional: true, multiline: true },
  { key: "beneficiaryAddress", label: "Beneficiary address",  optional: true, multiline: true },
  { key: "paymentInstructions",label: "Payment instructions", optional: true, multiline: true },
];

// ── Email template UUID config ────────────────────────────────────────────────
const EMAIL_TEMPLATE_KEYS = [
  { key: "virtual_account_approved", label: "Virtual Account Approved" },
  { key: "virtual_account_rejected", label: "Virtual Account Rejected (uses approved template)" },
  { key: "kyc_verified",             label: "KYC Verified"             },
  { key: "kyc_submitted",            label: "KYC Submitted"            },
  { key: "welcome",                  label: "Welcome Email"            },
  { key: "fund_receipt",             label: "Fund Receipt"             },
  { key: "transaction_export",       label: "Transaction Export"       },
];

function EmailTemplateConfig() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: uuids, isLoading } = useQuery({
    queryKey: ["/api/admin/email-templates"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/email-templates")).json(),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, uuid }: { key: string; uuid: string }) =>
      (await apiRequest("PUT", `/api/admin/email-templates/${key}`, { uuid })).json(),
    onSuccess: (_d, vars) => {
      toast({ title: `Template UUID saved`, description: vars.key });
      qc.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setDrafts(d => { const n = { ...d }; delete n[vars.key]; return n; });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  if (isLoading) return <div className="p-5 text-sm text-slate-400">Loading templates…</div>;

  return (
    <div className="p-5 space-y-3">
      <p className="text-xs text-slate-500">Configure Mailtrap template UUIDs. Changes take effect immediately — all emails use the updated UUID.</p>
      <div className="grid md:grid-cols-2 gap-3">
        {EMAIL_TEMPLATE_KEYS.map(({ key, label }) => {
          const current = (uuids?.templates?.[key]?.uuid) || "";
          const isCustom = uuids?.templates?.[key]?.isCustom;
          const draft = drafts[key];
          const value = draft !== undefined ? draft : current;
          return (
            <div key={key} className="space-y-1">
              <Label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                {label}
                {isCustom && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Custom</span>}
              </Label>
              <div className="flex gap-1.5">
                <Input
                  value={value}
                  onChange={e => setDrafts(d => ({ ...d, [key]: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-xs h-8"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5"
                  disabled={draft === undefined || saveMutation.isPending}
                  onClick={() => saveMutation.mutate({ key, uuid: draft! })}
                >
                  <Save className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-700 border-0 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-0 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
}

export default function AdminVirtualAccountsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [accountAmounts, setAccountAmounts] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/virtual-accounts"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/virtual-accounts")).json(),
  });

  const settings     = (data?.settings     || []) as any[];
  const applications = (data?.applications || []) as any[];
  const accounts     = (data?.accounts     || []) as any[];
  const supportedCurrencies: string[] = data?.supportedCurrencies || [...CURRENCIES];
  const allCurrencies: string[] = data?.allCurrencies || supportedCurrencies;

  const setting = settings.find((s: any) => s.currency === currency) || {};
  const get = (k: string) => draft[k] ?? setting[k] ?? "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = { isActive: true };
      SETTINGS_FIELDS.forEach(f => { payload[f.key] = get(f.key) || null; });
      // required fields
      payload.accountName  = get("accountName");
      payload.bankName     = get("bankName");
      payload.accountNumber = get("accountNumber");
      return (await apiRequest("PUT", `/api/admin/virtual-accounts/settings/${currency}`, payload)).json();
    },
    onSuccess: () => {
      setSaveError("");
      setDraft({});
      toast({ title: `${currency} account details saved` });
      qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] });
    },
    onError: (e: any) => {
      const raw = e?.message || "Failed to save account details";
      let friendly = raw;
      try { friendly = JSON.parse(raw.replace(/^\d+:\s*/, "")).message || friendly; } catch {}
      setSaveError(friendly);
      toast({ title: "Save failed", description: friendly, variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) =>
      (await apiRequest("PATCH", `/api/admin/virtual-accounts/applications/${id}`, { status, adminNotes })).json(),
    onSuccess: (_data, vars) => {
      toast({ title: `Application ${vars.status}` });
      qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] });
    },
  });

  const currencyMutation = useMutation({
    mutationFn: async (nextCurrencies: string[]) =>
      (await apiRequest("PUT", "/api/admin/virtual-accounts/currencies", { currencies: nextCurrencies })).json(),
    onSuccess: () => {
      toast({ title: "Virtual-account currencies updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] });
    },
    onError: (e: any) => toast({ title: "Currency update failed", description: e.message, variant: "destructive" }),
  });

  const balanceMutation = useMutation({
    mutationFn: async ({ id, amount, type }: { id: string; amount: string; type: "credit" | "debit" }) =>
      (await apiRequest("PUT", `/api/admin/virtual-accounts/${id}/balance`, { amount, type })).json(),
    onSuccess: () => {
      toast({ title: "Virtual-account balance updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] });
    },
    onError: (e: any) => toast({ title: "Balance update failed", description: e.message, variant: "destructive" }),
  });

  const holdMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: string }) =>
      (await apiRequest("PUT", `/api/admin/virtual-accounts/${id}/hold`, { amount })).json(),
    onSuccess: () => {
      toast({ title: "Virtual-account hold updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] });
    },
    onError: (e: any) => toast({ title: "Hold update failed", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminShell title="Virtual Accounts">
      <div className="max-w-5xl space-y-6">

        {/* ── Settings panel ─────────────────────────────────────────────── */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">Bank account settings</h2>
            <p className="text-sm text-slate-400 ml-1">— configure details sent to approved users</p>
          </div>

          {/* Enabled virtual-account currencies */}
          <div className="p-5 border-b space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Currencies available to users</p>
              <p className="text-xs text-slate-400">Only enabled currencies appear in the application form.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCurrencies.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    const next = supportedCurrencies.includes(c)
                      ? supportedCurrencies.filter(item => item !== c)
                      : [...supportedCurrencies, c];
                    if (next.length) currencyMutation.mutate(next);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    supportedCurrencies.includes(c)
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {CURRENCY_META[c as keyof typeof CURRENCY_META]?.flag || "🌍"} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Currency tabs */}
          <div className="flex border-b bg-slate-50">
            {supportedCurrencies.map(c => (
              <button
                key={c}
                onClick={() => { setCurrency(c); setDraft({}); setSaveError(""); }}
                className={[
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  currency === c
                    ? "border-emerald-500 text-emerald-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60",
                ].join(" ")}
              >
                <span>{CURRENCY_META[c as keyof typeof CURRENCY_META]?.flag || "🌍"}</span>
                <span>{c}</span>
                {settings.find((s: any) => s.currency === c) && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {saveError && (
              <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {SETTINGS_FIELDS.map(f => (
                <div key={f.key} className={f.multiline ? "md:col-span-2" : ""}>
                  <Label className="text-sm font-medium text-slate-700 mb-1 block">
                    {f.label}
                    {!f.optional && <span className="text-red-500 ml-0.5">*</span>}
                    {f.optional && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                  </Label>
                  {f.multiline ? (
                    <Textarea
                      value={get(f.key)}
                      onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                      rows={2}
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
                  ) : (
                    <Input
                      value={get(f.key)}
                      onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? "Saving…" : `Save ${currency} details`}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Email Template Config ──────────────────────────────────────── */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-slate-800">Email Template UUIDs</h2>
            <p className="text-sm text-slate-400 ml-1">— Mailtrap template UUIDs for virtual account emails</p>
          </div>
          <EmailTemplateConfig />
        </div>

        {/* ── Applications ───────────────────────────────────────────────── */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-800">Applications</h2>
            </div>
            <Badge variant="secondary">{applications.length}</Badge>
          </div>

          {isLoading ? (
            <div className="p-10 flex justify-center">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No applications yet.</div>
          ) : (
            <div className="divide-y">
              {applications.map((item: any) => {
                const app  = item.application ?? item;
                const user = item.user;
                const account = accounts.find((entry: any) => entry.applicationId === app.id);
                const isOpen = expandedApp === app.id;

                return (
                  <div key={app.id}>
                    <div
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setExpandedApp(isOpen ? null : app.id)}
                    >
                      {/* avatar */}
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {user?.fullName || user?.email || app.userId}
                        </p>
                        <p className="text-xs text-slate-400">
                          {user?.email} &nbsp;·&nbsp; {app.currency} account
                        </p>
                      </div>

                      <StatusBadge status={app.status} />

                      <button className="text-slate-400 ml-2">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-4 bg-slate-50 border-t">
                        {/* Application details */}
                        <div className="grid sm:grid-cols-2 gap-3 pt-4">
                          {[
                            ["Currency",         app.currency],
                            ["Status",           app.status],
                            ["Source of income", app.sourceOfIncome],
                            ["Monthly volume",   app.monthlyVolume],
                            ["Purpose",          app.purpose],
                            ["Expected senders", app.expectedSenders || "—"],
                            ["Applied on",       app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"],
                          ].map(([label, value]) => (
                            <div key={label as string} className="bg-white rounded-xl border p-3">
                              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
                              <p className="text-sm text-slate-700 font-medium">{value}</p>
                            </div>
                          ))}
                        </div>

                        {account && (
                          <div className="bg-white rounded-xl border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">Account balance controls</p>
                                <p className="text-xs text-slate-400">Ledger-backed balance and hold management</p>
                              </div>
                              <StatusBadge status={account.isActive ? "approved" : "rejected"} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                ["Balance", account.balance],
                                ["On hold", account.holdAmount],
                                ["Available", account.availableBalance ?? Math.max(0, Number(account.balance || 0) - Number(account.holdAmount || 0))],
                              ].map(([label, value]) => (
                                <div key={label as string} className="rounded-lg bg-slate-50 p-2">
                                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                                  <p className="font-bold text-sm text-slate-700">{Number(value || 0).toFixed(2)} {account.currency}</p>
                                </div>
                              ))}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-500">Credit or debit</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Amount"
                                    value={accountAmounts[`balance:${account.id}`] || ""}
                                    onChange={e => setAccountAmounts({ ...accountAmounts, [`balance:${account.id}`]: e.target.value })}
                                  />
                                  <Button
                                    size="sm"
                                    disabled={balanceMutation.isPending || !accountAmounts[`balance:${account.id}`]}
                                    onClick={() => balanceMutation.mutate({ id: account.id, amount: accountAmounts[`balance:${account.id}`], type: "credit" })}
                                  >
                                    + Credit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={balanceMutation.isPending || !accountAmounts[`balance:${account.id}`]}
                                    onClick={() => balanceMutation.mutate({ id: account.id, amount: accountAmounts[`balance:${account.id}`], type: "debit" })}
                                  >
                                    − Debit
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-slate-500">Set held amount</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Hold amount"
                                    value={accountAmounts[`hold:${account.id}`] ?? String(account.holdAmount || "0")}
                                    onChange={e => setAccountAmounts({ ...accountAmounts, [`hold:${account.id}`]: e.target.value })}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={holdMutation.isPending || accountAmounts[`hold:${account.id}`] === undefined}
                                    onClick={() => holdMutation.mutate({ id: account.id, amount: accountAmounts[`hold:${account.id}`] })}
                                  >
                                    Save hold
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Declarations */}
                        {app.declarations && (
                          <div className="bg-white rounded-xl border p-3">
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-2">Compliance declarations</p>
                            <div className="grid sm:grid-cols-2 gap-1">
                              {Object.entries(app.declarations).map(([k, v]) => (
                                <div key={k} className={`flex items-center gap-1.5 text-xs ${v ? "text-emerald-700" : "text-red-600"}`}>
                                  {v ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  {k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin notes (for rejection) */}
                        {app.status === "pending" && (
                          <div>
                            <Label className="text-sm mb-1 block">Admin notes (shown to user on rejection)</Label>
                            <Textarea
                              value={rejectNotes[app.id] || ""}
                              onChange={e => setRejectNotes({ ...rejectNotes, [app.id]: e.target.value })}
                              placeholder="Optional reason for rejection…"
                              rows={2}
                            />
                          </div>
                        )}

                        {app.adminNotes && (
                          <div className="bg-white rounded-xl border p-3">
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-1">Admin notes</p>
                            <p className="text-sm text-slate-700">{app.adminNotes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {app.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              onClick={() => reviewMutation.mutate({ id: app.id, status: "approved" })}
                              disabled={reviewMutation.isPending}
                              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check className="w-4 h-4" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => reviewMutation.mutate({ id: app.id, status: "rejected", adminNotes: rejectNotes[app.id] })}
                              disabled={reviewMutation.isPending}
                              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  );
}
