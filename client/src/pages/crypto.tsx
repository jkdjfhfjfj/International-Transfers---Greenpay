import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";
import { Copy, Check, ArrowDownToLine, ArrowUpFromLine, CreditCard, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const COIN_COLORS: Record<string, string> = {
  BTC: "from-orange-500 to-yellow-500",
  ETH: "from-purple-500 to-indigo-500",
  USDT: "from-green-500 to-teal-500",
  USDC: "from-blue-500 to-cyan-500",
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

type Tab = "wallets" | "deposit" | "withdraw" | "history";

export default function CryptoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("wallets");
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const { user } = useAuth();
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

  const wallets: any[] = (walletsData as any)?.wallets || [];
  const rates: Record<string, number> = (walletsData as any)?.rates || {};
  const history: any[] = (historyData as any)?.transactions || [];

  const selectedWallet = wallets.find(w => w.coin === selectedCoin);
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
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 text-white"
        >
          <p className="text-sm text-white/70 mb-1">Crypto Portfolio</p>
          <p className="text-3xl font-bold">${totalUsdValue.toFixed(2)}</p>
          <p className="text-xs text-white/60 mt-1">{wallets.length} wallets · {Object.keys(rates).length} supported coins</p>
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
              ) : wallets.map((wallet: any) => (
                <motion.div
                  key={wallet.id}
                  whileHover={{ scale: 1.01 }}
                  className={`bg-gradient-to-r ${COIN_COLORS[wallet.coin] || "from-gray-500 to-gray-600"} p-4 rounded-2xl text-white`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                        {COIN_ICONS[wallet.coin] || wallet.coin[0]}
                      </div>
                      <div>
                        <p className="font-bold">{wallet.coin}</p>
                        <p className="text-xs text-white/70">{COIN_NAMES[wallet.coin] || wallet.coin}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{parseFloat(wallet.balance || "0").toFixed(6)}</p>
                      <p className="text-xs text-white/70">≈ ${wallet.usdBalance}</p>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-xs text-white/60 mb-1">{COIN_NETWORKS[wallet.coin] || "Network"} · Deposit Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs flex-1 truncate">{wallet.address}</p>
                      <button
                        onClick={() => copyToClipboard(wallet.address, wallet.id)}
                        className="shrink-0 w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {copied === wallet.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/50 mt-2">1 {wallet.coin} = ${(rates[wallet.coin] || 1).toLocaleString()}</p>
                </motion.div>
              ))}
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
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => (
                      <button
                        key={coin}
                        onClick={() => setSelectedCoin(coin)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all ${selectedCoin === coin ? `bg-gradient-to-r ${COIN_COLORS[coin]} text-white shadow-md` : "bg-muted text-muted-foreground"}`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedWallet && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Your {selectedCoin} Address</label>
                    <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                      <p className="font-mono text-xs flex-1 break-all">{selectedWallet.address}</p>
                      <button
                        onClick={() => copyToClipboard(selectedWallet.address, "deposit-addr")}
                        className="shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
                      >
                        {copied === "deposit-addr" ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Network: {COIN_NETWORKS[selectedCoin]}</p>
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
                    {["BTC", "ETH", "USDT", "USDC"].map(coin => (
                      <button
                        key={coin}
                        onClick={() => setSelectedCoin(coin)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all ${selectedCoin === coin ? `bg-gradient-to-r ${COIN_COLORS[coin]} text-white shadow-md` : "bg-muted text-muted-foreground"}`}
                      >
                        {coin}
                      </button>
                    ))}
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
                  <p className="text-xs text-muted-foreground">Your available USD balance: <span className="font-bold text-foreground">${parseFloat(user?.balance || "0").toFixed(2)}</span></p>
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
