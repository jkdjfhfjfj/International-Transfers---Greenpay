import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, ChevronDown } from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";
import BottomNavigation from "@/components/bottom-navigation";
import { PINModal } from "@/components/pin-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/use-wallets";
import { apiRequest } from "@/lib/queryClient";

type Option = { value: string; label: string };

export default function TransferPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { wallets: userWallets } = useWallets();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState(false);
  const [securityPrompt, setSecurityPrompt] = useState<{ pin: boolean; authenticator: boolean } | null>(null);

  const { data: cryptoData } = useQuery({
    queryKey: ["/api/crypto/wallets", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", "/api/crypto/wallets")).json(),
  });
  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", `/api/virtual-card/${user?.id}`)).json(),
  });
  const { data: feeData } = useQuery({
    queryKey: ["/api/transaction-fees"],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", "/api/transaction-fees")).json(),
  });
  const { data: fiatRatesData } = useQuery({
    queryKey: ["/api/exchange-rates/USD"],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", "/api/exchange-rates/USD")).json(),
  });

  const cryptoWallets: any[] = (cryptoData as any)?.wallets || [];
  const cards: any[] = ((cardData as any)?.cards || []).filter((card: any) => card.status === "active");
  const sourceOptions = useMemo<Option[]>(() => [
    ...cryptoWallets.map((wallet) => ({ value: `crypto:${wallet.coin}`, label: `${wallet.coin} wallet` })),
    ...userWallets
      .filter((wallet) => wallet.isActive && !wallet.isSuspended)
      .map((wallet) => ({ value: `wallet:${wallet.id}`, label: `${wallet.currency} wallet` })),
    ...cards.map((card) => ({ value: `card:${card.id}`, label: `Virtual card •••• ${String(card.cardNumber || "").slice(-4)}` })),
  ], [cards, cryptoWallets, userWallets]);
  const destinationOptions = useMemo<Option[]>(() => [
    ...userWallets
      .filter((wallet) => wallet.isActive && !wallet.isSuspended)
      .map((wallet) => ({ value: `wallet:${wallet.id}`, label: `${wallet.currency} wallet` })),
    ...cryptoWallets.map((wallet) => ({ value: `crypto:${wallet.coin}`, label: `${wallet.coin} wallet` })),
    ...cards.map((card) => ({ value: `card:${card.id}`, label: `Virtual card •••• ${String(card.cardNumber || "").slice(-4)}` })),
  ], [cards, cryptoWallets, userWallets]);

  const selectedSource = source || sourceOptions[0]?.value || "";
  const selectedDestination = destinationOptions.some((option) => option.value === destination && option.value !== selectedSource)
    ? destination
    : destinationOptions.find((option) => option.value !== selectedSource)?.value || "";
  const feeRate = Number((feeData as any)?.exchangeFeeRate || 0);
  const fee = Number(amount || 0) * feeRate;
  const cryptoPrices: Record<string, number> = (cryptoData as any)?.prices || (cryptoData as any)?.rates || {};
  const fiatRates: Record<string, number> = (fiatRatesData as any)?.rates || {};

  const getAsset = (reference: string) => {
    const [kind, value] = reference.split(":");
    if (kind === "crypto") {
      const wallet = cryptoWallets.find((item) => item.coin === value);
      return {
        kind,
        currency: value,
        usdRate: Number(cryptoPrices[value] || wallet?.usdRate || 0),
        balance: Number(wallet?.balance || 0),
      };
    }
    if (kind === "wallet") {
      const wallet = userWallets.find((item) => item.id === value);
      const currency = String(wallet?.currency || "USD").toUpperCase();
      return {
        kind,
        currency,
        usdRate: currency === "USD" ? 1 : Number(fiatRates[currency] ? 1 / fiatRates[currency] : 0),
        balance: Number(wallet?.availableBalance ?? wallet?.balance ?? 0),
      };
    }
    const card = cards.find((item) => item.id === value);
    return { kind: "card", currency: "USD", usdRate: 1, balance: Number(card?.availableBalance ?? card?.balance ?? 0) };
  };
  const sourceAsset = getAsset(selectedSource);
  const destinationAsset = getAsset(selectedDestination);
  const transferAmount = Number(amount || 0);
  const netUsd = Math.max(0, transferAmount * sourceAsset.usdRate - fee * sourceAsset.usdRate);
  const destinationPerUsd = destinationAsset.kind === "crypto"
    ? (destinationAsset.usdRate ? 1 / destinationAsset.usdRate : 0)
    : destinationAsset.currency === "USD" ? 1 : Number(fiatRates[destinationAsset.currency] || 0);
  const receiveAmount = netUsd * destinationPerUsd;
  const quoteRate = transferAmount > 0 ? receiveAmount / transferAmount : 0;
  const quoteReady = transferAmount > 0 && sourceAsset.usdRate > 0 && destinationPerUsd > 0;

  const transferMutation = useMutation({
    mutationFn: async (security?: { pin?: string; authenticatorCode?: string }) => {
      const [sourceType, sourceValue] = selectedSource.split(":");
      const [destinationType, destinationValue] = selectedDestination.split(":");
      const sourceIsCrypto = sourceType === "crypto";
      const destinationIsCrypto = destinationType === "crypto";
      const response = await apiRequest("POST", "/api/crypto/transfer", {
        sourceType,
        sourceId: sourceIsCrypto ? undefined : sourceValue,
        sourceCoin: sourceIsCrypto ? sourceValue : undefined,
        destinationType,
        destinationId: destinationIsCrypto ? undefined : destinationValue,
        destinationCoin: destinationIsCrypto ? destinationValue : undefined,
        amount: Number(amount),
        ...security,
      });
      const data = await response.json();
      if (!response.ok) throw Object.assign(new Error(data.message || "Transfer failed"), data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer completed",
        description: `${Number(data.sourceAmount || amount).toFixed(8)} ${data.sourceCoin || "funds"} moved successfully.`,
      });
      setAmount("");
      setReview(false);
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
    },
    onError: (error: any) => {
      if (error?.requiresSetup) {
        toast({ title: "Security setup required", description: "Set up a PIN or authenticator before transferring funds." });
        setLocation("/settings");
        return;
      }
      if (error?.requiresPin || error?.requiresAuthenticator || /pin or authenticator|required/i.test(error?.message || "")) {
        setSecurityPrompt({
          pin: Boolean(error.requiresPin) || !Boolean(error.requiresAuthenticator),
          authenticator: Boolean(error.requiresAuthenticator),
        });
        return;
      }
      toast({ title: "Transfer failed", description: error?.message || "Unable to complete this transfer.", variant: "destructive" });
    },
  });

  const canReview = Boolean(selectedSource && selectedDestination && amount && Number(amount) > 0);

  return (
    <div className="min-h-screen bg-background bottom-nav-safe">
      <WavyHeader />
      <main className="max-w-md mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-4"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold">Move money</h1>
              <p className="text-xs text-muted-foreground">Transfer between fiat wallets, crypto wallets, and active cards.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">From</span>
              <select
                value={selectedSource}
                onChange={(event) => setSource(event.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background"
                disabled={!sourceOptions.length}
              >
                {sourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">To</span>
              <select
                value={selectedDestination}
                onChange={(event) => setDestination(event.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background"
                disabled={!destinationOptions.length}
              >
                {destinationOptions
                  .filter((option) => option.value !== selectedSource)
                  .map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <input
                 type="text"
                 inputMode="decimal"
                 autoComplete="off"
                 autoCorrect="off"
                 autoCapitalize="none"
                 enterKeyHint="done"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available: <strong className="text-foreground">{sourceAsset.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {sourceAsset.currency}</strong></span>
                <button type="button" className="font-semibold text-primary" onClick={() => setAmount(String(sourceAsset.balance))}>Use max</button>
              </div>
            </label>
          </div>
        </motion.div>

        {!sourceOptions.length && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-sm text-amber-700 dark:text-amber-300">
            No active accounts are available for transfer.
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => setReview(true)}
            disabled={!canReview || transferMutation.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {transferMutation.isPending ? "Transferring..." : "Review transfer"}
          </button>
        </div>
      </main>

      {review && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-end bg-black/50"
          onClick={() => setReview(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
             className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-bold">Review transfer</p>
                <p className="text-xs text-muted-foreground">{sourceAsset.currency} → {destinationAsset.currency}</p>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Source available</span><span>{sourceAsset.balance.toLocaleString()} {sourceAsset.currency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Transfer amount</span><span>{transferAmount.toFixed(8)} {sourceAsset.currency}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fee ({(feeRate * 100).toFixed(2)}%)</span><span>{fee.toFixed(8)} {sourceAsset.currency}</span></div>
               <div className="flex justify-between"><span className="text-muted-foreground">Source value</span><span>{quoteReady ? `$${(transferAmount * sourceAsset.usdRate).toFixed(2)}` : "Rate unavailable"}</span></div>
               <div className="flex justify-between"><span className="text-muted-foreground">Live rate</span><span>{quoteReady ? `1 ${sourceAsset.currency} = ${quoteRate < 0.01 ? quoteRate.toFixed(8) : quoteRate.toFixed(4)} ${destinationAsset.currency}` : "Loading rate…"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Destination balance</span><span>{destinationAsset.balance.toLocaleString()} {destinationAsset.currency}</span></div>
               <div className="flex justify-between"><span className="text-muted-foreground">You receive</span><span>{quoteReady ? `${receiveAmount.toFixed(8)} ${destinationAsset.currency}` : "Rate unavailable"}</span></div>
               <div className="flex justify-between"><span className="text-muted-foreground">You receive (USD)</span><span>{quoteReady ? `$${netUsd.toFixed(2)}` : "Rate unavailable"}</span></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total debited</span><span>{(transferAmount + fee).toFixed(8)} {sourceAsset.currency}</span></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">The final server quote is recalculated when you confirm.</p>
            <div className="mt-5 flex gap-2">
              <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => setReview(false)}>Edit</button>
               <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={transferMutation.isPending || !quoteReady} onClick={() => transferMutation.mutate({})}>
                {transferMutation.isPending ? "Transferring…" : "Confirm transfer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <PINModal
        isOpen={!!securityPrompt}
        onClose={() => setSecurityPrompt(null)}
        requiresPin={securityPrompt?.pin}
        requiresAuthenticator={securityPrompt?.authenticator}
        title="Confirm transfer"
        description="Verify your transaction security settings before moving funds."
        onSuccess={(pin, authenticatorCode) => {
          setSecurityPrompt(null);
          transferMutation.mutate({ pin, authenticatorCode });
        }}
        isLoading={transferMutation.isPending}
      />
      <BottomNavigation />
    </div>
  );
}