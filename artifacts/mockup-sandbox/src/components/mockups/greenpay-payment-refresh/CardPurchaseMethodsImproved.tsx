import { useState } from "react";
import { ArrowRight, Banknote, Bitcoin, Check, Info } from "lucide-react";
import "./_group.css";

type PaymentMethod = "bank_transfer" | "crypto";

const OPTIONS: Array<{
  id: PaymentMethod;
  title: string;
  detail: string;
  icon: typeof Banknote;
  eyebrow: string;
}> = [
  {
    id: "bank_transfer",
    title: "Bank transfer",
    detail: "Send from your bank account",
    icon: Banknote,
    eyebrow: "WIRE",
  },
  {
    id: "crypto",
    title: "Cryptocurrency",
    detail: "BTC, ETH, USDT, or USDC",
    icon: Bitcoin,
    eyebrow: "CRYPTO",
  },
];

export function CardPurchaseMethodsImproved() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-sm space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Virtual card</p>
          <h1 className="mt-1 text-xl font-bold">Choose how to pay</h1>
          <p className="mt-1 text-sm text-muted-foreground">International payments · card price in USD</p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">One-time card price</p>
              <p className="mt-1 text-2xl font-bold">USD 60.00</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary">FIXED PRICE</span>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Payment method</h2>
              <p className="mt-1 text-xs text-muted-foreground">Choose one to see its next steps.</p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">USD</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              const selected = paymentMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPaymentMethod(option.id)}
                  className={`relative min-h-36 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    selected ? "border-primary bg-primary/[0.055] shadow-sm" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <OptionIcon className="h-5 w-5" />
                    </span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      selected ? "border-primary bg-primary text-white" : "border-border bg-background"
                    }`}>
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                  </span>
                  <span className="mt-3 block text-[10px] font-bold tracking-[0.12em] text-primary">{option.eyebrow}</span>
                  <span className="mt-1 block text-sm font-semibold">{option.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.detail}</span>
                </button>
              );
            })}
          </div>
        </section>

        {paymentMethod === "bank_transfer" ? (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Transfer instructions</p>
                <p className="mt-1 text-xs text-muted-foreground">Use the bank details configured for your account.</p>
              </div>
              <Banknote className="h-5 w-5 shrink-0 text-primary" />
            </div>
            <div className="space-y-2 rounded-xl bg-muted/50 p-3 text-xs">
              <p className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Bank details</span><span className="font-semibold">Shown below</span></p>
              <p className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Transfer currency</span><span className="font-semibold">USD</span></p>
              <p className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Reference</span><span className="font-semibold">Your account number</span></p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed">Your card activates only after support verifies the transfer. Contact support first if your transfer needs a different currency amount.</p>
            </div>
            <button type="button" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Contact support
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        ) : (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Crypto payment</p>
                <p className="mt-1 text-xs text-muted-foreground">Choose a coin to get a live quote.</p>
              </div>
              <Bitcoin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-xs">
              <span className="text-muted-foreground">Exact amount</span>
              <span className="font-semibold">Quoted before you send</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">The card stays inactive until the crypto payment is verified.</p>
            <button type="button" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Get crypto quote
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
