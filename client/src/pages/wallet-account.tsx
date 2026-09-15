import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Building2, Clock3, Lock, Send, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WavyHeader } from "@/components/wavy-header";
import { useAuth } from "@/hooks/use-auth";
import { useWallets } from "@/hooks/use-wallets";
import { apiRequest } from "@/lib/queryClient";
import { formatNumber, getCurrencySymbol } from "@/lib/formatters";

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

  const transactions = useMemo(() => {
    const list = (transactionData as any)?.transactions || [];
    return list.filter((transaction: any) => String(transaction.currency).toUpperCase() === wallet?.currency.toUpperCase()).slice(0, 8);
  }, [transactionData, wallet?.currency]);
  const accounts = (accountData as any)?.accounts || (accountData as any)?.virtualAccounts || [];
  const virtualAccount = accounts.find((account: any) => String(account.currency).toUpperCase() === wallet?.currency.toUpperCase());
  const balance = Number(wallet?.balance || 0);
  const hold = Number(wallet?.holdAmount || 0);
  const withdrawalHold = Number(wallet?.withdrawalHoldAmount || 0);
  const available = Number(wallet?.availableBalance ?? Math.max(0, balance - hold - withdrawalHold));
  const symbol = getCurrencySymbol(wallet?.currency || "USD");

  if (isLoading) return <div className="min-h-screen bg-background"><WavyHeader size="sm" /><div className="p-6 text-center text-muted-foreground">Loading wallet…</div></div>;
  if (!wallet) return <div className="min-h-screen bg-background"><WavyHeader size="sm" /><div className="p-6 space-y-4"><Button variant="ghost" onClick={() => setLocation("/dashboard")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to dashboard</Button><p className="text-muted-foreground">Wallet not found.</p></div></div>;

  return (
    <div className="min-h-screen bg-background bottom-nav-safe">
      <WavyHeader size="sm" />
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Button variant="ghost" className="-ml-2" onClick={() => setLocation("/dashboard")}><ArrowLeft className="w-4 h-4 mr-2" /> Wallets</Button>
        <section className="rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-white/75">{wallet.label || "Wallet account"}</p><h1 className="text-2xl font-bold mt-1">{wallet.currency} account</h1></div>
            <Badge className="bg-white/15 text-white border-white/20">{wallet.isSuspended ? "Suspended" : "Active"}</Badge>
          </div>
          <p className="text-xs text-white/70 mt-7">Available balance</p>
          <p className="text-4xl font-bold mt-1">{symbol}{formatNumber(available, 2)}</p>
          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">Total balance</p><p className="font-semibold">{symbol}{formatNumber(balance, 2)}</p></div>
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">On hold</p><p className="font-semibold">{symbol}{formatNumber(hold + withdrawalHold, 2)}</p></div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          {[
            { label: "Deposit", icon: ArrowDownToLine, path: `/deposit?walletId=${wallet.id}` },
            { label: "Send", icon: Send, path: `/transfer?walletId=${wallet.id}` },
            { label: "Exchange", icon: ArrowLeftRight, path: `/exchange?walletId=${wallet.id}` },
            { label: "Withdraw", icon: ArrowUpRight, path: `/withdraw?walletId=${wallet.id}` },
          ].map(action => (
            <button key={action.label} onClick={() => setLocation(action.path)} className="rounded-2xl border border-border bg-card p-3 text-center hover:border-primary/50 transition-colors">
              <action.icon className="w-5 h-5 mx-auto text-primary" /><span className="block text-[11px] mt-1.5 font-medium">{action.label}</span>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><h2 className="font-semibold">Virtual account</h2></div><Badge variant="outline">{virtualAccount ? "Available" : "Not requested"}</Badge></div>
          {virtualAccount ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Receive money into your {wallet.currency} wallet using its account details.</p>
              <Button variant="outline" className="w-full" onClick={() => setLocation(`/virtual-accounts?currency=${wallet.currency}`)}>View account details</Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm"><p className="text-muted-foreground">Request a virtual account for this wallet to receive bank payments.</p><Button variant="outline" className="w-full" onClick={() => setLocation(`/virtual-accounts?currency=${wallet.currency}`)}>Request {wallet.currency} account</Button></div>
          )}
        </section>

        {(hold > 0 || withdrawalHold > 0) && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex gap-3"><Lock className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="font-semibold text-sm">Funds on hold</p><p className="text-xs text-muted-foreground mt-1">{symbol}{formatNumber(hold + withdrawalHold, 2)} is temporarily unavailable for spending.</p></div></section>
        )}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border"><div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-primary" /><h2 className="font-semibold">Recent transactions</h2></div><Button variant="ghost" size="sm" onClick={() => setLocation("/transactions")}>View all</Button></div>
          {transactions.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No transactions in this wallet yet.</p> : transactions.map((transaction: any) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3 p-4 border-b border-border last:border-0">
              <div className="min-w-0"><p className="text-sm font-medium capitalize truncate">{String(transaction.description || transaction.type).replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{transaction.status || "pending"}</p></div>
              <p className={`text-sm font-semibold ${["deposit", "receive"].includes(transaction.type) ? "text-emerald-600" : ""}`}>{["deposit", "receive"].includes(transaction.type) ? "+" : "-"}{symbol}{formatNumber(Math.abs(Number(transaction.amount || 0)), 2)}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}