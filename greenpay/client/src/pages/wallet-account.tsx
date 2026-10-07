import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Building2, Clock3, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WavyHeader } from "@/components/wavy-header";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { apiRequest } from "@/lib/queryClient";
import { formatNumber, getCurrencySymbol } from "@/lib/formatters";

const incomingTransactionTypes = new Set(["deposit", "receive", "refund"]);

function transactionLabel(transaction: any): string {
  return String(transaction.description || transaction.type || "Transaction")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function transactionDate(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WalletAccountPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/wallet/:walletId");
  const { user } = useAuth();
  const { wallets, isLoading } = useWallets();
  const wallet = wallets.find(item => item.id === params?.walletId);
  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await apiRequest("GET", `/api/transactions/${user?.id}`)).json(),
  });
  const { data: accountData } = useQuery({
    queryKey: ["/api/virtual-accounts", wallet?.currency],
    enabled: !!wallet,
    queryFn: async () => (await apiRequest("GET", "/api/virtual-accounts")).json(),
  });

  const walletCurrency = String(wallet?.currency || "USD").toUpperCase();
  const transactions = useMemo(() => {
    const list = (transactionData as any)?.transactions || [];
    return list.filter((transaction: any) => String(transaction.currency).toUpperCase() === walletCurrency).slice(0, 8);
  }, [transactionData, walletCurrency]);
  const accounts = (accountData as any)?.accounts || (accountData as any)?.virtualAccounts || [];
  const virtualAccount = accounts.find((account: any) => String(account.currency).toUpperCase() === walletCurrency);
  const balance = Number(wallet?.balance || 0);
  const hold = Number(wallet?.holdAmount || 0);
  const withdrawalHold = Number(wallet?.withdrawalHoldAmount || 0);
  const reserved = hold + withdrawalHold;
  const available = Math.max(0, Number(wallet?.availableBalance ?? (balance - reserved)));
  const symbol = getCurrencySymbol(walletCurrency);
  const walletSuspended = Boolean(wallet?.isSuspended || !wallet?.isActive);

  if (isLoading) return <div className="min-h-screen bg-background"><WavyHeader size="sm" /><div className="p-6 text-center text-muted-foreground">Loading wallet…</div></div>;
  if (!wallet) return <div className="min-h-screen bg-background"><WavyHeader size="sm" /><div className="p-6"><p className="text-muted-foreground">Wallet not found.</p></div></div>;

  return (
    <div className="min-h-screen bg-background bottom-nav-safe">
      <WavyHeader size="sm" />
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <section className="rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-white/75">{wallet.label || "Wallet account"}</p><h1 className="text-2xl font-bold mt-1">{walletCurrency} account</h1></div>
            <Badge className="bg-white/15 text-white border-white/20">{walletSuspended ? "Suspended" : "Active"}</Badge>
          </div>
          <p className="text-xs text-white/70 mt-7">Available balance</p>
          <p className="text-4xl font-bold mt-1">{symbol}{formatNumber(available, 2)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-sm">
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">Total balance</p><p className="font-semibold">{symbol}{formatNumber(balance, 2)}</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">Available</p><p className="font-semibold">{symbol}{formatNumber(available, 2)}</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">On hold</p><p className="font-semibold">{symbol}{formatNumber(hold, 2)}</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">Withdrawal hold</p><p className="font-semibold">{symbol}{formatNumber(withdrawalHold, 2)}</p></div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          {[
            { label: "Deposit", icon: ArrowDownToLine, path: `/deposit?walletId=${wallet.id}` },
            { label: "Send", icon: Send, path: `/transfer?walletId=${wallet.id}` },
            { label: "Exchange", icon: ArrowLeftRight, path: `/exchange?walletId=${wallet.id}` },
            { label: "Withdraw", icon: ArrowUpRight, path: `/withdraw?walletId=${wallet.id}` },
          ].map(action => (
            <button key={action.label} disabled={walletSuspended} onClick={() => setLocation(action.path)} className="rounded-2xl border border-border bg-card p-3 text-center hover:border-primary/50 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
              <action.icon className="w-5 h-5 mx-auto text-primary" /><span className="block text-[11px] mt-1.5 font-medium">{action.label}</span>
            </button>
          ))}
        </section>
        {walletSuspended && (
          <section className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
            This wallet is unavailable for new transactions. Contact support if you think this is a mistake.
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><h2 className="font-semibold">Virtual account</h2></div><Badge variant="outline">{virtualAccount ? "Available" : "Not requested"}</Badge></div>
          {virtualAccount ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Receive money into your {walletCurrency} wallet using its account details.</p>
              <Button variant="outline" className="w-full" onClick={() => setLocation(`/virtual-accounts?currency=${walletCurrency}`)}>View account details</Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm"><p className="text-muted-foreground">Request a virtual account for this wallet to receive bank payments.</p><Button variant="outline" className="w-full" onClick={() => setLocation(`/virtual-accounts?currency=${walletCurrency}`)}>Request {walletCurrency} account</Button></div>
          )}
        </section>

        {(hold > 0 || withdrawalHold > 0) && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex gap-3"><Lock className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="font-semibold text-sm">Funds reserved</p><p className="text-xs text-muted-foreground mt-1">{symbol}{formatNumber(reserved, 2)} is temporarily unavailable for spending: {symbol}{formatNumber(hold, 2)} on hold and {symbol}{formatNumber(withdrawalHold, 2)} reserved for withdrawals.</p></div></section>
        )}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border"><div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-primary" /><h2 className="font-semibold">Recent transactions</h2></div><Button variant="ghost" size="sm" onClick={() => setLocation("/transactions")}>View all</Button></div>
          {transactions.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No transactions in this wallet yet.</p> : transactions.map((transaction: any) => {
            const type = String(transaction.type || "").toLowerCase();
            const incoming = incomingTransactionTypes.has(type);
            const pending = String(transaction.status || "pending").toLowerCase() === "pending";
            const TransactionIcon = incoming ? ArrowDownToLine : type === "exchange" ? ArrowLeftRight : ArrowUpRight;
            return (
              <div key={transaction.id} className="flex items-center justify-between gap-3 p-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${incoming ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"}`}>
                  <TransactionIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{transactionLabel(transaction)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${pending ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" : "border-border text-muted-foreground"}`}>
                      {transaction.status || "pending"}
                    </Badge>
                    {transactionDate(transaction.createdAt) && <span className="text-[11px] text-muted-foreground">{transactionDate(transaction.createdAt)}</span>}
                  </div>
                </div>
                <p className={`text-sm font-semibold whitespace-nowrap ${incoming ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {incoming ? "+" : "-"}{symbol}{formatNumber(Math.abs(Number(transaction.amount || 0)), 2)}
                </p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}