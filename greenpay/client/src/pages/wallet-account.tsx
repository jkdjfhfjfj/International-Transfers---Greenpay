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
const virtualAccountCurrencies = [
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
] as const;

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
  const {
    data: accountData,
    isLoading: isAccountsLoading,
    isError: isAccountsError,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["/api/virtual-accounts", wallet?.currency],
    enabled: !!wallet,
    queryFn: async () => (await apiRequest("GET", "/api/virtual-accounts")).json(),
  });

  const walletCurrency = String(wallet?.currency || "USD").toUpperCase();
  const transactions = useMemo(() => {
    const list = (transactionData as any)?.transactions || [];
    return list.filter((transaction: any) => String(transaction.currency).toUpperCase() === walletCurrency).slice(0, 8);
  }, [transactionData, walletCurrency]);
  const applications = (accountData as any)?.applications || [];
  const configuredVirtualCurrencies = (accountData as any)?.supportedCurrencies;
  const enabledVirtualCurrencies = new Set(
    (Array.isArray(configuredVirtualCurrencies)
      ? configuredVirtualCurrencies
      : virtualAccountCurrencies.map(({ code }) => code)
    ).map((currency: string) => String(currency).toUpperCase()),
  );
  const virtualAccountSummaries = virtualAccountCurrencies.map(currency => {
    const application = applications.find((item: any) =>
      String(item.currency).toUpperCase() === currency.code
    );
    const applicationStatus = String(application?.status || "").toLowerCase();
    const account = application?.virtualAccount || null;
    const enabled = enabledVirtualCurrencies.has(currency.code);
    let status = enabled ? "Not requested" : "Unavailable";
    if (isAccountsLoading) status = "Loading";
    else if (isAccountsError) status = "Could not load";
    else if (applicationStatus === "approved") {
      status = account?.isActive === false ? "Inactive" : account ? "Available" : "Setup pending";
    } else if (applicationStatus === "pending") status = "Under review";
    else if (applicationStatus === "rejected") status = "Action needed";
    else if (application) status = "In progress";

    const accountBalance = Number(account?.balance || 0);
    const accountHold = Number(account?.holdAmount || 0);
    const accountAvailable = Number(account?.availableBalance ?? Math.max(0, accountBalance - accountHold));
    let helperText = "No virtual account has been requested yet.";
    if (isAccountsLoading) helperText = "Loading virtual-account status.";
    else if (isAccountsError) helperText = "Could not load this account's status.";
    else if (applicationStatus === "pending") helperText = "Your application is being reviewed.";
    else if (applicationStatus === "rejected") helperText = "Review your application for the next steps.";
    else if (applicationStatus === "approved" && !account) helperText = "Your approved account details are being prepared.";
    else if (applicationStatus === "approved" && account?.isActive === false) helperText = "This virtual account is inactive.";
    else if (!application && !enabled) helperText = "Applications are not currently enabled for this currency.";
    else if (application && !["approved", "pending", "rejected"].includes(applicationStatus)) {
      helperText = "Your application is being processed.";
    } else if (application) helperText = "Receive bank payments into this currency account.";

    const actionLabel = isAccountsLoading || isAccountsError
      ? null
      : application
      ? applicationStatus === "approved" ? "View account details" : "View application"
      : enabled ? `Request ${currency.code} account` : null;

    return {
      ...currency,
      application,
      account,
      status,
      helperText,
      actionLabel,
      symbol: getCurrencySymbol(currency.code),
      accountBalance,
      accountHold,
      accountAvailable,
    };
  });
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
      <main className="max-w-2xl mx-auto p-4 pb-8 space-y-4">
        <section className="rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-white/75">{wallet.label || "Wallet account"}</p><h1 className="text-2xl font-bold mt-1">{walletCurrency} account</h1></div>
            <Badge className="bg-white/15 text-white border-white/20">{walletSuspended ? "Suspended" : "Active"}</Badge>
          </div>
          <p className="text-xs text-white/70 mt-7">Available balance</p>
          <p className="text-4xl font-bold mt-1">{symbol}{formatNumber(available, 2)}</p>
          <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-white/65">Total balance</p><p className="font-semibold">{symbol}{formatNumber(balance, 2)}</p></div>
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

        <section aria-labelledby="virtual-accounts-heading" data-testid="section-virtual-accounts" className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <div>
                <h2 id="virtual-accounts-heading" className="font-semibold">Virtual accounts</h2>
                <p className="text-xs text-muted-foreground">EUR, USD, and GBP account balances</p>
              </div>
            </div>
              {isAccountsError ? (
                <Button variant="ghost" size="sm" data-testid="button-retry-virtual-accounts" onClick={() => void refetchAccounts()}>Retry</Button>
              ) : (
                <Button variant="ghost" size="sm" data-testid="button-manage-virtual-accounts" onClick={() => setLocation("/virtual-accounts")}>Manage</Button>
              )}
          </div>
          <div className="space-y-3">
            {virtualAccountSummaries.map(account => {
              const badgeClass = account.status === "Available"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                : account.status === "Under review"
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                : account.status === "Action needed"
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                : "border-border text-muted-foreground";

              return (
                <article key={account.code} data-testid={`card-virtual-account-${account.code.toLowerCase()}`} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg" aria-hidden="true">{account.flag}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground" data-testid={`text-virtual-account-currency-${account.code.toLowerCase()}`}>{account.code} account</p>
                        <p className="text-xs text-muted-foreground">{account.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${badgeClass}`} data-testid={`status-virtual-account-${account.code.toLowerCase()}`}>{account.status}</Badge>
                  </div>
                  {account.account ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: "Total", amount: account.accountBalance },
                        { label: "On hold", amount: account.accountHold },
                        { label: "Available", amount: account.accountAvailable, available: true },
                      ].map(figure => (
                        <div key={figure.label} className={`min-w-0 rounded-lg p-2 ${figure.available ? "bg-primary/10" : "bg-muted"}`}>
                          <p className="text-[10px] text-muted-foreground">{figure.label}</p>
                          <p
                            className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${figure.available ? "text-primary" : "text-foreground"}`}
                            data-testid={figure.available ? `text-virtual-account-available-${account.code.toLowerCase()}` : undefined}
                          >
                            {account.symbol}{formatNumber(figure.amount, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">{account.helperText}</p>
                  )}
                  {account.actionLabel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      data-testid={`button-virtual-account-open-${account.code.toLowerCase()}`}
                      onClick={() => setLocation(`/virtual-accounts?currency=${account.code}`)}
                    >
                      {account.actionLabel}
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
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