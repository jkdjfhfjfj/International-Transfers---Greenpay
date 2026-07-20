import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminShell from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, TrendingUp, Plus, Trash2, Edit2, RefreshCw, Check, X, DollarSign, Users } from "lucide-react";

const CURRENCY_META: Record<string, { name: string; flag: string; symbol: string }> = {
  USD: { name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  KES: { name: "Kenyan Shilling", flag: "🇰🇪", symbol: "KSh" },
  UGX: { name: "Ugandan Shilling", flag: "🇺🇬", symbol: "USh" },
  NGN: { name: "Nigerian Naira", flag: "🇳🇬", symbol: "₦" },
  GHS: { name: "Ghanaian Cedi", flag: "🇬🇭", symbol: "₵" },
  ZAR: { name: "South African Rand", flag: "🇿🇦", symbol: "R" },
  TZS: { name: "Tanzanian Shilling", flag: "🇹🇿", symbol: "TSh" },
  RWF: { name: "Rwandan Franc", flag: "🇷🇼", symbol: "RF" },
  XOF: { name: "West African CFA", flag: "🌍", symbol: "CFA" },
  XAF: { name: "Central African CFA", flag: "🌍", symbol: "FCFA" },
  ZMW: { name: "Zambian Kwacha", flag: "🇿🇲", symbol: "ZK" },
  CDF: { name: "Congolese Franc", flag: "🇨🇩", symbol: "FC" },
  SLE: { name: "Sierra Leonean Leone", flag: "🇸🇱", symbol: "Le" },
  ETB: { name: "Ethiopian Birr", flag: "🇪🇹", symbol: "Br" },
};

function CurrencyBadge({ currency }: { currency: string }) {
  const meta = CURRENCY_META[currency];
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm font-semibold">
      {meta?.flag || "🌐"} {currency}
      {meta && <span className="text-xs text-muted-foreground font-normal">({meta.symbol})</span>}
    </span>
  );
}

function WalletTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustVal, setAdjustVal] = useState("");
  const [adjustOp, setAdjustOp] = useState<"set" | "add" | "subtract">("set");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/wallets"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/admin/wallets"); return r.json(); },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ id, balance, userId, currency }: any) => {
      const r = await apiRequest("PUT", `/api/admin/wallets/${id}`, { balance, userId, currency, operation: adjustOp });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Balance Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
      setAdjustId(null);
      setAdjustVal("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const wallets: any[] = (data?.wallets || []).filter((w: any) =>
    !search || w.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    w.userName?.toLowerCase().includes(search.toLowerCase()) ||
    w.currency?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = wallets.reduce((acc: Record<string, any[]>, w: any) => {
    const key = w.userEmail || w.userId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Search by user or currency…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <span className="text-sm text-muted-foreground">{wallets.length} wallet(s)</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading wallets…</div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No multi-currency wallets yet. Users create them when they deposit in a new currency.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([email, userWallets]) => (
            <div key={email} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{(userWallets[0] as any).userName || "—"}</span>
                <span className="text-xs text-muted-foreground">{email}</span>
              </div>
              <div className="divide-y divide-border">
                {(userWallets as any[]).map((w: any) => (
                  <div key={w.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1">
                      <CurrencyBadge currency={w.currency} />
                    </div>
                    <div className="font-mono font-semibold text-sm">
                      {parseFloat(w.balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    {w.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}

                    {adjustId === w.id ? (
                      <div className="flex items-center gap-2">
                        <select value={adjustOp} onChange={e => setAdjustOp(e.target.value as any)}
                          className="text-xs border border-border rounded px-2 py-1 bg-background">
                          <option value="set">Set to</option>
                          <option value="add">Add</option>
                          <option value="subtract">Subtract</option>
                        </select>
                        <Input value={adjustVal} onChange={e => setAdjustVal(e.target.value)} placeholder="Amount" className="w-28 h-8 text-sm" />
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600"
                          onClick={() => adjustMutation.mutate({ id: w.id, balance: adjustVal, userId: w.userId, currency: w.currency })}
                          disabled={!adjustVal || adjustMutation.isPending}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => setAdjustId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                        onClick={() => { setAdjustId(w.id); setAdjustVal(w.balance || "0"); setAdjustOp("set"); }}>
                        <Edit2 className="w-3 h-3" /> Adjust
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RatesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newFrom, setNewFrom] = useState("USD");
  const [newTo, setNewTo] = useState("KES");
  const [newRate, setNewRate] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/currency-rates"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/admin/currency-rates"); return r.json(); },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/currency-rates", {
        fromCurrency: newFrom.toUpperCase(),
        toCurrency: newTo.toUpperCase(),
        rate: parseFloat(newRate),
        isManual: true,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Rate saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/currency-rates"] });
      setNewRate("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async (rate: any) => {
      const r = await apiRequest("POST", "/api/admin/currency-rates", {
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: parseFloat(editRate),
        isManual: true,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Rate updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/currency-rates"] });
      setEditId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/currency-rates/${id}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Rate deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/currency-rates"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rates: any[] = data?.rates || [];
  const currencies = Object.keys(CURRENCY_META);

  return (
    <div className="space-y-6">
      {/* Add rate */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Add / Override Rate
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From</label>
            <select value={newFrom} onChange={e => setNewFrom(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background min-w-[100px]">
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <select value={newTo} onChange={e => setNewTo(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background min-w-[100px]">
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Rate (1 {newFrom} = ? {newTo})</label>
            <Input value={newRate} onChange={e => setNewRate(e.target.value)} placeholder="e.g. 129.5" className="w-40" type="number" step="any" />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!newRate || !newFrom || !newTo || addMutation.isPending} className="gap-1">
            <Plus className="w-4 h-4" /> Save Rate
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Manual rates override live exchange rates for all user exchanges.</p>
      </div>

      {/* Rates list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading rates…</div>
      ) : rates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No rates configured yet. Add one above or they will be fetched live.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pair</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Rate</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Source</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rates.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold">
                    {r.fromCurrency} → {r.toCurrency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === r.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Input value={editRate} onChange={e => setEditRate(e.target.value)} className="w-32 h-7 text-sm text-right" type="number" step="any" />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600"
                          onClick={() => editMutation.mutate(r)} disabled={!editRate || editMutation.isPending}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setEditId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-mono">{parseFloat(r.rate).toFixed(6)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={r.isManual ? "default" : "outline"} className="text-xs">
                      {r.isManual ? "Manual" : "Live"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}
                    {r.updatedBy && <span className="ml-1">by {r.updatedBy}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditId(r.id); setEditRate(r.rate); }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                        onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminWalletRatesPage() {
  const [tab, setTab] = useState<"wallets" | "rates">("wallets");

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Wallets & Exchange Rates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user multi-currency wallets and override exchange rates.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
          {([
            { id: "wallets", label: "User Wallets", icon: Wallet },
            { id: "rates", label: "Exchange Rates", icon: TrendingUp },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "wallets" ? <WalletTab /> : <RatesTab />}
      </div>
    </AdminShell>
  );
}
