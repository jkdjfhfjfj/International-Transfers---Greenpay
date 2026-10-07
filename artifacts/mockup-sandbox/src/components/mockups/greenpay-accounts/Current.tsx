import "./_group.css";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Building2, Clock3, Lock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Deposit", Icon: ArrowDownToLine },
  { label: "Send", Icon: Send },
  { label: "Exchange", Icon: ArrowLeftRight },
  { label: "Withdraw", Icon: ArrowUpRight },
];

const virtualAccounts = [
  { code: "EUR", name: "Euro", flag: "🇪🇺", total: "€740.00", hold: "€40.00", available: "€700.00" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", total: "$640.00", hold: "$40.00", available: "$600.00" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", total: "£528.80", hold: "£28.80", available: "£500.00" },
];

export function Current() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Wallet account</p>
            <h1 className="mt-1 text-2xl font-bold">USD account</h1>
          </div>
          <Badge className="border-white/20 bg-primary text-primary-foreground">Active</Badge>
        </header>

        <section className="rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-5 text-white shadow-lg">
          <p className="text-xs text-white/70">Available balance</p>
          <p className="mt-1 text-4xl font-bold">$2,135.50</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-white/65">Total balance</p>
              <p className="font-semibold">$2,430.75</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-white/65">Available</p>
              <p className="font-semibold">$2,135.50</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-white/65">On hold</p>
              <p className="font-semibold">$85.25</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs text-white/65">Withdrawal hold</p>
              <p className="font-semibold">$210.00</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          {actions.map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs font-medium">
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <div>
              <h2 className="font-semibold">Virtual accounts</h2>
              <p className="text-xs text-muted-foreground">EUR, USD, and GBP</p>
            </div>
          </div>
          <div className="space-y-2">
            {virtualAccounts.map(account => (
              <div key={account.code} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{account.flag}</span>
                    <div>
                      <p className="text-sm font-semibold">{account.code} account</p>
                      <p className="text-[10px] text-muted-foreground">{account.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Total", amount: account.total },
                    { label: "On hold", amount: account.hold },
                    { label: "Available", amount: account.available },
                  ].map(figure => (
                    <div key={figure.label} className="min-w-0 rounded-lg bg-muted p-2">
                      <p className="text-[10px] text-muted-foreground">{figure.label}</p>
                      <p className={`mt-0.5 truncate text-xs font-semibold ${figure.label === "Available" ? "text-primary" : ""}`}>{figure.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold">Funds reserved</p>
              <p className="mt-1 text-xs text-muted-foreground">$295.25 is temporarily unavailable for spending: $85.25 on hold and $210.00 reserved for withdrawals.</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <Clock3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Recent transactions</h2>
          </div>
          <p className="p-6 text-center text-sm text-muted-foreground">No transactions in this wallet yet.</p>
        </section>
      </main>
    </div>
  );
}
