import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";
import { useWallets, useWalletExchange } from "@/hooks/use-wallets";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, ArrowLeftRight, RefreshCw, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', KES: '🇰🇪', UGX: '🇺🇬', GHS: '🇬🇭', NGN: '🇳🇬',
  ZAR: '🇿🇦', TZS: '🇹🇿', XOF: '🌍', CDF: '🇨🇩', XAF: '🌍',
  RWF: '🇷🇼', SLE: '🇸🇱', ZMW: '🇿🇲', EUR: '🇪🇺', GBP: '🇬🇧',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', KES: 'KSh', UGX: 'UGX', GHS: '₵', NGN: '₦',
  ZAR: 'R', TZS: 'TSh', XOF: 'CFA', CDF: 'FC', XAF: 'FCFA',
  RWF: 'RF', SLE: 'Le', ZMW: 'ZK', EUR: '€', GBP: '£',
};

export default function ExchangePage() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [fromWalletId, setFromWalletId] = useState<string | null>(null);
  const [toWalletId, setToWalletId] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const { toast } = useToast();
  const { wallets, isLoading } = useWallets();
  const { exchange, isExchanging } = useWalletExchange();

  const activeWallets = wallets.filter(w => w.isActive && !w.isSuspended);

  useEffect(() => {
    if (activeWallets.length >= 2 && !fromWalletId) {
      const def = activeWallets.find(w => w.isDefault) || activeWallets[0];
      setFromWalletId(def.id);
      const other = activeWallets.find(w => w.id !== def.id);
      if (other) setToWalletId(other.id);
    }
  }, [activeWallets.length]);

  const fromWallet = activeWallets.find(w => w.id === fromWalletId);
  const toWallet = activeWallets.find(w => w.id === toWalletId);

  useEffect(() => {
    if (!fromWallet || !toWallet || fromWallet.currency === toWallet.currency) { setExchangeRate(null); return; }
    setRateLoading(true);
    apiRequest("GET", `/api/exchange-rates/${fromWallet.currency}`)
      .then(r => r.json())
      .then(data => {
        const rate = data?.rates?.[toWallet.currency] || data?.rate;
        setExchangeRate(rate || null);
      })
      .catch(() => setExchangeRate(null))
      .finally(() => setRateLoading(false));
  }, [fromWallet?.currency, toWallet?.currency]);

  const amountNum = parseFloat(amount) || 0;
  const FEE_RATE = 0.015;
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

  const handleExchange = async () => {
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
    try {
      const result = await exchange({ fromWalletId, toWalletId, amount: amountNum });
      setSuccess(result);
      setAmount("");
      toast({ title: "Exchange successful!", description: `${result.fromAmount} ${result.fromCurrency} → ${parseFloat(result.toAmount).toFixed(4)} ${result.toCurrency}` });
    } catch (e: any) {
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

  if (activeWallets.length < 2) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <WavyHeader size="sm" />
        <div className="max-w-lg mx-auto p-6 text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold mb-2">Two Wallets Needed</h2>
          <p className="text-sm text-muted-foreground mb-6">You need at least two active wallets to exchange currencies. Add another wallet in Settings.</p>
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
    <div className="min-h-screen bg-background pb-40">
      <WavyHeader size="sm" />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg">Exchange</h1>
        </div>

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
                      {activeWallets.filter(w => w.id !== toWalletId).map(w => (
                        <option key={w.id} value={w.id}>
                          {CURRENCY_FLAGS[w.currency]} {w.currency}
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
                        {receiveAmount > 0 ? formatNumber(receiveAmount, 4) : "0.0000"}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={toWalletId || ""}
                      onChange={e => { setToWalletId(e.target.value); setAmount(""); setSuccess(null); }}
                      className="h-12 pl-3 pr-8 rounded-xl border border-border bg-background text-sm font-semibold appearance-none cursor-pointer"
                    >
                      {activeWallets.filter(w => w.id !== fromWalletId).map(w => (
                        <option key={w.id} value={w.id}>
                          {CURRENCY_FLAGS[w.currency]} {w.currency}
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
                    <span>{CURRENCY_SYMBOLS[fromWallet?.currency || ''] || ''}{formatNumber(amountNum, 4)} {fromWallet?.currency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fee (1.5%)</span>
                    <span>−{CURRENCY_SYMBOLS[fromWallet?.currency || ''] || ''}{formatNumber(feeNum, 4)} {fromWallet?.currency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Net amount</span>
                    <span>{formatNumber(netAmount, 4)} {fromWallet?.currency}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rate</span>
                    <span>1 {fromWallet?.currency} = {exchangeRate.toFixed(4)} {toWallet?.currency}</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between font-semibold text-foreground">
                    <span>You receive</span>
                    <span>{CURRENCY_SYMBOLS[toWallet?.currency || ''] || ''}{formatNumber(receiveAmount, 4)} {toWallet?.currency}</span>
                  </div>
                </motion.div>
              )}

              <p className="text-center text-xs text-muted-foreground pb-2">
                Exchange rates are live. 1.5% fee applies to all exchanges.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom Exchange button — Android style, above bottom nav */}
      {!success && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border md:bottom-0">
          <div className="max-w-lg mx-auto p-4">
            <Button
              onClick={handleExchange}
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
    </div>
  );
}
