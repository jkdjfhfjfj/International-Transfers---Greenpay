import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { Copy, Check, ArrowDownToLine, ArrowUpFromLine, CreditCard, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRightLeft } from "lucide-react";
import { PINModal } from "@/components/pin-modal";

const COIN_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  USDT: "₮",
  USDC: "◎",
  SOL: "◎",
  XRP: "✕",
  BNB: "◆",
  ADA: "₳",
  DOGE: "Ð",
  TRX: "T",
  LTC: "Ł",
  AVAX: "A",
  LINK: "⬡",
  DOT: "●",
  SHIB: "🐕",
};

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDT: "Tether USD",
  USDC: "USD Coin",
  SOL: "Solana",
  XRP: "XRP",
  BNB: "BNB",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  TRX: "TRON",
  LTC: "Litecoin",
  AVAX: "Avalanche",
  LINK: "Chainlink",
  DOT: "Polkadot",
  SHIB: "Shiba Inu",
};

const COIN_NETWORKS: Record<string, string> = {
  BTC: "Bitcoin Network",
  ETH: "Ethereum (ERC-20)",
  USDT: "TRON (TRC-20)",
  USDC: "Ethereum (ERC-20)",
};

const POPULAR_COINS = ["BTC", "ETH", "USDT", "USDC", "SOL", "XRP", "BNB", "ADA", "DOGE", "TRX", "LTC", "AVAX", "LINK", "DOT", "SHIB"];

function formatCryptoAmount(value: unknown, decimals = 8): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: amount > 0 && amount < 1 ? Math.min(4, decimals) : 0,
    maximumFractionDigits: decimals,
  });
}

