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
import { AlertCircle, Building2, Check, Save, X } from "lucide-react";

const fields = ["accountName","bankName","accountNumber","routingNumber","sortCode","iban","swiftCode","bankAddress","beneficiaryAddress","paymentInstructions"];

export default function AdminVirtualAccountsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [currency, setCurrency] = useState("USD");
  const [draft, setDraft] = useState<any>({});
  const [saveError, setSaveError] = useState("");

  const { data } = useQuery({ queryKey: ["/api/admin/virtual-accounts"], queryFn: async () => (await apiRequest("GET", "/api/admin/virtual-accounts")).json() });
  const setting = (data?.settings || []).find((s: any) => s.currency === currency) || {};
  const applications = data?.applications || [];

  const get = (k: string) => draft[k] ?? setting[k] ?? "";

  const save = useMutation({
    mutationFn: async () => {
      const payload = Object.fromEntries(fields.map(field => [field, get(field)]));
      return (await apiRequest("PUT", `/api/admin/virtual-accounts/settings/${currency}`, { ...payload, isActive: true })).json();
    },
    onSuccess: () => {
      setSaveError("");
      toast({ title: "Account details saved" });
      setDraft({});
      qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] });
    },
    onError: (e: any) => {
      const raw = e?.message || "Failed to save account details";
      let friendly = raw;
      try { friendly = JSON.parse(raw.replace(/^\d+:\s*/, "")).message || friendly; } catch {}
      setSaveError(friendly);
      toast({ title: "Save failed", description: friendly, variant: "destructive" });
    }
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: any) => (await apiRequest("PATCH", `/api/admin/virtual-accounts/applications/${id}`, { status })).json(),
    onSuccess: () => { toast({ title: "Application updated" }); qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] }); }
  });

  return <AdminShell title="Virtual Accounts">
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="text-green-600" /> Virtual USD, GBP & EUR Accounts</h2>
        <p className="text-sm text-gray-500">Configure the bank details sent to approved users for each supported currency.</p>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {["USD","GBP","EUR"].map(c => <Button key={c} variant={currency===c?"default":"outline"} onClick={() => { setCurrency(c); setDraft({}); setSaveError(""); }}>{c}</Button>)}
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isLoading} className="gap-2"><Save className="w-4 h-4" /> {save.isLoading ? "Saving..." : `Save ${currency} Details`}</Button>
        </div>

        {saveError && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{saveError}</span></div>}

        <div className="grid md:grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f} className={f.includes("Address") || f.includes("Instructions") ? "md:col-span-2" : ""}>
              <Label className="capitalize">{f.replace(/([A-Z])/g, ' $1')}</Label>
              {f.includes("Address") || f.includes("Instructions") ? (
                <Textarea value={get(f)} onChange={(e: any) => setDraft({ ...draft, [f]: e.target.value })} />
              ) : (
                <Input value={get(f)} onChange={(e: any) => setDraft({ ...draft, [f]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Applications</h3></div>
        <div className="divide-y">
          {applications.map((app: any) => (
            <div key={app.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{app.walletAddress ?? app.id}</div>
                <div className="text-sm text-slate-500">{app.currency} — {app.status}</div>
              </div>
              <div className="flex items-center gap-2">
                {app.status !== 'approved' && <Button onClick={() => review.mutate({ id: app.id, status: 'approved' })} className="gap-2"><Check /> Approve</Button>}
                {app.status !== 'rejected' && <Button variant="outline" onClick={() => review.mutate({ id: app.id, status: 'rejected' })} className="gap-2"><X /> Reject</Button>}
              </div>
            </div>
          ))}
          {applications.length === 0 && <div className="p-4 text-sm text-slate-500">No applications found.</div>}
        </div>
      </div>
    </div>
  </AdminShell>;
}
