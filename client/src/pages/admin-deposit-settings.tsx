import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Save, Smartphone, Bitcoin, Building2, CreditCard, Gift,
  Plus, Trash2, Edit2, Check, X, Info, ToggleLeft, ToggleRight
} from "lucide-react";

interface DepositMethods {
  mpesa_enabled: string;
  crypto_enabled: string;
  bank_transfer_enabled: string;
  card_enabled: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_swift_code: string;
  bank_branch: string;
  bank_currency: string;
  bank_routing_number: string;
  bank_additional_info: string;
}

interface DepositBonus {
  id: string;
  method: string;
  minAmount: string;
  bonusAmount: string;
  bonusType: string;
  description: string | null;
  isActive: boolean;
}

const METHOD_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  crypto: "Cryptocurrency",
  bank_transfer: "Bank Transfer",
  card: "Card (Paystack)",
  any: "Any Method",
};

const DEFAULT_METHODS: DepositMethods = {
  mpesa_enabled: "false",
  crypto_enabled: "false",
  bank_transfer_enabled: "false",
  card_enabled: "false",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_swift_code: "",
  bank_branch: "",
  bank_currency: "USD",
  bank_routing_number: "",
  bank_additional_info: "",
};

function BonusRow({ bonus, onEdit, onDelete, onToggle }: {
  bonus: DepositBonus;
  onEdit: (b: DepositBonus) => void;
  onDelete: (id: string) => void;
  onToggle: (b: DepositBonus) => void;
}) {
  const bonusDisplay = bonus.bonusType === "percentage"
    ? `${parseFloat(bonus.bonusAmount).toFixed(1)}%`
    : `$${parseFloat(bonus.bonusAmount).toFixed(2)}`;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${bonus.isActive ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-border bg-muted/30"}`} data-testid={`bonus-row-${bonus.id}`}>
      <Gift className={`w-4 h-4 mt-0.5 shrink-0 ${bonus.isActive ? "text-green-600" : "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{METHOD_LABELS[bonus.method] || bonus.method}</Badge>
          <span className="text-xs text-muted-foreground">min ${parseFloat(bonus.minAmount).toFixed(2)}</span>
          <span className="text-xs font-bold text-green-700 dark:text-green-400">+{bonusDisplay}</span>
          {!bonus.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
        </div>
        {bonus.description && <p className="text-xs text-muted-foreground mt-1 truncate">{bonus.description}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onToggle(bonus)} className="p-1.5 rounded-lg hover:bg-background transition-colors" title={bonus.isActive ? "Deactivate" : "Activate"}>
          {bonus.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button onClick={() => onEdit(bonus)} className="p-1.5 rounded-lg hover:bg-background transition-colors">
          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => onDelete(bonus.id)} className="p-1.5 rounded-lg hover:bg-background transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );
}

export default function AdminDepositSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [methods, setMethods] = useState<DepositMethods>(DEFAULT_METHODS);
  const [editingBonus, setEditingBonus] = useState<Partial<DepositBonus> | null>(null);
  const [showBonusForm, setShowBonusForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/deposit-settings"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/admin/deposit-settings");
      return r.json();
    },
  });

  useEffect(() => {
    if (data?.methods) {
      setMethods({ ...DEFAULT_METHODS, ...data.methods });
    }
  }, [data]);

  const methodsMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PUT", "/api/admin/deposit-settings", { methods });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Deposit settings updated." });
      qc.invalidateQueries({ queryKey: ["/api/admin/deposit-settings"] });
      qc.invalidateQueries({ queryKey: ["/api/deposit/config"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const bonuses: DepositBonus[] = data?.bonuses || [];

  const createBonusMutation = useMutation({
    mutationFn: async (b: Partial<DepositBonus>) => {
      const r = await apiRequest("POST", "/api/admin/deposit-bonuses", b);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Bonus created" });
      qc.invalidateQueries({ queryKey: ["/api/admin/deposit-settings"] });
      setShowBonusForm(false);
      setEditingBonus(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to create bonus.", variant: "destructive" }),
  });

  const updateBonusMutation = useMutation({
    mutationFn: async (b: DepositBonus) => {
      const r = await apiRequest("PUT", `/api/admin/deposit-bonuses/${b.id}`, b);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Bonus updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/deposit-settings"] });
      setShowBonusForm(false);
      setEditingBonus(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to update bonus.", variant: "destructive" }),
  });

  const deleteBonusMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/deposit-bonuses/${id}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Bonus deleted" });
      qc.invalidateQueries({ queryKey: ["/api/admin/deposit-settings"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const toggleMethod = (key: keyof DepositMethods) => {
    setMethods(prev => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }));
  };

  const startNewBonus = () => {
    setEditingBonus({ method: "mpesa", minAmount: "0", bonusAmount: "0", bonusType: "fixed", description: "", isActive: true });
    setShowBonusForm(true);
  };

  const startEditBonus = (b: DepositBonus) => {
    setEditingBonus({ ...b });
    setShowBonusForm(true);
  };

  const saveBonus = () => {
    if (!editingBonus) return;
    if (editingBonus.id) {
      updateBonusMutation.mutate(editingBonus as DepositBonus);
    } else {
      createBonusMutation.mutate(editingBonus);
    }
  };

  const isBonusPending = createBonusMutation.isPending || updateBonusMutation.isPending;

  if (isLoading) {
    return (
      <AdminShell title="Deposit Settings">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-200 animate-pulse" />)}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Deposit Settings">
      <div className="max-w-3xl space-y-6">
        <Tabs defaultValue="methods" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
            <TabsTrigger value="methods" data-testid="tab-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="bank" data-testid="tab-bank">Bank Details</TabsTrigger>
            <TabsTrigger value="bonuses" data-testid="tab-bonuses">Deposit Bonuses</TabsTrigger>
          </TabsList>

          {/* ── Methods Tab ── */}
          <TabsContent value="methods" className="mt-6 space-y-4">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Enable / Disable Payment Methods</CardTitle>
                <CardDescription>Toggle which deposit methods are shown to users. Disabled methods show a "Coming Soon" badge.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "mpesa_enabled" as const, label: "M-Pesa (PayHero STK Push)", icon: Smartphone, desc: "Instant KES deposit with M-Pesa PIN prompt", color: "text-green-600" },
                  { key: "crypto_enabled" as const, label: "Cryptocurrency", icon: Bitcoin, desc: "BTC, ETH, USDT, USDC — admin-configured addresses", color: "text-orange-500" },
                  { key: "bank_transfer_enabled" as const, label: "Bank Transfer (SWIFT)", icon: Building2, desc: "International wire transfer with bank details", color: "text-blue-600" },
                  { key: "card_enabled" as const, label: "Debit / Credit Card (Paystack)", icon: CreditCard, desc: "Visa & Mastercard via Paystack gateway", color: "text-purple-600" },
                ].map(({ key, label, icon: Icon, desc, color }) => (
                  <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={methods[key] === "true" ? "default" : "secondary"} className="text-xs">
                        {methods[key] === "true" ? "Enabled" : "Disabled"}
                      </Badge>
                      <Switch
                        checked={methods[key] === "true"}
                        onCheckedChange={() => toggleMethod(key)}
                        data-testid={`toggle-${key}`}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">Changes take effect immediately for all users after saving.</p>
                </div>

                <Button onClick={() => methodsMutation.mutate()} disabled={methodsMutation.isPending} className="w-full rounded-xl bg-green-600 hover:bg-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  {methodsMutation.isPending ? "Saving..." : "Save Method Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Bank Details Tab ── */}
          <TabsContent value="bank" className="mt-6 space-y-4">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Bank Transfer Details</CardTitle>
                <CardDescription>These details are displayed to users when they select Bank Transfer. All fields are optional — only filled fields are shown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "bank_name" as const, label: "Bank Name", placeholder: "e.g. NCBA Bank Kenya" },
                  { key: "bank_account_name" as const, label: "Account Name", placeholder: "e.g. GreenPay Limited" },
                  { key: "bank_account_number" as const, label: "Account Number / IBAN", placeholder: "e.g. 1234567890" },
                  { key: "bank_swift_code" as const, label: "SWIFT / BIC Code", placeholder: "e.g. NCBAKENA" },
                  { key: "bank_branch" as const, label: "Branch", placeholder: "e.g. Westlands Branch" },
                  { key: "bank_currency" as const, label: "Currency", placeholder: "e.g. USD or KES" },
                  { key: "bank_routing_number" as const, label: "Routing / Sort Code (optional)", placeholder: "e.g. 021000021" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={methods[key]}
                      onChange={e => setMethods(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      data-testid={`input-${key}`}
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label htmlFor="bank_additional_info">Additional Instructions (optional)</Label>
                  <textarea
                    id="bank_additional_info"
                    value={methods.bank_additional_info}
                    onChange={e => setMethods(prev => ({ ...prev, bank_additional_info: e.target.value }))}
                    placeholder="e.g. Include your GreenPay account number as payment reference. Transfers may take 1-3 business days."
                    rows={3}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="input-bank_additional_info"
                  />
                </div>

                <Button onClick={() => methodsMutation.mutate()} disabled={methodsMutation.isPending} className="w-full rounded-xl bg-green-600 hover:bg-green-500">
                  <Save className="w-4 h-4 mr-2" />
                  {methodsMutation.isPending ? "Saving..." : "Save Bank Details"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Bonuses Tab ── */}
          <TabsContent value="bonuses" className="mt-6 space-y-4">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500" /> Deposit Bonuses</CardTitle>
                    <CardDescription className="mt-1">Create incentives for users to deposit. Bonuses are automatically credited when conditions are met.</CardDescription>
                  </div>
                  <Button onClick={startNewBonus} size="sm" className="rounded-xl bg-green-600 hover:bg-green-500 shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Add Bonus
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bonuses.length === 0 && !showBonusForm && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No deposit bonuses configured yet.</p>
                    <p className="text-xs mt-1">Click "Add Bonus" to create your first offer.</p>
                  </div>
                )}

                {bonuses.map(bonus => (
                  <BonusRow
                    key={bonus.id}
                    bonus={bonus}
                    onEdit={startEditBonus}
                    onDelete={id => deleteBonusMutation.mutate(id)}
                    onToggle={b => updateBonusMutation.mutate({ ...b, isActive: !b.isActive })}
                  />
                ))}

                {/* Bonus form */}
                {showBonusForm && editingBonus && (
                  <div className="border-2 border-primary/20 rounded-xl p-4 space-y-3 bg-primary/5">
                    <p className="text-sm font-semibold">{editingBonus.id ? "Edit Bonus" : "New Bonus"}</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Method</Label>
                        <Select
                          value={editingBonus.method || "mpesa"}
                          onValueChange={v => setEditingBonus(prev => ({ ...prev, method: v }))}
                        >
                          <SelectTrigger className="rounded-lg" data-testid="select-bonus-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mpesa">M-Pesa</SelectItem>
                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="any">Any Method</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Bonus Type</Label>
                        <Select
                          value={editingBonus.bonusType || "fixed"}
                          onValueChange={v => setEditingBonus(prev => ({ ...prev, bonusType: v }))}
                        >
                          <SelectTrigger className="rounded-lg" data-testid="select-bonus-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed ($)</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Min Deposit (USD)</Label>
                        <Input
                          type="number" step="1" min="0"
                          value={editingBonus.minAmount || ""}
                          onChange={e => setEditingBonus(prev => ({ ...prev, minAmount: e.target.value }))}
                          placeholder="e.g. 100"
                          className="rounded-lg"
                          data-testid="input-bonus-min"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{editingBonus.bonusType === "percentage" ? "Bonus %" : "Bonus Amount ($)"}</Label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={editingBonus.bonusAmount || ""}
                          onChange={e => setEditingBonus(prev => ({ ...prev, bonusAmount: e.target.value }))}
                          placeholder={editingBonus.bonusType === "percentage" ? "e.g. 10" : "e.g. 10.00"}
                          className="rounded-lg"
                          data-testid="input-bonus-amount"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Description (shown to users)</Label>
                      <Input
                        value={editingBonus.description || ""}
                        onChange={e => setEditingBonus(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={`e.g. Deposit $${editingBonus.minAmount || "100"}+ via ${METHOD_LABELS[editingBonus.method || "mpesa"]} and receive $${editingBonus.bonusAmount || "10"} instantly`}
                        className="rounded-lg"
                        data-testid="input-bonus-description"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingBonus.isActive !== false}
                        onCheckedChange={v => setEditingBonus(prev => ({ ...prev, isActive: v }))}
                        data-testid="toggle-bonus-active"
                      />
                      <Label className="text-xs">Active (visible to users immediately)</Label>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button onClick={saveBonus} disabled={isBonusPending} size="sm" className="flex-1 rounded-lg bg-green-600 hover:bg-green-500" data-testid="button-save-bonus">
                        <Check className="w-3.5 h-3.5 mr-1" />
                        {isBonusPending ? "Saving..." : (editingBonus.id ? "Update" : "Create")}
                      </Button>
                      <Button onClick={() => { setShowBonusForm(false); setEditingBonus(null); }} variant="outline" size="sm" className="flex-1 rounded-lg" data-testid="button-cancel-bonus">
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Bonuses are applied automatically when a deposit is confirmed. Only the first matching bonus is applied per deposit. M-Pesa bonuses trigger via PayHero callback.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
