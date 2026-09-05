import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { Copy, Check, ArrowDownToLine, ArrowUpFromLine, CreditCard, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRightLeft } from "lucide-react";

const COIN_COLORS: Record<string, { accent: string; tint: string }> = {
  BTC: { accent: '#f97316', tint: 'rgba(249,115,22,0.10)' },
  ETH: { accent: '#6366f1', tint: 'rgba(99,102,241,0.10)' },
  USDT: { accent: '#16a34a', tint: 'rgba(22,163,74,0.10)' },
  USDC: { accent: '#2563eb', tint: 'rgba(37,99,235,0.10)' },
};

const COIN_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  USDT: "₮",
  USDC: "◎",
};

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  USDT: "Tether USD",
  USDC: "USD Coin",
};

const COIN_NETWORKS: Record<string, string> = {
  BTC: "Bitcoin Network",
  ETH: "Ethereum (ERC-20)",
  USDT: "TRON (TRC-20)",
  USDC: "Ethereum (ERC-20)",
};

type Tab = "wallets" | "deposit" | "withdraw" | "transfer" | "history";

export default function CryptoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("wallets");
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [transferSource, setTransferSource] = useState("");
  const [transferDestination, setTransferDestination] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const { user } = useAuth();
  const { wallets: userWallets } = useWallets();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: walletsData, isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/crypto/wallets"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/crypto/wallets");
      return res.json();
    },
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

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/crypto/transactions"],
    enabled: !!user?.id && activeTab === "history",
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/crypto/transactions");
      return res.json();
    },
  });

  const depositMutation = useMutation({
    mutationFn: async ({ coin, amount }: { coin: string; amount: string }) => {
      const res = await apiRequest("POST", "/api/crypto/deposit", { coin, amount: parseFloat(amount) });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Deposit Initiated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
      setDepositAmount("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to initiate deposit", variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ coin, amount, toAddress }: { coin: string; amount: string; toAddress: string }) => {
      const res = await apiRequest("POST", "/api/crypto/withdraw", { coin, amount: parseFloat(amount), toAddress });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Withdrawal Initiated", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
      setWithdrawAmount("");
      setWithdrawAddress("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || "Failed to process withdrawal", variant: "destructive" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
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
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Transfer failed");
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer completed",
        description: `${Number(data.sourceAmount).toFixed(8)} ${data.sourceCoin || "fiat"} moved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-card", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crypto/transactions"] });
      setTransferAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
    },
  });

  const wallets: any[] = (walletsData as any)?.wallets || [];
  const rates: Record<string, number> = (walletsData as any)?.rates || {};
  const changes24h: Record<string, number> = (walletsData as any)?.changes24h || {};
  const priceSource = (walletsData as any)?.source || "coingecko";
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

  const addressesByCoin: Record<string, any[]> = allDepositAddresses.reduce((acc, addr) => {
    const c = (addr.coin || "").toUpperCase();
    if (!acc[c]) acc[c] = [];
    acc[c].push(addr);
    return acc;
  }, {} as Record<string, any[]>);

  const selectedWallet = wallets.find(w => w.coin === selectedCoin);
  const selectedCoinAddresses = addressesByCoin[selectedCoin] || [];
  const totalUsdValue = wallets.reduce((s, w) => s + parseFloat(w.usdBalance || "0"), 0);

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
    { id: "deposit", label: "Deposit", icon: "arrow_downward" },
    { id: "withdraw", label: "Withdraw", icon: "arrow_upward" },
    { id: "transfer", label: "Transfer", icon: "swap_horiz" },
    { id: "history", label: "History", icon: "history" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
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
          <p className="text-xs text-white/60 mt-1">{wallets.length} wallets · {Object.keys(rates).length} supported coins · {priceSource === "coingecko" ? "Live prices" : "Cached prices"}</p>
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
                const coinMeta = COIN_COLORS[wallet.coin] || { accent: '#475569', tint: 'rgba(71,85,105,0.10)' };
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
                      <p className="font-bold text-foreground">{parseFloat(wallet.balance || "0").toFixed(6)}</p>
                       <p className="text-xs text-muted-foreground">≈ ${wallet.usdBalance}</p>
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

                   <p className="text-xs text-muted-foreground mt-2">1 {wallet.coin} = ${(rates[wallet.coin] || 1).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* DEPOSIT TAB */}
          {activeTab === "deposit" && (
            <motion.div key="deposit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">Send crypto to your wallet address. Funds will be credited after the required number of blockchain confirmations.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select Coin</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => {
                      const cm = COIN_COLORS[coin] || { accent: '#475569', tint: 'rgba(71,85,105,0.10)' };
                      const active = selectedCoin === coin;
                      return (
                        <button
                          key={coin}
                          onClick={() => setSelectedCoin(coin)}
                          className="py-2 rounded-xl text-sm font-bold transition-all"
                          style={active
                            ? { background: cm.accent, color: '#fff' }
                            : { background: cm.tint, color: cm.accent }
                          }
                        >
                          {coin}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCoinAddresses.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">No {selectedCoin} deposit addresses are currently available. Please check back shortly or contact support.</p>
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
                        {addr.memo && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-orange-600 dark:text-orange-400">Memo/Tag:</span>
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
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount to Deposit ({selectedCoin})</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder={`0.00000000`}
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{selectedCoin}</span>
                  </div>
                  {depositAmount && (
                    <p className="text-xs text-muted-foreground">≈ ${(parseFloat(depositAmount || "0") * (rates[selectedCoin] || 1)).toFixed(2)} USD</p>
                  )}
                </div>

                <button
                  onClick={() => depositMutation.mutate({ coin: selectedCoin, amount: depositAmount })}
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
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700 dark:text-orange-300">Withdrawals are deducted from your USD wallet balance at current exchange rates. Processing takes 30–60 minutes.</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Select Coin</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => {
                      const cm = COIN_COLORS[coin] || { accent: '#475569', tint: 'rgba(71,85,105,0.10)' };
                      const active = selectedCoin === coin;
                      return (
                        <button
                          key={coin}
                          onClick={() => setSelectedCoin(coin)}
                          className="py-2 rounded-xl text-sm font-bold transition-all"
                          style={active
                            ? { background: cm.accent, color: '#fff' }
                            : { background: cm.tint, color: cm.accent }
                          }
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
                      type="number"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="0.00000000"
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{selectedCoin}</span>
                  </div>
                  {withdrawAmount && (
                    <p className="text-xs text-muted-foreground">≈ ${(parseFloat(withdrawAmount || "0") * (rates[selectedCoin] || 1)).toFixed(2)} USD will be deducted</p>
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
                  onClick={() => withdrawMutation.mutate({ coin: selectedCoin, amount: withdrawAmount, toAddress: withdrawAddress })}
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
                  <input type="number" min="0.00000001" step="any" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} placeholder="0.00" className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background" />
                </div>
                <button
                  onClick={() => transferMutation.mutate()}
                  disabled={!selectedSource || !selectedDestination || !transferAmount || Number(transferAmount) <= 0 || transferMutation.isPending}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  {transferMutation.isPending ? "Transferring..." : "Transfer funds"}
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
                <motion.div key={tx.id} whileHover={{ scale: 1.01 }} className="bg-card border border-border rounded-xl p-3.5 elevation-1">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${COIN_COLORS[tx.coin] || "from-gray-400 to-gray-500"} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
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
                      <p className="text-sm font-semibold text-primary mt-0.5">{parseFloat(tx.amount).toFixed(6)} {tx.coin}</p>
                      <p className="text-xs text-muted-foreground">≈ ${tx.usdValue} USD</p>
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
    </div>
  );
}
