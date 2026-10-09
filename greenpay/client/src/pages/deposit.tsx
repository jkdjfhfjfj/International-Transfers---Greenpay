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
import { formatNumber, getCurrencySymbol } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";
import {
  Smartphone, Bitcoin, Building2, CreditCard, Copy, Check,
  ChevronRight, AlertCircle, CheckCircle2, Clock, Gift, ArrowLeft,
  RefreshCw, ExternalLink, Info, Loader2, Globe
} from "lucide-react";
import { useWallets, useNexusDeposit } from "@/hooks/use-wallets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { depositBonusMatchesMethod } from "@shared/deposit-bonus-methods";

type Method = "mpesa" | "manual_mpesa" | "crypto" | "bank_transfer" | "card" | "nexuspay" | null;

interface DepositConfig {
  methods: Record<string, string>;
  usdToKesRate?: number | null;
  usdToPaymentCurrencyRate?: number | null;
  country?: string;
  isKenya?: boolean;
  countryPaymentCurrency?: string | null;
  paymentReadiness?: {
    mobileMoney?: boolean;
    hostedCheckout?: boolean;
    card?: boolean;
  };
  manualMpesa?: {
    enabled: boolean;
    paybill?: string;
    account?: string;
  };
  providerCurrencies?: Array<{
    code: string;
    providerCode?: string;
    name: string;
    countryOrRegion: string;
    provider: string;
  }>;
  currencyAvailabilityNote?: string;
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
  qrCodeUrl?: string;
  memo?: string;
  minDeposit?: string;
  notes?: string;
}

const METHOD_META: Record<string, { label: string; icon: any; color: string; description: string }> = {
  mpesa: { label: "Mobile money", icon: Smartphone, color: "from-green-500 to-emerald-600", description: "Receive a payment prompt on your phone" },
  manual_mpesa: { label: "Manual M-Pesa", icon: Smartphone, color: "from-emerald-600 to-green-700", description: "Pay to the configured paybill and submit your M-Pesa reference" },
  crypto: { label: "Cryptocurrency", icon: Bitcoin, color: "from-orange-500 to-yellow-500", description: "BTC, ETH, USDT, USDC & more" },
  bank_transfer: { label: "Bank Transfer", icon: Building2, color: "from-blue-500 to-indigo-600", description: "SWIFT / International wire" },
  card: { label: "Debit / Credit Card", icon: CreditCard, color: "from-blue-500 to-cyan-600", description: "Visa and Mastercard" },
  nexuspay: { label: "Local checkout", icon: Globe, color: "from-purple-500 to-violet-600", description: "Pay in the currency available for your country" },
};

const NEXUS_CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', KES: '🇰🇪', UGX: '🇺🇬', GHS: '🇬🇭', NGN: '🇳🇬', MWK: '🇲🇼',
  ZAR: '🇿🇦', TZS: '🇹🇿', XOF: '🌍', CDF: '🇨🇩', XAF: '🌍',
  RWF: '🇷🇼', SLE: '🇸🇱', ZMW: '🇿🇲', MZN: '🇲🇿', EUR: '🇪🇺', GBP: '🇬🇧',
};

