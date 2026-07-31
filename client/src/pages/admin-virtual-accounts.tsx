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
import { Building2, Check, X } from "lucide-react";

const fields = ["accountName","bankName","accountNumber","routingNumber","sortCode","iban","swiftCode","bankAddress","beneficiaryAddress","paymentInstructions"];

export default function AdminVirtualAccountsPage() {
  const { toast } = useToast(); const qc = useQueryClient(); const [currency, setCurrency] = useState("USD"); const [draft, setDraft] = useState<any>({});
  const { data } = useQuery({ queryKey: ["/api/admin/virtual-accounts"], queryFn: async () => (await apiRequest("GET", "/api/admin/virtual-accounts")).json() });
  const setting = (data?.settings || []).find((s: any) => s.currency === currency) || {};
  const applications = data?.applications || [];
  const save = useMutation({ mutationFn: async () => (await apiRequest("PUT", `/api/admin/virtual-accounts/settings/${currency}`, { ...setting, ...draft, isActive: true })).json(), onSuccess: () => { toast({ title: "Account details saved" }); setDraft({}); qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] }); } });
  const review = useMutation({ mutationFn: async ({ id, status }: any) => (await apiRequest("PATCH", `/api/admin/virtual-accounts/applications/${id}`, { status })).json(), onSuccess: () => { toast({ title: "Application updated" }); qc.invalidateQueries({ queryKey: ["/api/admin/virtual-accounts"] }); } });
  const get = (k: string) => draft[k] ?? setting[k] ?? "";
  return <AdminShell title="Virtual Accounts">
    <div className="max-w-6xl space-y-6">
      <div><h2 className="text-xl font-bold flex items-center gap-2"><Building2 className="text-green-600" /> Virtual USD, GBP & EUR Accounts</h2><p className="text-sm text-gray-500">Configure the shared beneficiary account details shown to approved users. Mailtrap template key: <code>virtual_account_approved</code>. Variables: first_name, last_name, currency, account_name, bank_name, account_number, routing_number, sort_code, iban, swift_code, bank_address, beneficiary_address, payment_instructions.</p></div>
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex gap-2">{["USD","GBP","EUR"].map(c => <Button key={c} variant={currency===c?"default":"outline"} onClick={() => { setCurrency(c); setDraft({}); }}>{c}</Button>)}</div>
        <div className="grid md:grid-cols-2 gap-3">{fields.map(f => <div key={f} className={f.includes("Address") || f.includes("Instructions") ? "md:col-span-2" : ""}><Label className="capitalize">{f.replace(/([A-Z])/g, " $1")}</Label>{f.includes("Address") || f.includes("Instructions") ? <Textarea value={get(f)} onChange={e => setDraft({ ...draft, [f]: e.target.value })} /> : <Input value={get(f)} onChange={e => setDraft({ ...draft, [f]: e.target.value })} />}</div>)}</div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save {currency} Details</Button>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden"><div className="p-4 border-b"><h3 className="font-semibold">Applications</h3></div><div className="divide-y">{applications.map((row: any) => { const a=row.application, u=row.user; return <div key={a.id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3"><div><div className="flex gap-2 items-center"><p className="font-semibold">{u?.fullName} — {a.currency}</p><Badge className="capitalize">{a.status}</Badge></div><p className="text-sm text-gray-500">{u?.email}</p><p className="text-sm mt-2">Income: {a.sourceOfIncome} · Volume: {a.monthlyVolume}</p><p className="text-sm text-gray-600">Purpose: {a.purpose}</p><pre className="text-xs bg-gray-50 rounded p-2 mt-2 overflow-auto">{JSON.stringify(a.declarations, null, 2)}</pre></div><div className="flex gap-2 items-start">{a.status === "pending" && <><Button size="sm" onClick={() => review.mutate({ id:a.id, status:"approved" })}><Check className="w-4 h-4 mr-1" /> Approve</Button><Button size="sm" variant="destructive" onClick={() => review.mutate({ id:a.id, status:"rejected" })}><X className="w-4 h-4 mr-1" /> Reject</Button></>}</div></div>})}{applications.length===0 && <p className="p-6 text-sm text-gray-500">No applications yet.</p>}</div></div>
    </div>
  </AdminShell>;
}
