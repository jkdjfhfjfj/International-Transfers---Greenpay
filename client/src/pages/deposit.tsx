import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatNumber } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";
import {
  Smartphone, Bitcoin, Building2, CreditCard, Copy, Check,
  ChevronRight, AlertCircle, CheckCircle2, Clock, Gift, ArrowLeft,
  RefreshCw, ExternalLink, Info, Loader2
} from "lucide-react";

type Method = "mpesa" | "crypto" | "bank_transfer" | "card" | null;

interface DepositConfig {
  methods: Record<string, string>;
  bonuses: Array<{
    id: string;
    method: string;
    minAmount: string;
    bonusAmount: string;
    bonusType: string;
    description: string | null;
    isActive: boolean;
  }>;
}

interface CryptoAddress {
  id: string;
  coin: string;
  network: string;
  networkLabel: string;
  address: string;
  memo?: string;
  minDeposit?: string;
  notes?: string;
}

const METHOD_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  mpesa: { label: "M-Pesa", icon: Smartphone, color: "from-green-500 to-emerald-600", description: "Instant via PayHero STK Push" },
  crypto: { label: "Cryptocurrency", icon: Bitcoin, color: "from-orange-500 to-yellow-500", description: "BTC, ETH, USDT, USDC & more" },
  bank_transfer: { label: "Bank Transfer", icon: Building2, color: "from-blue-500 to-indigo-600", description: "SWIFT / International wire" },
  card: { label: "Debit / Credit Card", icon: CreditCard, color: "from-purple-500 to-pink-600", description: "Visa, Mastercard via Paystack" },
};

const COIN_COLORS: Record<string, string> = { BTC: "from-orange-500 to-yellow-500", ETH: "from-purple-500 to-indigo-500", USDT: "from-green-500 to-teal-500", USDC: "from-blue-500 to-cyan-500" };
const COIN_ICONS: Record<string, string> = { BTC: "₿", ETH: "Ξ", USDT: "₮", USDC: "◎" };

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
      {label && <span className="text-xs text-primary font-medium">{copied ? "Copied" : label}</span>}
    </button>
  );
}