function formatUsdValue(value: unknown): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "$0.00";
  if (amount !== 0 && Math.abs(amount) < 0.01) return `$${amount.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatUsdPrice(value: unknown): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount === 0) return "$0.00";
  if (Math.abs(amount) < 0.01) return `$${amount.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
  if (Math.abs(amount) < 1) return `$${amount.toFixed(4)}`;
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Tab = "wallets" | "popular" | "deposit" | "withdraw" | "transfer" | "history";
type SecurityAction =
  | { kind: "deposit"; payload: { coin: string; amount: string } }
  | { kind: "withdraw"; payload: { coin: string; amount: string; toAddress: string } }
  | { kind: "transfer" };

export default function CryptoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("wallets");
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [transferSource, setTransferSource] = useState("");
  const [transferDestination, setTransferDestination] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReview, setTransferReview] = useState(false);
  const [depositReview, setDepositReview] = useState(false);
  const [withdrawReview, setWithdrawReview] = useState(false);
  const [selectedDepositAddress, setSelectedDepositAddress] = useState<any | null>(null);
  const [depositInstructions, setDepositInstructions] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [securityPrompt, setSecurityPrompt] = useState<{ pin: boolean; authenticator: boolean } | null>(null);
  const [pendingSecurityAction, setPendingSecurityAction] = useState<SecurityAction | null>(null);
  const [selectedPopularCoin, setSelectedPopularCoin] = useState<string | null>(null);
  const [selectedCryptoTransaction, setSelectedCryptoTransaction] = useState<any | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { wallets: userWallets } = useWallets();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transferFees } = useQuery({
    queryKey: ["/api/transaction-fees"],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", "/api/transaction-fees")).json(),
  });

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab && ["wallets", "popular", "deposit", "withdraw", "transfer", "history"].includes(requestedTab)) {
      setActiveTab(requestedTab as Tab);
    }
  }, []);

  const { data: walletsData, isLoading: walletsLoading, isFetching: walletsFetching, refetch: refetchWallets } = useQuery({
    queryKey: ["/api/crypto/wallets"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/crypto/wallets");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const { data: cardsData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/virtual-card/${user?.id}`);
      return res.json();
    },
  });

  const { data: depositAddressesData } = useQuery({
    queryKey: ["/api/crypto/deposit-addresses"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/crypto/deposit-addresses");
      return res.json();
    },
  });

  const { data: fiatRatesData } = useQuery({
    queryKey: ["/api/exchange-rates/USD"],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", "/api/exchange-rates/USD")).json(),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/crypto/transactions"],
    enabled: !!user?.id && activeTab === "history",
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/crypto/transactions");
      return res.json();
    },
  });

  const openSecurityPrompt = (error: any, action: SecurityAction) => {
    if (error?.requiresSetup) {
      toast({ title: "Security setup required", description: "Set up a PIN or authenticator before making crypto transactions." });
      setLocation("/settings");
      return true;
    }
    const requiresPin = Boolean(error?.requiresPin ?? error?.securityOptions?.pin);
    const requiresAuthenticator = Boolean(error?.requiresAuthenticator ?? error?.securityOptions?.authenticator);
    if (requiresPin || requiresAuthenticator || /pin or authenticator|required/i.test(error?.message || "")) {
      setPendingSecurityAction(action);
      setSecurityPrompt({ pin: requiresPin || !requiresAuthenticator, authenticator: requiresAuthenticator });
      return true;
    }
    return false;
  };

  const depositMutation = useMutation({
    mutationFn: async ({ coin, amount, security }: { coin: string; amount: string; security?: { pin?: string; authenticatorCode?: string } }) => {
      const res = await apiRequest("POST", "/api/crypto/deposit", { coin, amount: parseFloat(amount), ...security });
      return res.json();
    },
    onSuccess: (data, variables) => {
      const address = (addressesByCoin[variables.coin] || []).find((item: any) => item.address === data.depositAddress)
        || (addressesByCoin[variables.coin] || [])[0];
      setDepositInstructions({
        ...address,
        address: data.depositAddress || address?.address,
        memo: data.memo || address?.memo,
        network: data.network || address?.network,
        networkLabel: data.networkLabel || address?.networkLabel,
        message: data.message,
        amount: variables.amount,
        coin: variables.coin,
      });
      toast({ title: "Deposit instructions ready", description: "Use the details below to send your crypto." });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
      setDepositAmount("");
    },
    onError: (err: any, variables) => {
      if (openSecurityPrompt(err, { kind: "deposit", payload: { coin: variables.coin, amount: variables.amount } })) return;
      toast({ title: "Error", description: err?.message || "Failed to initiate deposit", variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ coin, amount, toAddress, security }: { coin: string; amount: string; toAddress: string; security?: { pin?: string; authenticatorCode?: string } }) => {
      const res = await apiRequest("POST", "/api/crypto/withdraw", { coin, amount: parseFloat(amount), toAddress, ...security });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Withdrawal Initiated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
      setWithdrawAmount("");
      setWithdrawAddress("");
    },
    onError: (err: any, variables) => {
      if (openSecurityPrompt(err, { kind: "withdraw", payload: { coin: variables.coin, amount: variables.amount, toAddress: variables.toAddress } })) return;
      toast({ title: "Error", description: err?.message || "Failed to process withdrawal", variant: "destructive" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (security?: { pin?: string; authenticatorCode?: string }) => {
      const sourceReference = transferSource || sourceOptions[0]?.value || "";
      const destinationReference = transferDestination || destinationOptions.find((option) => option.value !== sourceReference)?.value || "";
      const [sourceType, sourceIdOrCoin] = sourceReference.split(":");
      const [destinationType, destinationIdOrCoin] = destinationReference.split(":");
      const sourceIsCrypto = sourceType === "crypto";
      const destinationIsCrypto = destinationType === "crypto";
      const res = await apiRequest("POST", "/api/crypto/transfer", {
        sourceType,
        sourceId: sourceIsCrypto ? undefined : sourceIdOrCoin,
        sourceCoin: sourceIsCrypto ? sourceIdOrCoin : undefined,
        destinationType,
        destinationId: destinationIsCrypto ? undefined : destinationIdOrCoin,
        destinationCoin: destinationIsCrypto ? destinationIdOrCoin : undefined,
        amount: parseFloat(transferAmount),
        ...security,
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.message || "Transfer failed"), data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer completed",
        description: `${formatCryptoAmount(data.sourceAmount)} ${data.sourceCoin || "fiat"} moved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
      setTransferAmount("");
      setTransferReview(false);
    },
    onError: (error: any) => {
      if (openSecurityPrompt(error, { kind: "transfer" })) return;
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
    },
  });

  const wallets: any[] = (walletsData as any)?.wallets || [];
  const rates: Record<string, number> = (walletsData as any)?.prices || (walletsData as any)?.rates || {};
  const changes24h: Record<string, number> = (walletsData as any)?.changes24h || {};
  const priceSource = (walletsData as any)?.source || "fallback";
  const priceFetchedAt = (walletsData as any)?.fetchedAt;
  const fiatRates: Record<string, number> = (fiatRatesData as any)?.rates || {};
  const localCurrency = String((user as any)?.defaultCurrency || "KES").toUpperCase();
  const usdToLocalRate = localCurrency === "USD" ? 1 : Number(fiatRates[localCurrency] || 0);
  const availableUsdBalance = Number(userWallets.find(wallet => wallet.currency === "USD")?.availableBalance ?? 0);
  const history: any[] = (historyData as any)?.transactions || [];
  const allDepositAddresses: any[] = (depositAddressesData as any)?.addresses || [];
  const cards: any[] = (cardsData as any)?.cards || [];
  const sourceOptions = [
    ...wallets.map((wallet) => ({ value: `crypto:${wallet.coin}`, label: `${wallet.coin} wallet` })),
    ...userWallets.filter((wallet) => wallet.isActive && !wallet.isSuspended).map((wallet) => ({ value: `wallet:${wallet.id}`, label: `${wallet.currency} wallet` })),
    ...cards.filter((card) => card.status === "active").map((card) => ({ value: `card:${card.id}`, label: `Virtual card •••• ${String(card.cardNumber || "").slice(-4)}` })),
  ];
  const destinationOptions = [
    ...userWallets.filter((wallet) => wallet.isActive && !wallet.isSuspended).map((wallet) => ({ value: `wallet:${wallet.id}`, label: `${wallet.currency} wallet` })),
    ...wallets.map((wallet) => ({ value: `crypto:${wallet.coin}`, label: `${wallet.coin} wallet` })),
    ...cards.filter((card) => card.status === "active").map((card) => ({ value: `card:${card.id}`, label: `Virtual card •••• ${String(card.cardNumber || "").slice(-4)}` })),
  ];
  const selectedSource = transferSource || sourceOptions[0]?.value || "";
  const selectedDestination = transferDestination || destinationOptions.find((option) => option.value !== selectedSource)?.value || "";
  const transferFeeRate = Number((transferFees as any)?.exchangeFeeRate || 0);
  const transferFee = Number(transferAmount || 0) * transferFeeRate;

  const addressesByCoin: Record<string, any[]> = allDepositAddresses.reduce((acc, addr) => {
    const c = (addr.coin || "").toUpperCase();
    if (!acc[c]) acc[c] = [];
    acc[c].push(addr);
    return acc;
  }, {} as Record<string, any[]>);

  const selectedWallet = wallets.find(w => w.coin === selectedCoin);
  const selectedCoinAddresses = addressesByCoin[selectedCoin] || [];
  const totalUsdValue = wallets.reduce((s, w) => s + parseFloat(w.usdBalance || "0"), 0);

  const getTransferAsset = (reference: string) => {
    const [kind, value] = reference.split(":");
    if (kind === "crypto") {
      const wallet = wallets.find((item) => item.coin === value);
      return { kind, currency: value, usdRate: Number(rates[value] || 0), balance: Number(wallet?.balance || 0) };
    }
    if (kind === "wallet") {
      const wallet = userWallets.find((item) => item.id === value);
      const currency = String(wallet?.currency || "USD").toUpperCase();
      return {
        kind,
        currency,
        usdRate: currency === "USD" ? 1 : Number(fiatRates[currency] ? 1 / fiatRates[currency] : 0),
        balance: Number(wallet?.availableBalance || 0),
      };
    }
    const card = cards.find((item) => item.id === value);
    return {
      kind: "card",
      currency: "USD",
      usdRate: 1,
      balance: Number(card?.availableBalance ?? card?.balance ?? 0),
    };
  };

  const transferSourceAsset = getTransferAsset(selectedSource);
  const transferDestinationAsset = getTransferAsset(selectedDestination);
  const transferAmountNumber = Number(transferAmount || 0);
  const transferFeeAmount = transferAmountNumber * transferFeeRate;
  const transferGrossUsd = transferAmountNumber * transferSourceAsset.usdRate;
  const transferNetUsd = Math.max(0, transferGrossUsd - transferFeeAmount * transferSourceAsset.usdRate);
  const transferDestinationPerUsd = transferDestinationAsset.kind === "crypto"
    ? (transferDestinationAsset.usdRate ? 1 / transferDestinationAsset.usdRate : 0)
    : transferDestinationAsset.currency === "USD"
      ? 1
      : Number(fiatRates[transferDestinationAsset.currency] || 0);
  const transferQuoteAmount = transferNetUsd * transferDestinationPerUsd;
  const transferQuoteRate = transferAmountNumber > 0
    ? transferQuoteAmount / transferAmountNumber
    : 0;
  const sourceAvailableBalance = transferSourceAsset.balance;
  const transferQuoteReady = transferAmountNumber > 0
    && transferSourceAsset.usdRate > 0
    && transferDestinationPerUsd > 0;
  const formatTransferUsd = (value: number) => transferQuoteReady ? formatUsdValue(value) : "Rate unavailable";

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied", description: "Address copied to clipboard" });
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === "confirming") return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "wallets", label: "Wallets", icon: "account_balance_wallet" },
    { id: "popular", label: "Popular", icon: "trending_up" },
    { id: "deposit", label: "Deposit", icon: "arrow_downward" },
    { id: "withdraw", label: "Withdraw", icon: "arrow_upward" },
    { id: "transfer", label: "Transfer", icon: "swap_horiz" },
    { id: "history", label: "History", icon: "history" },
  ];

  return (
    <div className="min-h-screen bg-background bottom-nav-safe">
      <WavyHeader size="sm" />

      <div className="p-4 space-y-4">
        {/* Total Portfolio Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(160deg, #16a34a 0%, #22c55e 100%)' }}
        >
          <p className="text-sm text-white/80 mb-1">Crypto Portfolio</p>
          <p className="text-3xl font-bold">${totalUsdValue.toFixed(2)}</p>
          <div className="flex items-center justify-between gap-3 text-xs text-white/70 mt-1">
             <span>{wallets.length} wallets · {Object.keys(rates).length} supported coins · {priceSource === "fallback" ? "Fallback rates" : priceSource === "cache" ? "Cached live prices" : `Live prices · ${priceSource}`}</span>
            <button onClick={() => refetchWallets()} className="inline-flex items-center gap-1 shrink-0 hover:text-white" aria-label="Refresh crypto prices">
              <RefreshCw className={`w-3 h-3 ${walletsFetching ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          {priceFetchedAt && <p className="text-[10px] text-white/50 mt-1">Updated {new Date(priceFetchedAt).toLocaleTimeString()}</p>}
        </motion.div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
            >
              <span className="material-icons text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* WALLETS TAB */}
          {activeTab === "wallets" && (
            <motion.div key="wallets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {walletsLoading ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Loading wallets...</div>
              ) : wallets.map((wallet: any) => {
                const coinMeta = { accent: "hsl(var(--primary))", tint: "hsl(var(--primary) / 0.10)" };
                return (
                <motion.div
                  key={wallet.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-card border border-border p-4 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold"
                        style={{ background: coinMeta.tint, color: coinMeta.accent }}
                      >
                        {COIN_ICONS[wallet.coin] || wallet.coin[0]}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{wallet.coin}</p>
                        <p className="text-xs text-muted-foreground">{COIN_NAMES[wallet.coin] || wallet.coin}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCryptoAmount(wallet.balance)}</p>
                       <p className="text-xs text-muted-foreground">≈ {formatUsdValue(wallet.usdBalance)}</p>
                       {typeof changes24h[wallet.coin] === "number" && (
                         <p className={`text-[10px] ${changes24h[wallet.coin] >= 0 ? "text-green-600" : "text-red-500"}`}>
                           {changes24h[wallet.coin] >= 0 ? "+" : ""}{changes24h[wallet.coin].toFixed(2)}% today
                         </p>
                       )}
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedCoin(wallet.coin); setActiveTab("deposit"); }}
                    className="w-full rounded-xl p-3 flex items-center justify-between transition-colors"
                    style={{ background: coinMeta.tint }}
                    data-testid={`button-deposit-${wallet.coin}`}
                  >
                    <span className="text-xs font-medium" style={{ color: coinMeta.accent }}>
                      View Deposit Addresses ({(addressesByCoin[wallet.coin] || []).length} networks)
                    </span>
                    <ArrowDownToLine className="w-4 h-4" style={{ color: coinMeta.accent }} />
                  </button>

                   <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-[11px]">
                     <div>
                       <p className="text-muted-foreground">Network</p>
                       <p className="font-medium text-foreground">{wallet.network || COIN_NETWORKS[wallet.coin] || "Supported network"}</p>
                     </div>
                     <div>
                       <p className="text-muted-foreground">Live rate</p>
                        <p className="font-medium text-foreground">1 {wallet.coin} = {formatUsdPrice(rates[wallet.coin])}</p>
                        {usdToLocalRate > 0 && localCurrency !== "USD" && (
                          <p className="text-[10px] text-muted-foreground">
                            ≈ {localCurrency} {(Number(rates[wallet.coin] || 0) * usdToLocalRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        )}
                     </div>
                     <div>
                       <p className="text-muted-foreground">USD value</p>
                        <p className="font-medium text-foreground">{formatUsdValue(wallet.usdBalance)}</p>
                     </div>
                     <div>
                       <p className="text-muted-foreground">Last updated</p>
                        <p className="font-medium text-foreground">
                          {priceFetchedAt
                            ? new Date(priceFetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : walletsFetching ? "Updating…" : "Just now"}
                        </p>
                     </div>
                   </div>
                </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* POPULAR MARKETS TAB */}
          {activeTab === "popular" && (
            <motion.div key="popular" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold">Popular crypto</p>
                    <p className="text-xs text-muted-foreground">Live USD rates refreshed every minute</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                     {priceSource === "fallback" ? "Fallback rates" : priceSource === "cache" ? "Cached live" : `Live · ${priceSource}`}
                  </span>
                </div>
                <div className="space-y-2">
                   {POPULAR_COINS.map((coin) => {
                    const change = changes24h[coin];
                    return (
                       <button key={coin} onClick={() => setSelectedPopularCoin(coin)} className="w-full flex items-center justify-between rounded-xl bg-muted/50 px-3 py-3 text-left hover:bg-muted transition-colors">
                        <span className="flex items-center gap-3">
                           <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold">{COIN_ICONS[coin]}</span>
                          <span><span className="block font-semibold text-sm">{COIN_NAMES[coin]}</span><span className="block text-xs text-muted-foreground">{coin}</span></span>
                        </span>
                         <span className="text-right">
                            <span className="block font-bold text-sm">{formatUsdPrice(rates[coin])}</span>
                            {usdToLocalRate > 0 && localCurrency !== "USD" && <span className="block text-[10px] text-muted-foreground">{localCurrency} {(Number(rates[coin] || 0) * usdToLocalRate).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>}
                           <span className={`block text-[11px] ${Number(change) >= 0 ? "text-green-600" : "text-red-500"}`}>{typeof change === "number" ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}</span>
                         </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* DEPOSIT TAB */}
          {activeTab === "deposit" && (
            <motion.div key="deposit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Send crypto to your wallet address. Funds will be credited after the required number of blockchain confirmations.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select Coin</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => {
                      const active = selectedCoin === coin;
                      return (
                        <button
                          key={coin}
                          onClick={() => setSelectedCoin(coin)}
                          className={`py-2 rounded-xl text-sm font-bold transition-all ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                        >
                          {coin}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCoinAddresses.length === 0 ? (
                    <div className="bg-muted border border-border rounded-xl p-3 text-center">
                     <p className="text-xs text-muted-foreground">No {selectedCoin} deposit addresses are currently available. Please check back shortly or contact support.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Available {selectedCoin} Networks</label>
                    {selectedCoinAddresses.map((addr) => (
                      <div key={addr.id} className="bg-muted rounded-xl p-3 space-y-2" data-testid={`deposit-address-${addr.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">
                              {addr.networkLabel || addr.network}
                            </span>
                            {addr.minDeposit && parseFloat(addr.minDeposit) > 0 && (
                              <span className="text-[10px] text-muted-foreground">Min: {addr.minDeposit} {selectedCoin}</span>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(addr.address, `addr-${addr.id}`)}
                            className="shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
                            data-testid={`button-copy-address-${addr.id}`}
                          >
                            {copied === `addr-${addr.id}` ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
                          </button>
                        </div>
                        <p className="font-mono text-xs break-all bg-background rounded p-2">{addr.address}</p>
                        {addr.qrCodeUrl && (
                          <div className="flex justify-center rounded-xl bg-white p-3">
                            <img src={addr.qrCodeUrl} alt={`${selectedCoin} deposit QR code`} className="h-36 w-36 object-contain" />
                          </div>
                        )}
                        {addr.memo && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-primary">Memo/Tag:</span>
                            <span className="font-mono">{addr.memo}</span>
                            <button
                              onClick={() => copyToClipboard(addr.memo, `memo-${addr.id}`)}
                              className="ml-auto"
                            >
                              {copied === `memo-${addr.id}` ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                            </button>
                          </div>
                        )}
                        {addr.notes && (
                          <p className="text-[11px] text-muted-foreground italic">{addr.notes}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedDepositAddress(addr)}
                          className="w-full rounded-xl border border-primary/20 bg-primary/5 py-2 text-xs font-semibold text-primary"
                        >
                          View deposit details and QR
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount to Deposit ({selectedCoin})</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.]?[0-9]*"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder={`0.00000000`}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{selectedCoin}</span>
                  </div>
                  {depositAmount && (
                    <p className="text-xs text-muted-foreground">
                      ≈ {Number(rates[selectedCoin]) > 0
                        ? `${formatUsdValue(parseFloat(depositAmount || "0") * Number(rates[selectedCoin]))} USD`
                        : "Rate unavailable until live prices load"}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setDepositReview(true)}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0 || depositMutation.isPending}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {depositMutation.isPending ? "Generating..." : "Generate Deposit Instructions"}
                </button>
              </div>
            </motion.div>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === "withdraw" && (
            <motion.div key="withdraw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Withdrawals are deducted from your crypto balance at the current exchange rate. Processing takes 30–60 minutes.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select Coin</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => {
                      const active = selectedCoin === coin;
                      return (
                        <button
                          key={coin}
                          onClick={() => setSelectedCoin(coin)}
                          className={`py-2 rounded-xl text-sm font-bold transition-all ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                        >
                          {coin}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount ({selectedCoin})</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.]?[0-9]*"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="0.00000000"
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{selectedCoin}</span>
                  </div>
                  {withdrawAmount && (
                     <p className="text-xs text-muted-foreground">≈ {formatUsdValue(parseFloat(withdrawAmount || "0") * (rates[selectedCoin] || 1))} USD will be deducted</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Destination Address</label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={e => setWithdrawAddress(e.target.value)}
                    placeholder={`Enter ${selectedCoin} address`}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Network: {COIN_NETWORKS[selectedCoin]}</p>
                </div>

                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Your available USD balance: <span className="font-bold text-foreground">${availableUsdBalance.toFixed(2)}</span></p>
                </div>

                <button
                  onClick={() => setWithdrawReview(true)}
                  disabled={!withdrawAmount || !withdrawAddress || parseFloat(withdrawAmount) <= 0 || withdrawMutation.isPending}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                </button>
              </div>
            </motion.div>
          )}

          {/* TRANSFER TAB */}
          {activeTab === "transfer" && (
            <motion.div key="transfer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="font-semibold">Move funds across accounts</h3>
                    <p className="text-xs text-muted-foreground">Convert at the current live crypto price when needed.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">From</label>
                  <select value={selectedSource} onChange={(event) => setTransferSource(event.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background">
                    {sourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">To</label>
                  <select value={selectedDestination} onChange={(event) => setTransferDestination(event.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background">
                    {destinationOptions.filter((option) => option.value !== selectedSource).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount in source account</label>
                  <input type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} placeholder="0.00" className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background" />
                   <div className="flex items-center justify-between text-xs text-muted-foreground">
                     <span>Available: <strong className="text-foreground">{formatCryptoAmount(sourceAvailableBalance)} {transferSourceAsset.currency}</strong></span>
                     <button type="button" className="text-primary font-semibold" onClick={() => setTransferAmount(String(sourceAvailableBalance))}>Use max</button>
                   </div>
                </div>
                <button
                   onClick={() => setTransferReview(true)}
                  disabled={!selectedSource || !selectedDestination || !transferAmount || Number(transferAmount) <= 0 || transferMutation.isPending}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                   {transferMutation.isPending ? "Transferring..." : "Review transfer"}
                </button>
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
              {historyLoading ? (
                <div className="text-center py-10 text-muted-foreground text-sm">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-icons text-5xl text-muted-foreground">currency_bitcoin</span>
                  <p className="text-muted-foreground mt-3 text-sm">No crypto transactions yet</p>
                </div>
              ) : history.map((tx: any) => (
                <motion.div key={tx.id} whileHover={{ scale: 1.01 }} onClick={() => setSelectedCryptoTransaction(tx)} className="bg-card border border-border rounded-xl p-3.5 elevation-1 cursor-pointer active:scale-[0.99]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {COIN_ICONS[tx.coin] || tx.coin[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm capitalize">{tx.type.replace("_", " ")}</p>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(tx.status)}
                          <span className={`text-xs font-medium capitalize ${tx.status === "completed" ? "text-green-600" : tx.status === "failed" ? "text-red-500" : "text-yellow-600"}`}>{tx.status}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-primary mt-0.5">{formatCryptoAmount(tx.amount)} {tx.coin}</p>
                      <p className="text-xs text-muted-foreground">≈ {formatUsdValue(tx.usdValue)} USD</p>
                      {tx.status !== "completed" && tx.requiredConfirmations > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{tx.confirmations}/{tx.requiredConfirmations} confirmations</p>
                      )}
                      {tx.toAddress && (
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">To: {tx.toAddress}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
       <AnimatePresence>
         {transferReview && (
           <motion.div className="fixed inset-0 z-[160] flex items-end bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTransferReview(false)}>
             <motion.div
                className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl"
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 28, stiffness: 280 }}
               onClick={(event) => event.stopPropagation()}
             >
               <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <p className="text-lg font-bold">Review transfer</p>
                   <p className="text-xs text-muted-foreground">{transferSourceAsset.currency} → {transferDestinationAsset.currency}</p>
                 </div>
                 <ArrowRightLeft className="w-5 h-5 text-primary" />
               </div>
               <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
                 <div className="flex justify-between"><span className="text-muted-foreground">Source available</span><span>{formatCryptoAmount(sourceAvailableBalance)} {transferSourceAsset.currency}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Transfer amount</span><span>{formatCryptoAmount(transferAmountNumber)} {transferSourceAsset.currency}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Fee ({(transferFeeRate * 100).toFixed(2)}%)</span><span>{formatCryptoAmount(transferFee)} {transferSourceAsset.currency}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Live rate</span><span>1 {transferSourceAsset.currency} = {transferQuoteRate < 0.01 ? transferQuoteRate.toFixed(8) : transferQuoteRate.toFixed(4)} {transferDestinationAsset.currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Source value</span><span>{formatTransferUsd(transferGrossUsd)}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">Destination balance</span><span>{formatCryptoAmount(transferDestinationAsset.balance)} {transferDestinationAsset.currency}</span></div>
                 <div className="flex justify-between"><span className="text-muted-foreground">You receive</span><span>{formatCryptoAmount(transferQuoteAmount)} {transferDestinationAsset.currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">You receive (USD)</span><span>{formatTransferUsd(transferNetUsd)}</span></div>
                 <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total debited</span><span>{formatCryptoAmount(transferAmountNumber + transferFee)} {transferSourceAsset.currency}</span></div>
               </div>
               <p className="mt-3 text-xs text-muted-foreground">The final server quote is recalculated when you confirm.</p>
               <div className="mt-5 flex gap-2">
                 <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => setTransferReview(false)}>Edit</button>
                 <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={transferMutation.isPending} onClick={() => transferMutation.mutate({})}>
                   {transferMutation.isPending ? "Transferring…" : "Confirm transfer"}
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
         {selectedCryptoTransaction && (
           <motion.div className="fixed inset-0 z-[160] flex items-end bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCryptoTransaction(null)}>
             <motion.div className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(event) => event.stopPropagation()}>
               <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
               <div className="flex items-center justify-between border-b border-border pb-3">
                 <div>
                   <p className="text-lg font-semibold capitalize">{selectedCryptoTransaction.type?.replaceAll("_", " ")}</p>
                   <p className="text-xs text-muted-foreground">{selectedCryptoTransaction.coin}</p>
                 </div>
                 <button onClick={() => setSelectedCryptoTransaction(null)} className="rounded-full p-2 hover:bg-muted" aria-label="Close transaction details">×</button>
               </div>
               <div className="mt-4 rounded-xl bg-primary/5 p-4 text-center">
                 <p className="text-2xl font-bold text-primary">{formatCryptoAmount(selectedCryptoTransaction.amount)} {selectedCryptoTransaction.coin}</p>
                 <p className="text-sm text-muted-foreground">≈ {formatUsdValue(selectedCryptoTransaction.usdValue)} USD</p>
               </div>
               <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                 <div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium capitalize">{selectedCryptoTransaction.status}</p></div>
                 <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{new Date(selectedCryptoTransaction.createdAt).toLocaleString()}</p></div>
                 <div><p className="text-xs text-muted-foreground">Confirmations</p><p className="font-medium">{selectedCryptoTransaction.confirmations ?? 0}/{selectedCryptoTransaction.requiredConfirmations ?? "—"}</p></div>
                 <div><p className="text-xs text-muted-foreground">Fee</p><p className="font-medium">{selectedCryptoTransaction.fee ?? selectedCryptoTransaction.networkFee ?? "—"} {selectedCryptoTransaction.coin}</p></div>
               </div>
               <div className="mt-4 space-y-3 text-sm">
                 {[
                   ["Network", selectedCryptoTransaction.network],
                   ["From address", selectedCryptoTransaction.fromAddress],
                   ["To address", selectedCryptoTransaction.toAddress],
                   ["Transaction hash", selectedCryptoTransaction.txHash || selectedCryptoTransaction.transactionHash],
                   ["Reference", selectedCryptoTransaction.reference || selectedCryptoTransaction.id],
                 ].filter(([, value]) => value).map(([label, value]) => (
                   <div key={label} className="border-b border-border pb-2">
                     <p className="text-xs text-muted-foreground">{label}</p>
                     <p className="break-all font-mono text-xs">{String(value)}</p>
                   </div>
                 ))}
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
        <AnimatePresence>
         {selectedDepositAddress && (
           <motion.div
             className="fixed inset-0 z-[150] flex items-end bg-black/50"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setSelectedDepositAddress(null)}
           >
             <motion.div
                className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl"
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 28, stiffness: 280 }}
               onClick={(event) => event.stopPropagation()}
             >
               <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-lg font-bold">{selectedCoin} deposit</p>
                   <p className="text-xs text-muted-foreground">{selectedDepositAddress.networkLabel || selectedDepositAddress.network}</p>
                 </div>
                 <button className="text-sm text-muted-foreground" onClick={() => setSelectedDepositAddress(null)}>Close</button>
               </div>
               {selectedDepositAddress.qrCodeUrl && (
                 <div className="mt-5 flex justify-center rounded-2xl bg-white p-4">
                   <img src={selectedDepositAddress.qrCodeUrl} alt={`${selectedCoin} deposit QR code`} className="h-52 w-52 object-contain" />
                 </div>
               )}
               <p className="mt-4 text-xs text-muted-foreground">Deposit address</p>
               <p className="mt-1 break-all rounded-xl bg-muted p-3 font-mono text-xs">{selectedDepositAddress.address}</p>
               <div className="mt-3 flex gap-2">
                 <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => copyToClipboard(selectedDepositAddress.address, "sheet-address")}>
                   {copied === "sheet-address" ? "Copied" : "Copy address"}
                 </button>
                 {selectedDepositAddress.memo && (
                   <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" onClick={() => copyToClipboard(selectedDepositAddress.memo, "sheet-memo")}>
                     {copied === "sheet-memo" ? "Memo copied" : "Copy memo"}
                   </button>
                 )}
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
        <AnimatePresence>
          {depositInstructions && (
            <motion.div
              className="fixed inset-0 z-[170] flex items-end bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDepositInstructions(null)}
            >
              <motion.div
                className="bottom-sheet-safe w-full rounded-t-3xl bg-background p-5 shadow-2xl"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ArrowDownToLine className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Send your deposit</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Send exactly {formatCryptoAmount(depositInstructions.amount)} {depositInstructions.coin} on the {depositInstructions.networkLabel || depositInstructions.network || "selected"} network.
                    </p>
                  </div>
                </div>
                {depositInstructions.qrCodeUrl && (
                  <div className="mt-4 flex justify-center rounded-2xl bg-white p-3">
                    <img src={depositInstructions.qrCodeUrl} alt={`${depositInstructions.coin} deposit QR code`} className="h-48 w-48 object-contain" />
                  </div>
                )}
                <div className="mt-4 rounded-2xl bg-muted p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Deposit address</p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">{depositInstructions.address || "Address unavailable"}</p>
                  <button
                    className="mt-2 text-xs font-semibold text-primary"
                    onClick={() => depositInstructions.address && copyToClipboard(depositInstructions.address, "instructions-address")}
                  >
                    {copied === "instructions-address" ? "Address copied" : "Copy address"}
                  </button>
                </div>
                {depositInstructions.memo && (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Memo / tag required</p>
                    <p className="mt-1 break-all font-mono text-sm font-bold text-amber-900 dark:text-amber-200">{depositInstructions.memo}</p>
                    <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">Include this memo or your funds may not be credited.</p>
                  </div>
                )}
                {depositInstructions.notes && <p className="mt-3 text-xs italic text-muted-foreground">{depositInstructions.notes}</p>}
                <div className="sticky bottom-0 -mx-5 mt-5 flex gap-2 border-t border-border bg-background/95 px-5 pt-4 backdrop-blur">
                  <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => setDepositInstructions(null)}>Close</button>
                  <button
                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                    onClick={() => {
                      setDepositInstructions(null);
                      setActiveTab("history");
                      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
                      toast({ title: "Deposit reported", description: "Your deposit is pending blockchain confirmation." });
                    }}
                  >
                    I have deposited
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
       <AnimatePresence>
         {depositReview && (
           <motion.div className="fixed inset-0 z-[160] flex items-end bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDepositReview(false)}>
              <motion.div className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(event) => event.stopPropagation()}>
               <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
               <p className="text-lg font-bold">Confirm deposit instructions</p>
               <p className="mt-1 text-xs text-muted-foreground">The selected admin address and network will be shown after confirmation.</p>
               <div className="mt-4 rounded-2xl bg-muted p-4 text-sm">
                 <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{formatCryptoAmount(depositAmount)} {selectedCoin}</span></div>
                  <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Estimated value</span><span>{Number(rates[selectedCoin]) > 0 ? formatUsdValue(Number(depositAmount || 0) * Number(rates[selectedCoin])) : "Rate unavailable"}</span></div>
               </div>
               <div className="mt-5 flex gap-2">
                 <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => setDepositReview(false)}>Edit</button>
                 <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" onClick={() => { setDepositReview(false); depositMutation.mutate({ coin: selectedCoin, amount: depositAmount }); }}>
                   Generate instructions
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
       <AnimatePresence>
         {withdrawReview && (
           <motion.div className="fixed inset-0 z-[160] flex items-end bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWithdrawReview(false)}>
              <motion.div className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(event) => event.stopPropagation()}>
               <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
               <p className="text-lg font-bold">Confirm withdrawal</p>
               <p className="mt-1 text-xs text-muted-foreground">Review the destination carefully. The withdrawal will still require your PIN or authenticator.</p>
               <div className="mt-4 rounded-2xl bg-muted p-4 text-sm">
                 <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>{formatCryptoAmount(withdrawAmount)} {selectedCoin}</span></div>
                  <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Estimated value</span><span>{Number(rates[selectedCoin]) > 0 ? formatUsdValue(Number(withdrawAmount || 0) * Number(rates[selectedCoin])) : "Rate unavailable"}</span></div>
                 <p className="mt-3 break-all font-mono text-xs text-muted-foreground">{withdrawAddress}</p>
               </div>
               <div className="mt-5 flex gap-2">
                 <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => setWithdrawReview(false)}>Edit</button>
                 <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" onClick={() => { setWithdrawReview(false); withdrawMutation.mutate({ coin: selectedCoin, amount: withdrawAmount, toAddress: withdrawAddress }); }}>
                   Continue
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
       <PINModal
        isOpen={!!securityPrompt}
        onClose={() => {
          setSecurityPrompt(null);
          setPendingSecurityAction(null);
        }}
        requiresPin={securityPrompt?.pin}
        requiresAuthenticator={securityPrompt?.authenticator}
         title="Confirm crypto transaction"
         description="Verify your PIN or authenticator before completing this crypto transaction."
        onSuccess={(pin, authenticatorCode) => {
          setSecurityPrompt(null);
           if (pendingSecurityAction?.kind === "transfer") transferMutation.mutate({ pin, authenticatorCode });
           if (pendingSecurityAction?.kind === "deposit") depositMutation.mutate({ ...pendingSecurityAction.payload, security: { pin, authenticatorCode } });
           if (pendingSecurityAction?.kind === "withdraw") withdrawMutation.mutate({ ...pendingSecurityAction.payload, security: { pin, authenticatorCode } });
          setPendingSecurityAction(null);
        }}
         isLoading={transferMutation.isPending || depositMutation.isPending || withdrawMutation.isPending}
      />
      <AnimatePresence>
        {selectedPopularCoin && (
          <motion.div
            className="fixed inset-0 z-[140] flex items-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPopularCoin(null)}
          >
            <motion.div
              className="bottom-sheet-safe w-full rounded-t-3xl bg-background border-t border-border p-5 shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{COIN_NAMES[selectedPopularCoin]} <span className="text-muted-foreground">{selectedPopularCoin}</span></p>
                  <p className="text-sm text-muted-foreground">Live market quote</p>
                </div>
                <div className="rounded-2xl bg-primary/10 px-4 py-2 text-right text-primary">
                   <p className="font-bold">{formatUsdPrice(rates[selectedPopularCoin])}</p>
                  <p className="text-[11px]">per {selectedPopularCoin}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">24h change</p>
                  <p className={`mt-1 font-semibold ${Number(changes24h[selectedPopularCoin]) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {typeof changes24h[selectedPopularCoin] === "number" ? `${changes24h[selectedPopularCoin] >= 0 ? "+" : ""}${changes24h[selectedPopularCoin].toFixed(2)}%` : "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-3">
                  <p className="text-xs text-muted-foreground">{localCurrency} reference</p>
                   <p className="mt-1 font-semibold">{usdToLocalRate > 0 ? `${localCurrency} ${(Number(rates[selectedPopularCoin] || 0) * usdToLocalRate).toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "Loading…"}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Quotes use the live USD crypto price and the current USD/{localCurrency} rate. The final conversion is recalculated at confirmation.</p>
              <div className="mt-5 flex gap-2">
                <button className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold" onClick={() => setSelectedPopularCoin(null)}>Close</button>
                <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground" onClick={() => { setSelectedPopularCoin(null); setActiveTab("transfer"); }}>Convert</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
