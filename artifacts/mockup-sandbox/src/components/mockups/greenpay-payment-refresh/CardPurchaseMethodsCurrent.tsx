import { useState } from "react";
import { Bitcoin, Check, Smartphone, CreditCard, CircleDollarSign } from "lucide-react";
import "./_group.css";

type PaymentMethod = "mobile_money" | "card" | "manual" | "crypto";

const OPTIONS = [
  {
    id: "crypto" as const,
    title: "Cryptocurrency",
    detail: "Pay the live quoted amount in BTC, ETH, USDT, or USDC.",
    icon: Bitcoin,
  },
];

export function CardPurchaseMethodsCurrent() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-sm space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Virtual card</p>
          <h1 className="mt-1 text-xl font-bold">Choose how to pay</h1>
          <p className="mt-1 text-sm text-muted-foreground">Available options depend on your country and account settings.</p>
        </header>

        <section className="space-y-3" aria-label="Current payment methods">
          {OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const selected = paymentMethod === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPaymentMethod(option.id)}
                className={`group w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selected ? "border-primary bg-primary/[0.055] shadow-sm" : "border-border/80 bg-card hover:border-primary/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <OptionIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{option.detail}</span>
                  </span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-primary bg-primary text-white" : "border-border bg-background"
                  }`}>
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                </span>
              </button>
            );
          })}
        </section>

        <p className="rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
          Bank transfer is not listed for this non-KES account.
        </p>
      </div>
    </main>
  );
}
