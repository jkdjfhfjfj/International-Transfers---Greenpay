import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { useWallets, useWalletExchange } from "@/hooks/use-wallets";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, ArrowLeftRight, RefreshCw, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { PINModal } from "@/components/pin-modal";

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', KES: '🇰🇪', UGX: '🇺🇬', GHS: '🇬🇭', NGN: '🇳🇬',
  ZAR: '🇿🇦', TZS: '🇹🇿', XOF: '🌍', CDF: '🇨🇩', XAF: '🌍',
  RWF: '🇷🇼', SLE: '🇸🇱', ZMW: '🇿🇲', EUR: '🇪🇺', GBP: '🇬🇧',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', KES: 'KSh', UGX: 'UGX', GHS: '₵', NGN: '₦',
  ZAR: 'R', TZS: 'TSh', XOF: 'CFA', CDF: 'FC', XAF: 'FCFA',
  RWF: 'RF', SLE: 'Le', ZMW: 'ZK', EUR: '€', GBP: '£',
  BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '◎', SOL: '◎', XRP: '✕',
  BNB: '◆', ADA: '₳', DOGE: 'Ð', TRX: 'T',
};

const CRYPTO_CURRENCIES = new Set(["BTC", "ETH", "USDT", "USDC", "SOL", "XRP", "BNB", "ADA", "DOGE", "TRX"]);
const formatExchangeAmount = (value: unknown, currency?: string) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "0";
  const decimals = CRYPTO_CURRENCIES.has(String(currency || "").toUpperCase()) || (Math.abs(amount) > 0 && Math.abs(amount) < 1) ? 8 : 4;
  return amount.toLocaleString(undefined, { minimumFractionDigits: decimals === 8 && amount > 0 && amount < 1 ? 4 : 0, maximumFractionDigits: decimals });
};