const COIN_COLORS: Record<string, string> = { BTC: "from-orange-500 to-yellow-500", ETH: "from-blue-500 to-indigo-500", USDT: "from-green-500 to-teal-500", USDC: "from-blue-500 to-cyan-500" };
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
  const [mpesaCreditedAmount, setMpesaCreditedAmount] = useState<string | null>(null);
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [manualPaymentReference, setManualPaymentReference] = useState("");
  const [manualDepositSubmitted, setManualDepositSubmitted] = useState(false);
  const [manualDepositTransactionReference, setManualDepositTransactionReference] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [nexusWalletId, setNexusWalletId] = useState<string | null>(null);
  const [nexusCurrency, setNexusCurrency] = useState("KES");
  const [paymentCurrency, setPaymentCurrency] = useState("KES");
  const [nexusRef, setNexusRef] = useState<string | null>(null);
  const [nexusStatus, setNexusStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { wallets: userWallets } = useWallets();
  const { initiate: initiateNexus, isInitiating: nexusInitiating, pollStatus: pollNexusStatus } = useNexusDeposit();
  const displayWallet = userWallets.find(w => w.id === nexusWalletId) || null;

  useEffect(() => { refreshUser(); }, []);


  const { data: config, isLoading: configLoading } = useQuery<DepositConfig>({
    queryKey: ["/api/deposit/config"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/deposit/config"); return r.json(); },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });
  const providerCurrencies = config?.providerCurrencies || [];

  const { data: cryptoData, isLoading: cryptoAddressesLoading } = useQuery({
    queryKey: ["/api/crypto/deposit-addresses"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/crypto/deposit-addresses"); return r.json(); },
    enabled: !!user?.id,
  });
  const allAddresses: CryptoAddress[] = (cryptoData as any)?.addresses || [];
  const availableCryptoCoins = Array.from(new Set(
    allAddresses
      .filter(address => String(address.address || "").trim())
      .map(address => String(address.coin || "").toUpperCase())
      .filter(Boolean),
  ));

  const methods = config?.methods || {};
  const isEnabled = (m: string) => {
    const value = methods[`${m}_enabled`];
    return String(value).replace(/['"]/g, "").toLowerCase() === "true";
  };
  const depositsEnabled = isEnabled("global");
  const usdToPaymentCurrencyRate = Number(config?.usdToPaymentCurrencyRate);
  const hasUsdToPaymentCurrencyRate = Number.isFinite(usdToPaymentCurrencyRate) && usdToPaymentCurrencyRate > 0;
  const minimumCardDeposit = hasUsdToPaymentCurrencyRate ? Math.ceil(10 * usdToPaymentCurrencyRate) : 0;
  const bankTransferConfigured = ["bank_name", "bank_account_name", "bank_account_number"]
    .every(key => String(methods[key] || "").trim().length > 0);
  const enabledMethods: Exclude<Method, null>[] = [];
  if (depositsEnabled) {
    if (config?.countryPaymentCurrency && isEnabled("mpesa") && config.paymentReadiness?.mobileMoney === true) {
      enabledMethods.push("mpesa");
    }
    if (
      config?.isKenya &&
      config.manualMpesa?.enabled === true &&
      displayWallet?.currency?.toUpperCase() === "KES"
    ) enabledMethods.push("manual_mpesa");
    if (
      config?.countryPaymentCurrency &&
      isEnabled("card") &&
      config.paymentReadiness?.card === true &&
      hasUsdToPaymentCurrencyRate
    ) enabledMethods.push("card");
    if (isEnabled("crypto") && availableCryptoCoins.length > 0) enabledMethods.push("crypto");
    if (isEnabled("bank_transfer") && bankTransferConfigured) enabledMethods.push("bank_transfer");
  }
  // Wallet deposits are controlled by the same master switch enforced by the server.
  const mpesaMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/deposit/nexuspay", {
        walletId: nexusWalletId,
        currency: nexusCurrency,
        paymentCurrency,
        paymentMethod: "mobile_money",
        amount,
        phone: mpesaPhone,
        email: user?.email,
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || "Failed to initiate payment");
      return data;
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setMpesaRef(data.reference);
      setMpesaCreditedAmount(String(data.amount || ""));
      setMpesaStatus("pending");
      toast({ title: "Payment prompt sent", description: data.message });
    },
    onError: (err: any) => {
      toast({ title: "Mobile-money payment error", description: err.message, variant: "destructive" });
    },
  });

  const manualMpesaMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/deposit/manual-mpesa", {
        walletId: nexusWalletId,
        amount,
        paymentReference: manualPaymentReference,
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || "Unable to submit your manual M-Pesa deposit");
      return data;
    },
    onSuccess: (data) => {
      setManualDepositSubmitted(true);
      setManualDepositTransactionReference(String(data.transactionReference || ""));
      setManualPaymentReference("");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Deposit submitted for review",
        description: `Reference ${data.transactionReference || data.paymentReference} is pending verification.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Manual M-Pesa deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const pollStatus = useCallback(async () => {
    if (!mpesaRef) return;
    try {
      const r = await apiRequest("GET", `/api/deposit/nexuspay/status/${mpesaRef}`);
      const data = await r.json();
      if (data.status === "completed") {
        setMpesaStatus("completed");
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        toast({ title: "Deposit Successful!", description: `${getCurrencySymbol(displayWallet?.currency || "USD")} ${mpesaCreditedAmount || amount} has been credited to your wallet.` });
      } else if (data.status === "failed") {
        setMpesaStatus("failed");
        toast({ title: "Payment Failed", description: "The mobile-money payment was declined or cancelled.", variant: "destructive" });
      }
    } catch (e) {}
  }, [mpesaRef, amount, mpesaCreditedAmount, displayWallet?.currency, refreshUser, queryClient, toast]);

  useEffect(() => {
    if (mpesaStatus !== "pending") return;
    const interval = setInterval(pollStatus, 5000);
    const timeout = setTimeout(() => { clearInterval(interval); if (mpesaStatus === "pending") setMpesaStatus("failed"); }, 120000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [mpesaStatus, pollStatus]);

  const addressesByCoin = allAddresses.reduce((acc: Record<string, CryptoAddress[]>, a) => {
    const c = (a.coin || "").toUpperCase();
    if (!acc[c]) acc[c] = [];
    acc[c].push(a);
    return acc;
  }, {});
  const displayedCoin = availableCryptoCoins.includes(selectedCoin.toUpperCase())
    ? selectedCoin.toUpperCase()
    : availableCryptoCoins[0] || selectedCoin.toUpperCase();
  const selectedAddresses = addressesByCoin[displayedCoin] || [];

  const bonuses = config?.bonuses || [];
  const relevantBonuses = bonuses.filter(b => b.isActive && depositBonusMatchesMethod(b.method, selectedMethod));
  const visibleBonuses = selectedMethod
    ? relevantBonuses
    : bonuses.filter(b => b.isActive);

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

  function resetMpesa() { setMpesaRef(null); setMpesaStatus("idle"); setAmount(""); setMpesaPhone(""); setMpesaCreditedAmount(null); }
  function resetManualMpesa() {
    setManualDepositSubmitted(false);
    setManualDepositTransactionReference(null);
    setManualPaymentReference("");
    setAmount("");
  }
  function resetNexus() { setNexusRef(null); setNexusStatus("idle"); setAmount(""); }

  const handleNexusDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!nexusWalletId) {
      toast({ title: "Wallet not found", description: `No ${nexusCurrency} wallet. Add one in Settings.`, variant: "destructive" });
      return;
    }
    try {
      const result = await initiateNexus({
        walletId: nexusWalletId,
        currency: nexusCurrency,
        paymentCurrency,
        amount: parseFloat(amount),
        email: user?.email || undefined,
      });
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      setNexusRef(result.reference);
      setNexusStatus("pending");
      toast({ title: "Payment initiated", description: result.description || "Complete your payment to credit the wallet" });
    } catch (e: any) {
      toast({ title: "Deposit failed", description: e.message, variant: "destructive" });
    }
  };

  // Always choose a real destination wallet. Never silently fall back to a
  // wallet in another currency.
  useEffect(() => {
      if (userWallets.length > 0 && !nexusWalletId) {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("walletId");
      const target = userWallets.find(w => w.id === requested)
        || userWallets.find(w => w.isDefault)
        || userWallets[0];
      setNexusWalletId(target?.id || null);
    }
  }, [userWallets, nexusWalletId]);

  // Destination currency follows the selected wallet. The paying currency
  // remains independently selectable for providers that support conversion.
  useEffect(() => {
    if (!displayWallet) return;
    const targetCurrency = displayWallet.currency.toUpperCase();
    setNexusCurrency(targetCurrency);
  }, [displayWallet?.id, displayWallet?.currency]);

  useEffect(() => {
    if (config?.countryPaymentCurrency) {
      setPaymentCurrency(config.countryPaymentCurrency.toUpperCase());
    }
  }, [config?.countryPaymentCurrency]);

  // Poll NexusPay status
  useEffect(() => {
    if (nexusStatus !== "pending" || !nexusRef) return;
    const interval = setInterval(async () => {
      try {
        const data = await pollNexusStatus(nexusRef);
        if (data.status === "completed") {
          setNexusStatus("completed");
          refreshUser();
          queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
          toast({ title: "Deposit Successful!", description: `${nexusCurrency} wallet credited.` });
        } else if (data.status === "failed") {
          setNexusStatus("failed");
          toast({ title: "Payment Failed", description: "Payment was declined or cancelled.", variant: "destructive" });
        }
      } catch {}
    }, 5000);
    const timeout = setTimeout(() => { clearInterval(interval); if (nexusStatus === "pending") setNexusStatus("failed"); }, 180000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [nexusStatus, nexusRef]);

  if (configLoading || cryptoAddressesLoading) {
    return (
      <div className="min-h-screen bg-background bottom-nav-safe md:pb-6">
        <WavyHeader size="sm" />
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bottom-nav-safe">
      <WavyHeader size="sm" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-4 text-white">
          <p className="text-xs text-white/70 mb-1">Available Balance {displayWallet ? `(${displayWallet.currency})` : ""}</p>
          <p className="text-2xl font-bold" data-testid="text-current-balance">
            {getCurrencySymbol(displayWallet?.currency || "USD")} {formatNumber(Number(displayWallet?.availableBalance ?? 0))}
          </p>
          {(user as any)?.accountNumber && (
            <p className="text-xs text-white/60 mt-1">Account: {(user as any).accountNumber}</p>
          )}
        </motion.div>

        {/* Deposit Bonuses Banner */}
        {visibleBonuses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Deposit Bonuses Active</p>
            </div>
            <div className="space-y-1.5">
              {visibleBonuses.map(b => {
                  const methodLabel = ["mpesa", "mobile_money", "nexuspay"].includes(b.method)
                    ? "Mobile Money"
                    : METHOD_META[b.method]?.label || (b.method === "any" ? "any method" : b.method);
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
            <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Destination wallet</p>
                  <p className="text-xs text-muted-foreground">Choose where this deposit will be credited.</p>
                </div>
                <Badge variant="outline">{displayWallet?.currency || "Select a wallet"}</Badge>
              </div>
              <Select
                value={nexusWalletId || ""}
                onValueChange={id => {
                  setNexusWalletId(id);
                  const selected = userWallets.find(wallet => wallet.id === id);
                  if (selected) setNexusCurrency(selected.currency.toUpperCase());
                }}
              >
                <SelectTrigger data-testid="select-deposit-wallet">
                  <SelectValue placeholder="Select destination wallet" />
                </SelectTrigger>
                <SelectContent>
                  {userWallets.filter(wallet => wallet.isActive && !wallet.isSuspended).map(wallet => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.label || wallet.currency} ({wallet.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-3">Available Deposit Methods</p>
              <div className="space-y-3">
                {enabledMethods.map(method => {
                  const meta = METHOD_META[method];
                  const enabled = true;
                  const Icon = meta.icon;
                  const methodBonuses = bonuses.filter(b => b.isActive && depositBonusMatchesMethod(b.method, method));
                  return (
                    <motion.button
                      key={method}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!enabled) return;
                        setSelectedMethod(method);
                        if (method === "mpesa" || method === "card") setPaymentCurrency(config?.countryPaymentCurrency || "USD");
                        if (method === "manual_mpesa") setPaymentCurrency("KES");
                        if (method === "nexuspay") setPaymentCurrency(config?.countryPaymentCurrency || "USD");
                      }}
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
                          {!enabled && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{method === "nexuspay" ? "Disabled" : "Coming Soon"}</Badge>}
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
                {enabledMethods.length === 0 && (
                  <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground" role="status">
                    Deposits are temporarily unavailable. Please contact support or try again later.
                  </div>
                )}
              </div>
              <details className="mt-4 rounded-2xl border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-semibold">Supported deposit currencies and regions</summary>
                <div className="mt-3 space-y-2">
                  {providerCurrencies.map(currency => (
                    <div key={currency.code} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium">
                        {NEXUS_CURRENCY_FLAGS[currency.code] || "◈"} {currency.code} · {currency.name}
                      </span>
                      <span className="text-right text-muted-foreground">{currency.countryOrRegion}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Country and payment-method availability is confirmed at checkout.
                  </p>
                </div>
              </details>
          </motion.div>
        )}

        {/* MOBILE-MONEY FLOW */}
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
                      <p className="font-semibold text-sm">Mobile-money deposit</p>
                      <p className="text-xs text-muted-foreground">A payment prompt will be sent to your phone.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Amount ({paymentCurrency})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol(paymentCurrency)}</span>
                      <Input
                        type="number" step="0.01" value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00" className="pl-7 text-base"
                        data-testid="input-mpesa-amount"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter the amount in {paymentCurrency}.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Mobile-money phone number</label>
                    <Input
                      type="tel" value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)}
                      placeholder={user?.phone || "Enter a number that can receive payment prompts"}
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
                    {mpesaMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send payment prompt"}
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
                    <p className="text-sm text-muted-foreground mt-1">Complete the {paymentCurrency} {amount} deposit using the prompt on your phone.</p>
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
                    <p className="text-sm text-muted-foreground mt-1">{getCurrencySymbol(displayWallet?.currency || nexusCurrency)}{mpesaCreditedAmount || amount} has been credited to your wallet.</p>
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
                    <p className="text-sm text-muted-foreground mt-1">The mobile-money payment was declined or timed out.</p>
                  </div>
                  <Button className="w-full" onClick={resetMpesa} data-testid="button-retry-mpesa">Try Again</Button>
                </div>
              )}
            </motion.div>
          )}

          {/* MANUAL M-PESA WALLET DEPOSIT */}
          {selectedMethod === "manual_mpesa" && (
            <motion.div key="manual-mpesa" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => { setSelectedMethod(null); resetManualMpesa(); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to methods
              </button>

              {!manualDepositSubmitted ? (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Manual M-Pesa wallet deposit</p>
                      <p className="text-xs text-muted-foreground">KES deposits are credited after an admin verifies the payment.</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-3 space-y-2">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Paybill</span>
                      <span className="font-mono font-semibold" data-testid="text-wallet-manual-paybill">{config?.manualMpesa?.paybill}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Account</span>
                      <span className="font-mono font-semibold" data-testid="text-wallet-manual-account">{config?.manualMpesa?.account}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Amount (KES)</label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      data-testid="input-manual-mpesa-amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">M-Pesa transaction code</label>
                    <Input
                      value={manualPaymentReference}
                      onChange={e => setManualPaymentReference(e.target.value)}
                      placeholder="e.g. QAB12CDE34"
                      autoCapitalize="characters"
                      data-testid="input-manual-mpesa-reference"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Pay the exact amount shown to these details, then submit your M-Pesa transaction code. Your wallet stays unchanged until payment is verified.
                  </p>
                  <Button
                    onClick={() => manualMpesaMutation.mutate()}
                    disabled={
                      manualMpesaMutation.isPending ||
                      !nexusWalletId ||
                      !amount ||
                      !Number.isFinite(Number(amount)) ||
                      Number(amount) <= 0 ||
                      !manualPaymentReference.trim()
                    }
                    className="w-full bg-green-600 hover:bg-green-500"
                    data-testid="button-submit-manual-mpesa"
                  >
                    {manualMpesaMutation.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                      : "Submit for verification"}
                  </Button>
                </div>
              ) : (
                <div className="bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center space-y-4" role="status">
                  <Clock className="w-12 h-12 text-amber-600 mx-auto" />
                  <div>
                    <p className="font-semibold">Payment submitted for review</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your KES wallet will be credited only after an admin verifies the M-Pesa payment.
                    </p>
                  </div>
                  {manualDepositTransactionReference && (
                    <p className="text-xs text-muted-foreground">
                      Submission reference: <span className="font-mono">{manualDepositTransactionReference}</span>
                    </p>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => { setSelectedMethod(null); resetManualMpesa(); }}>
                    Back to deposit methods
                  </Button>
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

              <div className="bg-primary/8 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/90">Send crypto to the address below. Your balance will be credited after blockchain confirmations. Only send the exact coin to its matching address.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Coin selector header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Select Coin</p>
                  <div className="grid grid-cols-4 gap-2">
                    {availableCryptoCoins.map(coin => (
                      <button
                        key={coin}
                        onClick={() => setSelectedCoin(coin)}
                        data-testid={`coin-btn-${coin}`}
                        className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                          displayedCoin === coin
                            ? `bg-gradient-to-br ${COIN_COLORS[coin] || "from-primary to-primary/80"} text-white shadow-lg scale-105`
                            : "bg-background border border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-base font-bold">{COIN_ICONS[coin] || coin}</span>
                        <span className="text-[9px] font-semibold opacity-80">{coin}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {selectedAddresses.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-6 text-center">
                      <Bitcoin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">No {displayedCoin} addresses configured</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Contact support or try another coin.</p>
                    </div>
                  ) : (
                    selectedAddresses.map(addr => (
                      <div key={addr.id} className="border border-border rounded-xl overflow-hidden" data-testid={`crypto-addr-${addr.id}`}>
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">{addr.networkLabel || addr.network}</span>
                          {addr.minDeposit && parseFloat(addr.minDeposit) > 0 && (
                            <span className="text-[10px] text-muted-foreground">Min: {addr.minDeposit} {selectedCoin}</span>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs bg-muted rounded-lg p-2.5 flex-1 break-all text-foreground">{addr.address}</p>
                            <CopyButton text={addr.address} label="Copy" />
                          </div>
                          {addr.qrCodeUrl && (
                            <div className="flex justify-center rounded-xl bg-white p-3">
                              <img src={addr.qrCodeUrl} alt={`${selectedCoin} deposit QR code`} className="h-36 w-36 object-contain" />
                            </div>
                          )}
                          {addr.memo && (
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-2">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">MEMO REQUIRED</span>
                              <span className="font-mono text-xs flex-1 text-amber-800 dark:text-amber-300">{addr.memo}</span>
                              <CopyButton text={addr.memo} />
                            </div>
                          )}
                          {addr.notes && <p className="text-[11px] text-muted-foreground italic">{addr.notes}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Need to notify support of your deposit?</p>
                <Button variant="outline" size="sm" onClick={() => setLocation("/live-chat")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Contact Support
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
                         Use your account number <span className="font-bold">{(user as any)?.accountNumber || ""}</span> as payment reference. After transfer, contact support with your receipt.
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

          {/* NEXUSPAY FLOW */}
          {selectedMethod === "nexuspay" && (
            <motion.div key="nexuspay" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => { setSelectedMethod(null); resetNexus(); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to methods
              </button>

              {nexusStatus === "idle" && (
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                    <p className="font-semibold text-sm">Wallet deposit</p>
                    <p className="text-xs text-muted-foreground">Pay in the currency available for your profile country.</p>
                    </div>
                  </div>

                  {/* Destination and country-based checkout currency */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Destination wallet</label>
                    <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 px-3 py-2 text-sm font-semibold">
                      {NEXUS_CURRENCY_FLAGS[nexusCurrency] || "💰"} {displayWallet?.label || nexusCurrency} ({nexusCurrency})
                    </div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checkout currency</label>
                    <div className="rounded-xl border border-border px-3 py-2 text-sm font-semibold">
                      {NEXUS_CURRENCY_FLAGS[config?.countryPaymentCurrency || "USD"] || "💰"} {config?.countryPaymentCurrency || "USD"}
                    </div>
                    <p className="text-xs text-muted-foreground">Available payment options are shown during checkout.</p>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Amount ({paymentCurrency})
                    </label>
                    <Input
                      type="number" step="any"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-base"
                    />
                    {paymentCurrency !== nexusCurrency && (
                      <p className="text-xs text-muted-foreground">The amount will be converted to your {nexusCurrency} wallet currency before it is credited.</p>
                    )}
                  </div>

                  <Button
                    onClick={handleNexusDeposit}
                    disabled={nexusInitiating || !amount || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500"
                  >
                    {nexusInitiating
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      : `Deposit ${nexusCurrency}`}
                  </Button>
                </div>
              )}

              {nexusStatus === "pending" && (
                <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto">
                    <Globe className="w-8 h-8 text-purple-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold">Payment Initiated</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete the payment in the checkout page. Your wallet is credited after confirmation.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Waiting for confirmation...</span>
                  </div>
                  <Button variant="ghost" className="w-full text-sm text-destructive" onClick={resetNexus}>Cancel</Button>
                  <p className="text-xs text-muted-foreground">Ref: <span className="font-mono">{nexusRef}</span></p>
                </div>
              )}

              {nexusStatus === "completed" && (
                <div className="bg-card border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Deposit Successful!</p>
                    <p className="text-sm text-muted-foreground mt-1">{nexusCurrency} wallet credited.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
                    <Button variant="outline" className="flex-1" onClick={resetNexus}>New Deposit</Button>
                  </div>
                </div>
              )}

              {nexusStatus === "failed" && (
                <div className="bg-card border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <div>
                    <p className="font-semibold text-red-600">Payment Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">The payment was declined or timed out.</p>
                  </div>
                  <Button className="w-full" onClick={resetNexus}>Try Again</Button>
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Card Deposit</p>
                    <p className="text-xs text-muted-foreground">Visa and Mastercard</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Amount ({config?.countryPaymentCurrency || "local currency"})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {getCurrencySymbol(config?.countryPaymentCurrency || "USD")}
                    </span>
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
                    const paymentCurrency = config?.countryPaymentCurrency || "USD";
                    if (!hasUsdToPaymentCurrencyRate) {
                      toast({
                        title: "Card deposits are temporarily unavailable",
                        description: "The exchange rate needed to validate this deposit is unavailable.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (!amount || parseFloat(amount) < minimumCardDeposit) {
                      toast({
                        title: `Minimum ${paymentCurrency} ${formatNumber(minimumCardDeposit)}`,
                        description: `Enter at least ${paymentCurrency} ${formatNumber(minimumCardDeposit)} to deposit via card.`,
                        variant: "destructive",
                      });
                      return;
                    }
                    try {
                      const r = await apiRequest("POST", "/api/deposit/nexuspay", {
                        amount,
                        walletId: nexusWalletId,
                        currency: nexusCurrency,
                        paymentCurrency,
                        paymentMethod: "card",
                        email: user?.email,
                      });
                      const data = await r.json();
                      if (data.redirectUrl) window.location.href = data.redirectUrl;
                      else throw new Error(data.message || "Card payment could not be started.");
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message || "Card payment could not be started. Please try again later.", variant: "destructive" });
                    }
                  }}
                  disabled={!hasUsdToPaymentCurrencyRate || !amount || parseFloat(amount) < minimumCardDeposit}
                  className="w-full"
                  data-testid="button-pay-with-card"
                >
                  Pay with Card
                </Button>

                 <p className="text-xs text-center text-muted-foreground">Your selected wallet is credited after the payment is confirmed.</p>
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
