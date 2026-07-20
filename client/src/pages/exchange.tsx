import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { ArrowLeftRight, RefreshCw, Info, AlertCircle, TrendingUp, ChevronLeft } from "lucide-react";

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

function CurrencySelect({ value, onChange, exclude, wallets }: {
  value: string; onChange: (v: string) => void; exclude?: string; wallets: any[];
}) {
  const available = wallets.filter(w => w.currency !== exclude);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-border rounded-xl px-4 py-3 text-sm font-medium bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {available.map(w => {
        const meta = CURRENCY_META[w.currency] || { flag: "🌐", symbol: w.currency, name: w.currency };
        const bal = parseFloat(w.balance || "0");
        return (
          <option key={w.currency} value={w.currency}>
            {meta.flag} {w.currency} — {bal.toLocaleString(undefined, { maximumFractionDigits: 4 })} {meta.symbol}
          </option>
        );
      })}
    </select>
  );
}

export default function ExchangePage() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("KES");
  const [rate, setRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: walletsData, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/wallets"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/wallets"); return r.json(); },
    enabled: !!user?.id,
  });

  const { data: ratesData } = useQuery({
    queryKey: ["/api/currency-rates"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/currency-rates"); return r.json(); },
  });

  const wallets: any[] = walletsData?.wallets || [
    { currency: "USD", balance: user?.balance || "0" },
    { currency: "KES", balance: user?.kesBalance || "0" },
  ];

  const fromWallet = wallets.find(w => w.currency === fromCurrency);
  const srcBalance = parseFloat(fromWallet?.balance || "0");

  useEffect(() => {
    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) { setRate(null); return; }

    const storedRates: any[] = ratesData?.rates || [];
    const manual = storedRates.find((r: any) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency && r.isManual);
    if (manual) { setRate(parseFloat(manual.rate)); return; }

    const liveStored = storedRates.find((r: any) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
    if (liveStored) { setRate(parseFloat(liveStored.rate)); return; }

    setLoadingRate(true);
    apiRequest("GET", `/api/exchange-rates/${fromCurrency}/${toCurrency}`)
      .then(r => r.json())
      .then(data => { if (data?.rate) setRate(data.rate); else setRate(null); })
      .catch(() => setRate(null))
      .finally(() => setLoadingRate(false));
  }, [fromCurrency, toCurrency, ratesData]);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * 0.015;
  const totalDebit = amountNum + fee;
  const credited = rate ? amountNum * rate : 0;

  const isManualRate = !!(ratesData?.rates || []).find(
    (r: any) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency && r.isManual
  );

  const exchangeMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/exchange/convert-multi", { fromCurrency, toCurrency, amount });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Exchange Complete! 🎉",
        description: `${amountNum.toFixed(2)} ${fromCurrency} → ${data.amountCredited} ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      refreshUser();
      setAmount("");
    },
    onError: (e: any) => toast({ title: "Exchange Failed", description: e.message, variant: "destructive" }),
  });

  const handleSwap = () => {
    const prev = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prev);
    setAmount("");
  };

  const canExchange = !!amount && amountNum > 0 && !!rate && fromCurrency !== toCurrency && totalDebit <= srcBalance;

  return (
    <div className="min-h-screen bg-background pb-24">
      <WavyHeader size="sm" />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-xl font-bold">Currency Exchange</h1>
          <p className="text-sm text-muted-foreground">Exchange between your wallets. A 1.5% fee applies.</p>
        </motion.div>

        {/* Balance cards */}
        {!walletsLoading && wallets.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {wallets.map(w => {
              const meta = CURRENCY_META[w.currency] || { flag: "🌐", symbol: w.currency };
              const bal = parseFloat(w.balance || "0");
              const isActive = w.currency === fromCurrency || w.currency === toCurrency;
              return (
                <div key={w.currency}
                  className={`flex-shrink-0 rounded-xl px-3 py-2 text-center min-w-[86px] border transition-all cursor-pointer ${
                    isActive ? "bg-primary/10 border-primary/40" : "bg-card border-border"
                  }`}
                  onClick={() => fromCurrency !== w.currency ? setToCurrency(w.currency) : setFromCurrency(w.currency)}>
                  <p className="text-lg">{meta.flag}</p>
                  <p className="text-xs font-semibold">{w.currency}</p>
                  <p className="text-xs text-muted-foreground">
                    {meta.symbol}{bal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4">

          {/* From */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">From</label>
            <CurrencySelect value={fromCurrency} onChange={(v) => { setFromCurrency(v); if (v === toCurrency) setToCurrency(fromCurrency); }} exclude={undefined} wallets={wallets} />
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Balance: <span className="font-medium">{srcBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {fromCurrency}</span>
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono pointer-events-none">
                {CURRENCY_META[fromCurrency]?.symbol || fromCurrency}
              </span>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-12 font-mono text-lg h-12"
                data-testid="input-exchange-amount"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => setAmount((srcBalance * pct / 100).toFixed(2))}
                  className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground">
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap */}
          <div className="flex justify-center">
            <motion.button whileTap={{ rotate: 180, scale: 0.9 }} onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </motion.button>
          </div>

          {/* To */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">To</label>
            <CurrencySelect value={toCurrency} onChange={(v) => { setToCurrency(v); if (v === fromCurrency) setFromCurrency(toCurrency); }} exclude={undefined} wallets={wallets} />
          </div>

          {/* Summary */}
          {amount && amountNum > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="flex items-center gap-1 font-medium">
                  {loadingRate
                    ? <><RefreshCw className="w-3 h-3 animate-spin" /> fetching…</>
                    : rate
                    ? `1 ${fromCurrency} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toCurrency}`
                    : <span className="text-destructive text-xs">Rate unavailable</span>
                  }
                  {isManualRate && <TrendingUp className="w-3 h-3 text-primary" title="Admin rate" />}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee (1.5%)</span>
                <span className="font-mono">{fee.toFixed(4)} {fromCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deducted</span>
                <span className="font-mono">{totalDebit.toFixed(4)} {fromCurrency}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>You Receive</span>
                <span className="text-primary font-mono">
                  {rate ? credited.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"} {toCurrency}
                </span>
              </div>
              {totalDebit > srcBalance && (
                <div className="flex items-center gap-1 text-destructive text-xs">
                  <AlertCircle className="w-3 h-3" />
                  Insufficient balance (need {totalDebit.toFixed(4)} {fromCurrency})
                </div>
              )}
            </motion.div>
          )}

          <Button
            className="w-full py-6 text-base font-semibold"
            onClick={() => exchangeMutation.mutate()}
            disabled={!canExchange || exchangeMutation.isPending}
            data-testid="button-exchange-submit"
          >
            {exchangeMutation.isPending
              ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Exchanging…</>
              : <><ArrowLeftRight className="w-4 h-4 mr-2" /> Exchange Now</>
            }
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <p>Rates are live or set by our team. Tap a wallet card to select currencies. New currency wallets are created automatically on first deposit.</p>
        </motion.div>
      </div>
    </div>
  );
}
