import AdminShell from "@/components/admin/admin-shell";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet, Search, Plus, Lock, Unlock, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, ChevronDown, ChevronRight, Globe, Settings, Loader2, Trash2, X
} from "lucide-react";

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', KES: '🇰🇪', UGX: '🇺🇬', GHS: '🇬🇭', NGN: '🇳🇬',
  ZAR: '🇿🇦', TZS: '🇹🇿', XOF: '🌍', CDF: '🇨🇩', XAF: '🌍',
  RWF: '🇷🇼', SLE: '🇸🇱', ZMW: '🇿🇲', EUR: '🇪🇺', GBP: '🇬🇧',
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', KES: 'Kenyan Shilling', UGX: 'Ugandan Shilling',
  GHS: 'Ghanaian Cedi', NGN: 'Nigerian Naira', ZAR: 'South African Rand',
  TZS: 'Tanzanian Shilling', XOF: 'West African CFA', CDF: 'Congolese Franc',
  XAF: 'Central African CFA', RWF: 'Rwandan Franc', SLE: 'Sierra Leonean Leone',
  ZMW: 'Zambian Kwacha', EUR: 'Euro', GBP: 'British Pound',
};

const ALL_CURRENCIES = Object.keys(CURRENCY_FLAGS);

interface WalletRecord {
  id: string;
  userId: string;
  currency: string;
  label: string | null;
  balance: string;
  holdAmount: string;
  isDefault: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspendReason: string | null;
  createdAt: string;
  user?: { fullName: string; email: string; phone: string };
}