export default function ExchangePage() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [fromWalletId, setFromWalletId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [securityPrompt, setSecurityPrompt] = useState<{ pin: boolean; authenticator: boolean } | null>(null);
  const { toast } = useToast();
  const { wallets, isLoading } = useWallets();
  const { exchange, isExchanging } = useWalletExchange();
  const { data: cryptoData, isLoading: cryptoLoading } = useQuery({
    queryKey: ["/api/crypto/wallets"],
    queryFn: async () => (await apiRequest("GET", "/api/crypto/wallets")).json(),
  });
  const { data: fiatRatesData } = useQuery({
    queryKey: ["/api/exchange-rates/USD"],
    queryFn: async () => (await apiRequest("GET", "/api/exchange-rates/USD")).json(),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
  const { data: feeSettings } = useQuery<{ exchangeFeeRate?: number }>({
    queryKey: ["/api/transaction-fees"],
    queryFn: async () => (await apiRequest("GET", "/api/transaction-fees")).json(),
  });

  const activeWallets = wallets.filter(w => w.isActive && !w.isSuspended);
  const cryptoWallets: any[] = (cryptoData as any)?.wallets || [];
  const cryptoRates: Record<string, number> = (cryptoData as any)?.rates || {};
  const fiatRates: Record<string, number> = (fiatRatesData as any)?.rates || {};
  const activeAccounts: any[] = [
    ...activeWallets.map(wallet => ({ ...wallet, kind: "wallet" })),
    ...cryptoWallets.map(wallet => ({
      ...wallet,
      id: `crypto:${wallet.coin}`,
      kind: "crypto",
      currency: wallet.coin,
      availableBalance: Number(wallet.balance || 0),
      isActive: true,
      isSuspended: false,
    })),
  ];

  const getUsdRate = (account: any): number => {
    if (!account) return 0;
    if (account.kind === "crypto") return Number(cryptoRates[account.currency] || 0);
    if (account.currency === "USD") return 1;
    const usdToCurrency = Number(fiatRates[account.currency] || 0);
    return usdToCurrency > 0 ? 1 / usdToCurrency : 0;
  };

  const getUnitsPerUsd = (account: any): number => {
    if (!account) return 0;
    if (account.kind === "crypto") {
      const usdRate = getUsdRate(account);
      return usdRate > 0 ? 1 / usdRate : 0;
    }
    if (account.currency === "USD") return 1;
    return Number(fiatRates[account.currency] || 0);
  };

  useEffect(() => {
    if (activeAccounts.length >= 2 && !fromWalletId) {
      const def = activeAccounts.find(w => w.isDefault) || activeAccounts[0];
      setFromWalletId(def.id);
      const other = activeAccounts.find(w => w.id !== def.id);
      if (other) setToWalletId(other.id);
    }
  }, [activeAccounts.length, fromWalletId]);

  const fromWallet = activeAccounts.find(w => w.id === fromWalletId);
  const toWallet = activeAccounts.find(w => w.id === toWalletId);

  useEffect(() => {
    if (!fromWallet || !toWallet || fromWallet.currency === toWallet.currency) { setExchangeRate(null); return; }
    setRateLoading(true);
    const hasCrypto = fromWallet.kind === "crypto" || toWallet.kind === "crypto";
    if (hasCrypto) {
      const sourceUsdRate = getUsdRate(fromWallet);
      const destinationUnitsPerUsd = getUnitsPerUsd(toWallet);
      setExchangeRate(sourceUsdRate > 0 && destinationUnitsPerUsd > 0 ? sourceUsdRate * destinationUnitsPerUsd : null);
      setRateLoading(false);
      return;
    }
    apiRequest("GET", `/api/exchange-rates/${fromWallet.currency}`)
      .then(r => r.json())
      .then(data => setExchangeRate(data?.rates?.[toWallet.currency] || data?.rate || null))
      .catch(() => setExchangeRate(null))
      .finally(() => setRateLoading(false));
  }, [fromWallet?.currency, toWallet?.currency, fromWallet?.kind, toWallet?.kind, cryptoData, fiatRatesData]);

  const amountNum = parseFloat(amount) || 0;
  const FEE_RATE = Number(feeSettings?.exchangeFeeRate ?? 0.015);
  const feeNum = amountNum * FEE_RATE;
  const netAmount = amountNum - feeNum;
  const receiveAmount = exchangeRate ? netAmount * exchangeRate : 0;

  const fromBalance = fromWallet ? Number(fromWallet.availableBalance ?? 0) : 0;

  const handleSwap = () => {
    const tmp = fromWalletId;
    setFromWalletId(toWalletId);
    setToWalletId(tmp);
    setAmount("");
    setSuccess(null);
  };

  const handleExchange = async (security?: { pin?: string; authenticatorCode?: string }) => {
    if (!fromWalletId || !toWalletId) {
      toast({ title: "Select wallets", description: "Choose source and destination wallets", variant: "destructive" });
      return;
    }
    if (!amount || amountNum <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount to exchange", variant: "destructive" });
      return;
    }
    if (amountNum > fromBalance) {
      toast({ title: "Insufficient balance", description: `Available: ${CURRENCY_SYMBOLS[fromWallet?.currency || ''] || ''}${formatNumber(fromBalance)}`, variant: "destructive" });
      return;
    }
    if (!security && !confirmOpen) {
      setConfirmOpen(true);
      return;
    }
    setConfirmOpen(false);
    try {
      let result: any;
      if (fromWallet.kind === "crypto" || toWallet.kind === "crypto") {
        const response = await apiRequest("POST", "/api/crypto/transfer", {
          sourceType: fromWallet.kind,
          sourceId: fromWallet.kind === "crypto" ? undefined : fromWallet.id,
          sourceCoin: fromWallet.kind === "crypto" ? fromWallet.currency : undefined,
          destinationType: toWallet.kind,
          destinationId: toWallet.kind === "crypto" ? undefined : toWallet.id,
          destinationCoin: toWallet.kind === "crypto" ? toWallet.currency : undefined,
          amount: amountNum,
          ...security,
        });
        const data = await response.json();
        if (!response.ok) throw Object.assign(new Error(data.message || "Exchange failed"), data);
        result = {
          ...data,
          fromAmount: amountNum,
          fromCurrency: fromWallet.currency,
          toAmount: data.destinationAmount,
          toCurrency: toWallet.currency,
          rate: data.rate,
          fee: data.fee,
        };
      } else {
        result = await exchange({ fromWalletId, toWalletId, amount: amountNum, ...security } as any);
      }
      setSuccess(result);
      setAmount("");
      toast({ title: "Exchange successful!", description: `${result.fromAmount} ${result.fromCurrency} → ${parseFloat(result.toAmount).toFixed(4)} ${result.toCurrency}` });
    } catch (e: any) {
      if (e?.requiresSetup) {
        toast({ title: "Security setup required", description: "Set up a PIN or authenticator before making transactions." });
        setLocation("/settings");
        return;
      }
      const requiresPin = Boolean(e?.requiresPin ?? e?.securityOptions?.pin);
      const requiresAuthenticator = Boolean(e?.requiresAuthenticator ?? e?.securityOptions?.authenticator);
      if (requiresPin || requiresAuthenticator || /pin or authenticator|required/i.test(e?.message || "")) {
        setSecurityPrompt({ pin: requiresPin || !requiresAuthenticator, authenticator: requiresAuthenticator });
        return;
      }
      toast({ title: "Exchange failed", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cryptoLoading && activeAccounts.length < 2) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <WavyHeader size="sm" />
        <div className="max-w-lg mx-auto p-6 text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold mb-2">Two Wallets Needed</h2>
          <p className="text-sm text-muted-foreground mb-6">You need at least two active wallets or crypto accounts to exchange currencies. Add another wallet in Settings or fund a crypto wallet.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Button>
            <Button onClick={() => setLocation("/settings")}>Add Wallet</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bottom-nav-safe">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-700 dark:text-green-400 text-lg">Exchange Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {CURRENCY_FLAGS[success.fromCurrency]} {parseFloat(success.fromAmount).toFixed(4)} {success.fromCurrency}
                  {" → "}
                  {CURRENCY_FLAGS[success.toCurrency]} {parseFloat(success.toAmount).toFixed(4)} {success.toCurrency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Rate: 1 {success.fromCurrency} = {parseFloat(success.rate).toFixed(4)} {success.toCurrency}</p>
                <p className="text-xs text-muted-foreground">Fee: {parseFloat(success.fee).toFixed(4)} {success.fromCurrency}</p>
                <p className="text-xs font-mono text-muted-foreground/60 mt-1">Ref: {success.reference}</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={() => { setSuccess(null); setAmount(""); }}>
                  New Exchange
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setLocation("/transactions")}>
                  View History
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* From Wallet */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">You Pay</label>
                  <span className="text-xs text-muted-foreground">
                    Available: {CURRENCY_SYMBOLS[fromWallet?.currency || ''] || ''}{formatNumber(fromBalance, 4)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="text-xl font-bold h-12 border-0 bg-muted/40 focus-visible:ring-1"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={fromWalletId || ""}
                      onChange={e => { setFromWalletId(e.target.value); setAmount(""); setSuccess(null); }}
                      className="h-12 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-semibold appearance-none cursor-pointer"
                    >
                   {activeAccounts.filter(w => w.id !== toWalletId).map(w => (
                        <option key={w.id} value={w.id}>
                         {CURRENCY_FLAGS[w.currency] || "◈"} {w.currency}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setAmount((fromBalance * pct / 100).toFixed(4))}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors mr-1.5"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Swap Button + Rate */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleSwap}
                    className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-primary" />
                  </button>
                  {rateLoading ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : exchangeRate ? (
                    <p className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      1 {fromWallet?.currency} = {exchangeRate.toFixed(4)} {toWallet?.currency}
                    </p>
                  ) : null}
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>

              {/* To Wallet */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">You Receive</label>
                  <span className="text-xs text-muted-foreground">
                    Current: {CURRENCY_SYMBOLS[toWallet?.currency || ''] || ''}{formatNumber(Number(toWallet?.availableBalance ?? 0), 4)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="h-12 px-3 rounded-xl bg-muted/40 flex items-center">
                      <span className="text-xl font-bold text-muted-foreground">
                       {receiveAmount > 0 ? formatExchangeAmount(receiveAmount, toWallet?.currency) : "0"}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={toWalletId || ""}
                      onChange={e => { setToWalletId(e.target.value); setAmount(""); setSuccess(null); }}
                      className="h-12 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-semibold appearance-none cursor-pointer"
                    >
                       {activeAccounts.filter(w => w.id !== fromWalletId).map(w => (
                        <option key={w.id} value={w.id}>
                         {CURRENCY_FLAGS[w.currency] || "◈"} {w.currency}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Fee breakdown */}
              {amountNum > 0 && exchangeRate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs"
                >
                  <div className="flex justify-between text-muted-foreground">
                    <span>Exchange amount</span>
                    <span>{CURRENCY_SYMBOLS[fromWallet?.currency || ''] || ''}{formatExchangeAmount(amountNum, fromWallet?.currency)} {fromWallet?.currency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Exchange fee</span>
                    <span>−{CURRENCY_SYMBOLS[fromWallet?.currency || ''] || ''}{formatExchangeAmount(feeNum, fromWallet?.currency)} {fromWallet?.currency} ({(FEE_RATE * 100).toFixed(2)}%)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net amount</span>
                    <span>{formatExchangeAmount(netAmount, fromWallet?.currency)} {fromWallet?.currency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rate</span>
                    <span>1 {fromWallet?.currency} = {exchangeRate.toFixed(4)} {toWallet?.currency}</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between font-semibold text-foreground">
                    <span>You receive</span>
                    <span>{CURRENCY_SYMBOLS[toWallet?.currency || ''] || ''}{formatExchangeAmount(receiveAmount, toWallet?.currency)} {toWallet?.currency}</span>
                  </div>
                </motion.div>
              )}

              <p className="text-center text-xs text-muted-foreground pb-2">
                 Exchange rates are live. The configured exchange fee applies to this transaction.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom Exchange button — Android style, always above mobile navigation */}
      {!success && (
         <div className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:bottom-0">
          <div className="max-w-lg mx-auto p-4">
            <Button
              onClick={() => handleExchange()}
              disabled={isExchanging || !amount || amountNum <= 0 || !fromWalletId || !toWalletId || fromWalletId === toWalletId}
              className="w-full h-13 text-base font-semibold bg-primary hover:bg-primary/90"
              style={{ height: 52 }}
            >
              {isExchanging ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <>Exchange {fromWallet?.currency} → {toWallet?.currency}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {confirmOpen && (
         <div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/50 p-4 md:items-center">
            <div className="bottom-sheet-safe w-full max-w-md rounded-t-3xl md:rounded-2xl bg-card border border-border p-5 shadow-2xl">
             <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30 md:hidden" />
             <h3 className="text-lg font-bold">Confirm exchange</h3>
             <p className="mt-2 text-sm text-muted-foreground">
               Exchange {formatExchangeAmount(amountNum, fromWallet?.currency)} {fromWallet?.currency} for approximately {formatExchangeAmount(receiveAmount, toWallet?.currency)} {toWallet?.currency}?
             </p>
             <div className="mt-5 flex gap-2">
               <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancel</Button>
               <Button className="flex-1" onClick={() => void handleExchange()}>Confirm</Button>
             </div>
           </div>
         </div>
      )}

      <PINModal
        isOpen={!!securityPrompt}
        onClose={() => setSecurityPrompt(null)}
        requiresPin={securityPrompt?.pin}
        requiresAuthenticator={securityPrompt?.authenticator}
        title="Confirm exchange"
        description="Verify your transaction security settings to complete this exchange."
        onSuccess={(pin, authenticatorCode) => {
          setSecurityPrompt(null);
          void handleExchange({ pin, authenticatorCode });
        }}
        isLoading={isExchanging}
      />
    </div>
  );
}
