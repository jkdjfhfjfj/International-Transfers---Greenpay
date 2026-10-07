import "./_group.css";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  Check,
  Clock3,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Deposit", Icon: ArrowDownToLine },
  { label: "Send", Icon: Send },
  { label: "Exchange", Icon: ArrowLeftRight },
  { label: "Withdraw", Icon: ArrowUpRight },
];

const walletFigures = [
  { label: "Total balance", amount: "$2,430.75", note: "All wallet funds" },
  { label: "On hold", amount: "$85.25", note: "Temporarily unavailable", kind: "hold" },
  { label: "Withdrawal reserve", amount: "$210.00", note: "Reserved for withdrawal", kind: "reserve" },
];

const virtualAccounts = [
  { code: "EUR", name: "Euro", flag: "🇪🇺", total: "€740.00", hold: "€40.00", available: "€700.00" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", total: "$640.00", hold: "$40.00", available: "$600.00" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", total: "£528.80", hold: "£28.80", available: "£500.00" },
];

export function Refined() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Wallet account</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">USD account</h1>
          </div>
          <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800 hover:bg-emerald-50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Active
          </Badge>
        </header>

        <section
          className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:p-6"
          style={{ backgroundColor: "#0f766e", backgroundImage: "linear-gradient(125deg, #0f766e 0%, #0e8178 55%, #0f8b7e 100%)" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-5 -top-14 h-44 w-44 rounded-full border border-white/[0.08]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Ready to use</p>
                <p className="mt-2 text-sm text-white/80">Available balance</p>
                <p className="mt-1 text-[2.6rem] font-bold leading-none tracking-[-0.045em] sm:text-5xl">$2,135.50</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <ShieldCheck className="h-5 w-5 text-white/90" />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {walletFigures.map((figure) => (
                <div
                  key={figure.label}
                  className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.09] px-3.5 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    {figure.kind === "hold" ? (
                      <LockKeyhole className="h-3.5 w-3.5 text-amber-200" />
                    ) : figure.kind === "reserve" ? (
                      <Clock3 className="h-3.5 w-3.5 text-white/70" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-emerald-200" />
                    )}
                    <p className="truncate text-xs font-medium text-white/75">{figure.label}</p>
                  </div>
                  <p className="mt-2 text-lg font-bold tracking-tight tabular-nums">{figure.amount}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-white/55">{figure.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-white/70">
              $295.25 is reserved and excluded from your available balance.
            </p>
          </div>
        </section>

        <section aria-label="Wallet actions" className="grid grid-cols-4 gap-2">
          {actions.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-2 py-3 text-xs font-semibold text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              {label}
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">Virtual accounts</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Balances by currency · EUR, USD, GBP</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {virtualAccounts.map(account => (
              <article key={account.code} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg" aria-hidden="true">{account.flag}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{account.code} account</p>
                      <p className="text-[10px] text-muted-foreground">{account.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 gap-1.5 border-primary/20 bg-primary/5 text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Available
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Total", amount: account.total },
                    { label: "On hold", amount: account.hold },
                    { label: "Available", amount: account.available, available: true },
                  ].map(figure => (
                    <div key={figure.label} className={`min-w-0 rounded-lg border p-2.5 ${figure.available ? "border-primary/20 bg-primary/[0.06]" : "border-border bg-muted/60"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{figure.label}</p>
                      <p className={`mt-1 text-xs font-bold tabular-nums sm:text-sm ${figure.available ? "text-primary" : "text-foreground"}`}>{figure.amount}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-950">Funds reserved</p>
            <p className="mt-1 text-xs leading-5 text-amber-900/75">
              $85.25 is on hold and $210.00 is reserved for withdrawals. These funds are not included in your spendable balance.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Clock3 className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">Recent transactions</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Activity in this wallet</p>
            </div>
          </div>
          <div className="flex flex-col items-center px-5 py-7 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ArrowDownToLine className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold">No transactions yet</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
              Transactions made with this wallet will appear here.
            </p>
          </div>
        </section>
        <p className="pb-2 text-center text-[10px] text-muted-foreground">Wallet balance in USD · Virtual account balances in their listed currencies</p>
      </main>
    </div>
  );
}
