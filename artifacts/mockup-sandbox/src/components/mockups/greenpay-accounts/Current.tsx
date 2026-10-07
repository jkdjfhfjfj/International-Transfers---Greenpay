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
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Virtual account</h2>
            </div>
            <Badge variant="outline">Available</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Receive money into your USD wallet using its account details.</p>
          <Button variant="outline" className="mt-3 w-full">View account details</Button>
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
