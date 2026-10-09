import { useState } from "react";
import { Bitcoin, Check, CheckCircle2, CreditCard, Smartphone, Wallet } from "lucide-react";
import "./_group.css";

type PayMethod = "mobile" | "card" | "manual" | "crypto";

export function CardPurchaseRefresh() {
  const [method, setMethod] = useState<PayMethod>("manual");
  const [pending, setPending] = useState(false);
  const options = [
    { id: "mobile" as const, label: "Mobile money", helper: "Approve a prompt on your phone", icon: Smartphone },
    { id: "card" as const, label: "Debit or credit card", helper: "Continue to secure checkout", icon: CreditCard },
    { id: "manual" as const, label: "Paybill / Till", helper: "Pay by M-Pesa and submit the code", icon: Wallet },
    { id: "crypto" as const, label: "Cryptocurrency", helper: "Use the current live coin quote", icon: Bitcoin },
  ];

  return (
    <main className="min-h-screen bg-background px-4 pb-8 pt-5 text-foreground">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">GreenPay</p>
          <h1 className="mt-1 text-lg font-bold">Get your virtual card</h1>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">Secure checkout</span>
      </header>

      <section className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-5 text-white shadow-lg">
        <span className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-100">GreenPay</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/65">Virtual card</p>
            </div>
            <div className="flex gap-1"><span className="h-5 w-8 rounded bg-white/25" /><span className="h-5 w-5 rounded-full bg-white/35" /></div>
          </div>
          <p className="mt-7 font-mono text-lg tracking-[0.18em] text-white/85">••••  ••••  ••••  ••••</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.15em] text-white/55">Cardholder</p>
          <p className="text-xs font-semibold tracking-wide">YOUR NAME</p>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">One-time card price</p>
            <p className="mt-1 text-2xl font-bold">USD 60.00</p>
          </div>
          <span className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary">ONE-TIME</span>
        </div>
        <div className="mt-3 space-y-2 rounded-xl border border-teal-100 bg-teal-50/60 p-3">
          <div className="flex justify-between gap-3 text-xs">
            <span className="text-muted-foreground">KES equivalent</span>
            <span className="font-semibold">Loading live quote…</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Live USD/KES rate is fetched for the current card price.</p>
          <div className="flex justify-between gap-3 border-t border-primary/10 pt-2 text-xs">
            <span className="text-muted-foreground">GreenPay purchase fee</span><span className="font-semibold">USD 0.00</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Fixed price: the minimum and maximum purchase amounts are both USD 60.00. Provider or mobile-network charges, if any, are shown before confirmation.</p>
      </section>

      {pending ? (
        <section className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30" role="status">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800"><Check className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-bold">Payment awaiting confirmation</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Your card stays inactive until the payment provider or support verifies payment.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="mb-3">
            <h2 className="text-sm font-bold">Choose how to pay</h2>
            <p className="mt-1 text-xs text-muted-foreground">Options depend on your country and account.</p>
          </div>
          <div className="mb-4 space-y-2">
            {options.map(({ id, label, helper, icon: Icon }) => {
              const selected = method === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMethod(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                    selected ? "border-teal-700 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-teal-400"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{helper}</span>
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300"}`}>
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {!pending && method === "manual" && (
        <section className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h3 className="text-sm font-bold">Paybill / Till instructions</h3>
            <p className="mt-1 text-xs text-muted-foreground">Pay the exact current KES equivalent shown above.</p>
          </div>
          <div className="rounded-xl bg-muted/60 p-3 text-xs">
            <p className="flex justify-between gap-3"><span className="text-muted-foreground">Paybill</span><span className="font-semibold">Shown for your account</span></p>
            <p className="mt-2 flex justify-between gap-3"><span className="text-muted-foreground">Account</span><span className="font-semibold">Shown for your account</span></p>
          </div>
          <ol className="list-inside list-decimal space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>Open M-PESA and choose <strong className="text-foreground">Lipa na M-PESA → Pay Bill</strong>.</li>
            <li>Enter the Paybill and account numbers above.</li>
            <li>Enter the exact KES amount and review any M-PESA charge before confirming.</li>
            <li>Keep your transaction code and contact support for verification.</li>
          </ol>
          <div className="flex justify-between rounded-lg bg-muted/60 p-3 text-xs"><span className="text-muted-foreground">GreenPay fee</span><span className="font-semibold">KES 0.00</span></div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">The card is activated only after support verifies payment. Do not pay while the live KES quote is loading.</p>
        </section>
      )}

      {!pending && method === "crypto" && (
        <section className="mb-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-bold">Crypto payment quote</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The exact coin amount is returned when the payment request starts. Contact support for the payment address before sending.</p>
          <p className="mt-3 text-xs text-muted-foreground">Any blockchain network fee from your wallet is not included.</p>
        </section>
      )}

      {!pending && (
        <button onClick={() => setPending(true)} className="h-11 w-full rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">
          Continue securely
        </button>
      )}
      {pending && <div className="flex justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>}
    </main>
  );
}