export default function DepositPage() {
  const [, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<Method>(null);
  const [amount, setAmount] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaRef, setMpesaRef] = useState<string | null>(null);
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => { refreshUser(); }, []);

  const { data: config, isLoading: configLoading } = useQuery<DepositConfig>({
    queryKey: ["/api/deposit/config"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/deposit/config"); return r.json(); },
    enabled: !!user?.id,
  });

  const { data: cryptoData } = useQuery({
    queryKey: ["/api/crypto/deposit-addresses"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/crypto/deposit-addresses"); return r.json(); },
    enabled: !!user?.id && selectedMethod === "crypto",
  });

  const methods = config?.methods || {};
  const isEnabled = (m: string) => methods[`${m}_enabled`] === "true";

  const enabledMethods = (["mpesa", "crypto", "bank_transfer", "card"] as const).filter(m => isEnabled(m));

  const mpesaMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/deposit/mpesa", { amount, phone: mpesaPhone });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || "Failed to initiate payment");
      return data;
    },
    onSuccess: (data) => {
      setMpesaRef(data.reference);
      setMpesaStatus("pending");
      toast({ title: "STK Push Sent", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "M-Pesa Error", description: err.message, variant: "destructive" });
    },
  });

  const pollStatus = useCallback(async () => {
    if (!mpesaRef) return;
    try {
      const r = await apiRequest("GET", `/api/deposit/mpesa/status/${mpesaRef}`);
      const data = await r.json();
      if (data.status === "completed") {
        setMpesaStatus("completed");
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        toast({ title: "Deposit Successful!", description: `$${amount} has been credited to your wallet.` });
      } else if (data.status === "failed") {
        setMpesaStatus("failed");
        toast({ title: "Payment Failed", description: "M-Pesa payment was declined or cancelled.", variant: "destructive" });
      }
    } catch (e) {}
  }, [mpesaRef, amount, refreshUser, queryClient, toast]);

  useEffect(() => {
    if (mpesaStatus !== "pending") return;
    const interval = setInterval(pollStatus, 5000);
    const timeout = setTimeout(() => { clearInterval(interval); if (mpesaStatus === "pending") setMpesaStatus("failed"); }, 120000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [mpesaStatus, pollStatus]);

  const allAddresses: CryptoAddress[] = (cryptoData as any)?.addresses || [];
  const addressesByCoin = allAddresses.reduce((acc: Record<string, CryptoAddress[]>, a) => {
    const c = (a.coin || "").toUpperCase();
    if (!acc[c]) acc[c] = [];
    acc[c].push(a);
    return acc;
  }, {});
  const selectedAddresses = addressesByCoin[selectedCoin] || [];

  const bonuses = config?.bonuses || [];
  const relevantBonuses = bonuses.filter(b => b.isActive && (b.method === (selectedMethod || "any") || b.method === "any"));

  const bankDetails = {
    name: methods.bank_name || "",
    accountName: methods.bank_account_name || "",
    accountNumber: methods.bank_account_number || "",
    swift: methods.bank_swift_code || "",
    branch: methods.bank_branch || "",
    currency: methods.bank_currency || "USD",
    routing: methods.bank_routing_number || "",
    additional: methods.bank_additional_info || "",
  };

  function resetMpesa() { setMpesaRef(null); setMpesaStatus("idle"); setAmount(""); setMpesaPhone(""); }

  if (configLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <WavyHeader size="sm" />
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <WavyHeader size="sm" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-4 text-white">
          <p className="text-xs text-white/70 mb-1">Available Balance</p>
          <p className="text-2xl font-bold" data-testid="text-current-balance">${formatNumber(parseFloat(user?.balance || "0"))}</p>
          {user?.accountNumber && (
            <p className="text-xs text-white/60 mt-1">Account: {user.accountNumber}</p>
          )}
        </motion.div>

        {/* Deposit Bonuses Banner */}
        {bonuses.filter(b => b.isActive).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Deposit Bonuses Active</p>
            </div>
            <div className="space-y-1.5">
              {bonuses.filter(b => b.isActive).map(b => {
                const methodLabel = METHOD_META[b.method]?.label || (b.method === "any" ? "any method" : b.method);
                const bonusDisplay = b.bonusType === "percentage" ? `${b.bonusAmount}%` : `$${parseFloat(b.bonusAmount).toFixed(2)}`;
                return (
                  <div key={b.id} className="flex items-center gap-2" data-testid={`bonus-item-${b.id}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {b.description || `Deposit $${parseFloat(b.minAmount).toFixed(0)}+ via ${methodLabel} → get ${bonusDisplay} instantly`}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Method selector */}
        {!selectedMethod && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-sm font-semibold text-muted-foreground mb-3">Available Deposit Methods</p>
            {enabledMethods.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No deposit methods configured yet.</p>
                <p className="text-xs mt-1">Please contact support.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(["mpesa", "crypto", "bank_transfer", "card"] as const).map(method => {
                  const meta = METHOD_META[method];
                  const enabled = isEnabled(method);
                  const Icon = meta.icon;
                  const methodBonuses = bonuses.filter(b => b.isActive && (b.method === method || b.method === "any"));
                  return (
                    <motion.button
                      key={method}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => enabled ? setSelectedMethod(method) : undefined}
                      disabled={!enabled}
                      data-testid={`method-card-${method}`}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        enabled
                          ? "border-border bg-card hover:border-primary/40 hover:shadow-md cursor-pointer"
                          : "border-border/40 bg-muted/30 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{meta.label}</p>
                          {!enabled && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Coming Soon</Badge>}
                          {methodBonuses.length > 0 && enabled && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0">
                              <Gift className="w-2.5 h-2.5 mr-0.5" /> Bonus
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                      </div>
                      {enabled && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* M-PESA FLOW */}
        <AnimatePresence>
          {selectedMethod === "mpesa" && (
            <motion.div key="mpesa" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => { setSelectedMethod(null); resetMpesa(); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to methods
              </button>

              {relevantBonuses.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex gap-2">
                  <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    {relevantBonuses.map(b => (
                      <p key={b.id} className="text-xs text-amber-700 dark:text-amber-300">
                        {b.description || `Deposit $${parseFloat(b.minAmount).toFixed(0)}+ → get ${b.bonusType === "percentage" ? `${b.bonusAmount}%` : `$${parseFloat(b.bonusAmount).toFixed(2)}`} bonus!`}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {mpesaStatus === "idle" && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">M-Pesa Deposit</p>
                      <p className="text-xs text-muted-foreground">STK Push via PayHero</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number" step="0.01" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00" className="pl-7 text-base"
                        data-testid="input-mpesa-amount"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Min. $5.00</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">M-Pesa Phone Number</label>
                    <Input
                      type="tel" value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)}
                      placeholder={user?.phone || "e.g. 0712345678 or +254712345678"}
                      data-testid="input-mpesa-phone"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to use your registered number</p>
                  </div>

                  <Button
                    onClick={() => mpesaMutation.mutate()}
                    disabled={mpesaMutation.isPending || !amount || parseFloat(amount) < 5}
                    className="w-full bg-green-600 hover:bg-green-500"
                    data-testid="button-send-stk-push"
                  >
                    {mpesaMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send STK Push"}
                  </Button>
                </div>
              )}

              {mpesaStatus === "pending" && (
                <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <Smartphone className="w-8 h-8 text-green-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold">Check Your Phone</p>
                    <p className="text-sm text-muted-foreground mt-1">Enter your M-Pesa PIN in the prompt to complete the ${amount} deposit.</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Waiting for confirmation...</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-sm" onClick={pollStatus} data-testid="button-check-status">
                      Check Now
                    </Button>
                    <Button variant="ghost" className="flex-1 text-sm text-destructive" onClick={resetMpesa} data-testid="button-cancel-mpesa">
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ref: <span className="font-mono">{mpesaRef}</span></p>
                </div>
              )}

              {mpesaStatus === "completed" && (
                <div className="bg-card border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Deposit Successful!</p>
                    <p className="text-sm text-muted-foreground mt-1">${amount} has been credited to your wallet.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
                    <Button variant="outline" className="flex-1" onClick={resetMpesa}>New Deposit</Button>
                  </div>
                </div>
              )}

              {mpesaStatus === "failed" && (
                <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <div>
                    <p className="font-semibold text-red-600">Payment Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">The M-Pesa payment was declined or timed out.</p>
                  </div>
                  <Button className="w-full" onClick={resetMpesa} data-testid="button-retry-mpesa">Try Again</Button>
                </div>
              )}
            </motion.div>
          )}

          {/* CRYPTO FLOW */}
          {selectedMethod === "crypto" && (
            <motion.div key="crypto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => setSelectedMethod(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to methods
              </button>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Send crypto to the address below. Your USD balance will be credited after blockchain confirmations. Only send the exact coin to its matching address.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Select Coin</p>
                  <div className="grid grid-cols-4 gap-2">
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => (
                      <button
                        key={coin}
                        onClick={() => setSelectedCoin(coin)}
                        data-testid={`coin-btn-${coin}`}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCoin === coin ? `bg-gradient-to-r ${COIN_COLORS[coin] || "from-gray-500 to-gray-600"} text-white shadow-md` : "bg-muted text-muted-foreground"}`}
                      >
                        {COIN_ICONS[coin] || coin}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => (
                      <p key={coin} className="text-center text-[10px] text-muted-foreground">{coin}</p>
                    ))}
                  </div>
                </div>

                {selectedAddresses.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">No {selectedCoin} addresses configured</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Contact support or try another coin.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAddresses.map(addr => (
                      <div key={addr.id} className="bg-muted rounded-xl p-3 space-y-2" data-testid={`crypto-addr-${addr.id}`}>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">{addr.networkLabel || addr.network}</span>
                          {addr.minDeposit && parseFloat(addr.minDeposit) > 0 && (
                            <span className="text-[10px] text-muted-foreground">Min: {addr.minDeposit} {selectedCoin}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs bg-background rounded p-2 flex-1 break-all">{addr.address}</p>
                          <CopyButton text={addr.address} />
                        </div>
                        {addr.memo && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-orange-600">Memo/Tag required:</span>
                            <span className="font-mono bg-background rounded px-2 py-1 flex-1">{addr.memo}</span>
                            <CopyButton text={addr.memo} />
                          </div>
                        )}
                        {addr.notes && <p className="text-[11px] text-muted-foreground italic">{addr.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Need to notify support of your deposit?</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setLocation("/live-chat")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" /> Contact Support
                </Button>
              </div>
            </motion.div>
          )}

          {/* BANK TRANSFER FLOW */}
          {selectedMethod === "bank_transfer" && (
            <motion.div key="bank" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => setSelectedMethod(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to methods
              </button>

              {bankDetails.name || bankDetails.accountNumber ? (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6" />
                      <div>
                        <p className="font-semibold text-sm">{bankDetails.name || "Bank Transfer"}</p>
                        <p className="text-xs text-white/70">Wire Transfer / SWIFT</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: "Bank Name", value: bankDetails.name },
                      { label: "Account Name", value: bankDetails.accountName },
                      { label: "Account Number", value: bankDetails.accountNumber },
                      { label: "SWIFT / BIC Code", value: bankDetails.swift },
                      { label: "Branch", value: bankDetails.branch },
                      { label: "Currency", value: bankDetails.currency },
                      { label: "Routing Number", value: bankDetails.routing },
                    ].filter(f => f.value).map(field => (
                      <div key={field.label} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground shrink-0">{field.label}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-sm font-medium truncate">{field.value}</span>
                          <CopyButton text={field.value} />
                        </div>
                      </div>
                    ))}
                    {bankDetails.additional && (
                      <div className="bg-muted rounded-xl p-3 mt-2">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Additional Instructions</p>
                        <p className="text-xs">{bankDetails.additional}</p>
                      </div>
                    )}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex gap-2 mt-2">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Use your account number <span className="font-bold">{user?.accountNumber || ""}</span> as payment reference. After transfer, contact support with your receipt.
                      </p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setLocation("/live-chat")}>
                      <ExternalLink className="w-3.5 h-3.5 mr-2" /> Notify Support of Transfer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-muted-foreground">Bank transfer details not configured yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Please contact support for wire transfer instructions.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setLocation("/live-chat")}>
                    Contact Support
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* CARD FLOW */}
          {selectedMethod === "card" && (
            <motion.div key="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => setSelectedMethod(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to methods
              </button>

              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Card Deposit</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard via Paystack</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number" step="0.01" value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00" className="pl-7 text-base"
                      data-testid="input-card-amount"
                    />
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    if (!amount || parseFloat(amount) < 10) {
                      toast({ title: "Minimum $10", description: "Enter at least $10 to deposit via card.", variant: "destructive" });
                      return;
                    }
                    try {
                      const r = await apiRequest("POST", "/api/deposit/initialize-payment", { amount, currency: "USD", paymentMethod: "card" });
                      const data = await r.json();
                      if (data.authorizationUrl) window.location.href = data.authorizationUrl;
                      else toast({ title: "Error", description: data.message || "Failed to initialize", variant: "destructive" });
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message || "Card payment error", variant: "destructive" });
                    }
                  }}
                  disabled={!amount || parseFloat(amount) < 10}
                  className="w-full"
                  data-testid="button-pay-with-card"
                >
                  Pay with Card
                </Button>

                <p className="text-xs text-center text-muted-foreground">You will be redirected to Paystack to complete payment securely.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction history shortcut */}
        {!selectedMethod && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => setLocation("/transactions")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
              data-testid="link-transaction-history"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">View Transaction History</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