export default function AdminWalletsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [suspendDialog, setSuspendDialog] = useState<{ walletId: string; currency: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [holdDialog, setHoldDialog] = useState<{ walletId: string; currency: string; currentHold: string } | null>(null);
  const [holdAmount, setHoldAmount] = useState("");
  const [balanceDialog, setBalanceDialog] = useState<{ walletId: string; currency: string } | null>(null);
  const [balanceAdjust, setBalanceAdjust] = useState("");
  const [balanceType, setBalanceType] = useState<"credit" | "debit">("credit");
  const [createDialog, setCreateDialog] = useState<string | null>(null);
  const [newCurrency, setNewCurrency] = useState("USD");
  const [settingsTab, setSettingsTab] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [nexusApiKey, setNexusApiKey] = useState("");
  const [fallbackRates, setFallbackRates] = useState<Record<string, string>>({});
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>([]);

  const { data: walletsData, isLoading } = useQuery<{ wallets: WalletRecord[]; grouped: Record<string, WalletRecord[]> }>({
    queryKey: ["/api/admin/wallets", search],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/admin/wallets?search=${encodeURIComponent(search)}`);
      return r.json();
    },
  });

  const { data: settingsData } = useQuery<{ defaultCurrency: string; enabledCurrencies: string[]; nexusApiKey: string; fallbackRates: Record<string, string> }>({
    queryKey: ["/api/admin/currencies/settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/currencies/settings");
      const d = await r.json();
      setDefaultCurrency(d.defaultCurrency || "USD");
      setNexusApiKey(d.nexusApiKey || "");
      setEnabledCurrencies(d.enabledCurrencies || []);
      setFallbackRates(d.fallbackRates || {});
      return d;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ walletId, reason }: { walletId: string; reason: string }) => {
      const r = await apiRequest("PUT", `/api/admin/wallets/${walletId}/suspend`, { reason });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet suspended" });
      setSuspendDialog(null);
      setSuspendReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const r = await apiRequest("PUT", `/api/admin/wallets/${walletId}/unsuspend`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet activated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const holdMutation = useMutation({
    mutationFn: async ({ walletId, amount }: { walletId: string; amount: number }) => {
      const r = await apiRequest("PUT", `/api/admin/wallets/${walletId}/hold`, { amount });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Hold updated" });
      setHoldDialog(null);
      setHoldAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const balanceMutation = useMutation({
    mutationFn: async ({ walletId, amount, type }: { walletId: string; amount: number; type: string }) => {
      const r = await apiRequest("PUT", `/api/admin/wallets/${walletId}/balance`, { amount, type });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Balance adjusted" });
      setBalanceDialog(null);
      setBalanceAdjust("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createWalletMutation = useMutation({
    mutationFn: async ({ userId, currency }: { userId: string; currency: string }) => {
      const r = await apiRequest("POST", `/api/admin/users/${userId}/wallets`, { currency });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet created" });
      setCreateDialog(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const r = await apiRequest("DELETE", `/api/admin/wallets/${walletId}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/currencies/settings", {
        defaultCurrency,
        enabledCurrencies,
        nexusApiKey,
        fallbackRates,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/currencies/settings"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const grouped = walletsData?.grouped || {};
  const userIds = Object.keys(grouped);

  const toggleCurrency = (code: string) => {
    setEnabledCurrencies(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  return (
    <AdminShell title="Wallet Management">
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Multi-Currency Wallets</h2>
            <p className="text-sm text-gray-500 mt-0.5">View and manage user wallets across all currencies</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={settingsTab ? "default" : "outline"}
              size="sm"
              onClick={() => setSettingsTab(!settingsTab)}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Settings
            </Button>
          </div>
        </div>

        {settingsTab && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              Currency & NexusPay Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency (Global)</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>
                        {CURRENCY_FLAGS[c]} {c} — {CURRENCY_NAMES[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">New users get this as their primary wallet</p>
              </div>

              <div className="space-y-2">
                <Label>NexusPay API Key</Label>
                <Input
                  type="password"
                  placeholder="npsk_..."
                  value={nexusApiKey}
                  onChange={e => setNexusApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">From your NexusPay dashboard → API Keys</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Enabled Currencies</Label>
              <p className="text-xs text-gray-500">Users can only have wallets for enabled currencies</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_CURRENCIES.map(code => (
                  <button
                    key={code}
                    onClick={() => toggleCurrency(code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      enabledCurrencies.includes(code)
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <span>{CURRENCY_FLAGS[code]}</span>
                    <span>{code}</span>
                    {enabledCurrencies.includes(code) && <X className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fallback Exchange Rates (USD base)</Label>
              <p className="text-xs text-gray-500">Used when no API key is configured. Format: 1 USD = X units.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {['KES', 'UGX', 'GHS', 'NGN', 'ZAR', 'TZS', 'XOF', 'CDF', 'XAF', 'RWF', 'SLE', 'ZMW', 'EUR', 'GBP'].map(code => (
                  <div key={code} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 w-8">{CURRENCY_FLAGS[code]}</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={code}
                      value={fallbackRates[code] || ""}
                      onChange={e => setFallbackRates(prev => ({ ...prev, [code]: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading wallets...</p>
            </div>
          ) : userIds.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No wallets found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userIds.map(userId => {
                const userWallets = grouped[userId] || [];
                const firstWallet = userWallets[0];
                const user = firstWallet?.user;
                const isExpanded = expandedUser === userId;
                const totalActive = userWallets.filter(w => w.isActive && !w.isSuspended).length;
                const hasSuspended = userWallets.some(w => w.isSuspended);

                return (
                  <div key={userId}>
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : userId)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 font-bold text-sm">
                          {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{user?.fullName || "Unknown"}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {userWallets.length} wallet{userWallets.length !== 1 ? "s" : ""}
                        </Badge>
                        {hasSuspended && (
                          <Badge className="text-xs bg-red-100 text-red-700 border-0">
                            <Lock className="w-2.5 h-2.5 mr-1" /> Suspended
                          </Badge>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setCreateDialog(userId); setNewCurrency("USD"); }}
                          className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-3">
                          {userWallets.map(wallet => {
                            const balance = parseFloat(wallet.balance || "0");
                            const hold = parseFloat(wallet.holdAmount || "0");
                            const available = balance - hold;

                            return (
                              <div key={wallet.id} className={`bg-white rounded-xl p-3 border ${wallet.isSuspended ? 'border-red-200' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{CURRENCY_FLAGS[wallet.currency] || '💰'}</span>
                                    <div>
                                      <p className="font-semibold text-sm">{wallet.currency}</p>
                                      <p className="text-[10px] text-gray-400">{CURRENCY_NAMES[wallet.currency]}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {wallet.isDefault && <Badge className="text-[9px] bg-green-100 text-green-700 border-0 px-1.5">Default</Badge>}
                                    {wallet.isSuspended && <Badge className="text-[9px] bg-red-100 text-red-700 border-0 px-1.5">Suspended</Badge>}
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <p className="text-xl font-bold text-gray-900">{parseFloat(wallet.balance || "0").toFixed(4)}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>Available: {available.toFixed(4)}</span>
                                    {hold > 0 && <span className="text-orange-600">Hold: {hold.toFixed(4)}</span>}
                                  </div>
                                </div>

                                {wallet.isSuspended && wallet.suspendReason && (
                                  <div className="bg-red-50 rounded-lg p-2 mb-2">
                                    <p className="text-[10px] text-red-600">Reason: {wallet.suspendReason}</p>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-1">
                                  {wallet.isSuspended ? (
                                    <button
                                      onClick={() => unsuspendMutation.mutate(wallet.id)}
                                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                    >
                                      <Unlock className="w-3 h-3" /> Activate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => { setSuspendDialog({ walletId: wallet.id, currency: wallet.currency }); setSuspendReason(""); }}
                                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                    >
                                      <Lock className="w-3 h-3" /> Suspend
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { setHoldDialog({ walletId: wallet.id, currency: wallet.currency, currentHold: wallet.holdAmount }); setHoldAmount(wallet.holdAmount || "0"); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                                  >
                                    <AlertTriangle className="w-3 h-3" /> Hold
                                  </button>
                                  <button
                                    onClick={() => { setBalanceDialog({ walletId: wallet.id, currency: wallet.currency }); setBalanceAdjust(""); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Adjust
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete ${wallet.currency} wallet? This cannot be undone if it has a balance.`))
                                        deleteWalletMutation.mutate(wallet.id);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!suspendDialog} onOpenChange={() => setSuspendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspendDialog?.currency} Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">The user will not be able to use this wallet until you activate it.</p>
            <div className="space-y-1">
              <Label>Reason (shown to user)</Label>
              <Textarea
                placeholder="e.g. Suspicious activity detected..."
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => suspendMutation.mutate({ walletId: suspendDialog!.walletId, reason: suspendReason })}
              disabled={suspendMutation.isPending || !suspendReason.trim()}
            >
              {suspendMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Suspend Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!holdDialog} onOpenChange={() => setHoldDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Hold Amount — {holdDialog?.currency}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Hold amount is deducted from available balance. Current hold: {holdDialog?.currentHold || "0"}</p>
            <div className="space-y-1">
              <Label>Hold Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={holdAmount}
                onChange={e => setHoldAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHoldDialog(null)}>Cancel</Button>
            <Button
              onClick={() => holdMutation.mutate({ walletId: holdDialog!.walletId, amount: parseFloat(holdAmount || "0") })}
              disabled={holdMutation.isPending}
            >
              {holdMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Set Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!balanceDialog} onOpenChange={() => setBalanceDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance — {balanceDialog?.currency}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={balanceType === "credit" ? "default" : "outline"}
                size="sm"
                onClick={() => setBalanceType("credit")}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-1" /> Credit
              </Button>
              <Button
                variant={balanceType === "debit" ? "default" : "outline"}
                size="sm"
                onClick={() => setBalanceType("debit")}
                className="flex-1"
              >
                <TrendingDown className="w-4 h-4 mr-1" /> Debit
              </Button>
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={balanceAdjust}
                onChange={e => setBalanceAdjust(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(null)}>Cancel</Button>
            <Button
              onClick={() => balanceMutation.mutate({ walletId: balanceDialog!.walletId, amount: parseFloat(balanceAdjust || "0"), type: balanceType })}
              disabled={balanceMutation.isPending || !balanceAdjust}
            >
              {balanceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createDialog} onOpenChange={() => setCreateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Wallet for User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Create a new currency wallet for this user.</p>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={newCurrency} onValueChange={setNewCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_FLAGS[c]} {c} — {CURRENCY_NAMES[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(null)}>Cancel</Button>
            <Button
              onClick={() => createWalletMutation.mutate({ userId: createDialog!, currency: newCurrency })}
              disabled={createWalletMutation.isPending}
            >
              {createWalletMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
