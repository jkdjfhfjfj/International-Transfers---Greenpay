import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
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
      if (error?.requiresPin || error?.requiresAuthenticator) {
        setSecurityPrompt({ pin: Boolean(error.requiresPin), authenticator: Boolean(error.requiresAuthenticator) });
        return;
      }
      toast({ title: "Transfer failed", description: error?.message || "Unable to complete this transfer.", variant: "destructive" });
    },
  });

  const canReview = Boolean(selectedSource && selectedDestination && amount && Number(amount) > 0);

  return (
    <div className="min-h-screen bg-background pb-32">
      <WavyHeader
        title="Transfer"
        subtitle="Move funds between your accounts"
        onBack={() => setLocation("/dashboard")}
      />
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
                type="number"
                min="0.00000001"
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background"
              />
            </label>
          </div>
        </motion.div>

        {review && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Transfer amount</span><span>{Number(amount).toFixed(8)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Transfer fee</span><span>{fee.toFixed(8)}</span></div>
            <div className="flex justify-between font-semibold border-t border-primary/10 pt-2"><span>Total debited</span><span>{(Number(amount) + fee).toFixed(8)}</span></div>
            <p className="text-xs text-muted-foreground pt-1">Review both accounts before confirming. Transfers may not be reversible.</p>
          </div>
        )}

        {!sourceOptions.length && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-sm text-amber-700 dark:text-amber-300">
            No active accounts are available for transfer.
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => review ? transferMutation.mutate({}) : setReview(true)}
            disabled={!canReview || transferMutation.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {transferMutation.isPending ? "Transferring..." : review ? "Confirm transfer" : "Review transfer"}
          </button>
          {review && !transferMutation.isPending && (
            <button onClick={() => setReview(false)} className="w-full py-2 text-sm text-muted-foreground">Edit transfer</button>
          )}
        </div>
      </main>

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