import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, CreditCard, Smartphone, Wallet } from "lucide-react";
import "./_group.css";

type DepositMethod = "mpesa" | "manual" | "card";

export function DepositRefresh() {
  const [method, setMethod] = useState<DepositMethod>("mpesa");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "complete">("idle");

  const methods = [
    { id: "mpesa" as const, title: "Mobile money", detail: "Approve a prompt on your phone", icon: Smartphone },
    { id: "manual" as const, title: "Manual M-Pesa", detail: "Pay by Paybill, then submit the code", icon: Wallet },
    { id: "card" as const, title: "Debit or credit card", detail: "Continue to secure checkout", icon: CreditCard },
  ];

  return (
    <main className="min-h-screen bg-background px-4 pb-8 pt-5 text-foreground">
      <header className="mb-5 flex items-center gap-3">
        <button aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">GreenPay</p>
          <h1 className="text-lg font-bold">Add money</h1>
        </div>
      </header>

      <section className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Destination wallet</p>
            <p className="mt-1 font-semibold">Kenyan shilling wallet</p>
          </div>
          <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">KES</span>
        </div>
      </section>

      {status === "idle" ? (
        <>
          <section className="mb-5">
            <div className="mb-3">
              <h2 className="text-sm font-bold">Choose how to deposit</h2>
              <p className="mt-1 text-xs text-muted-foreground">Select a payment method for your KES wallet.</p>
            </div>
            <div className="space-y-2.5">
              {methods.map(({ id, title, detail, icon: Icon }) => {
                const selected = method === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setMethod(id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                      selected ? "border-teal-700 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-teal-400"
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
                    </span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300"}`}>
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {method !== "manual" ? (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <label htmlFor="deposit-amount" className="block text-xs font-semibold text-muted-foreground">Amount to pay</label>
              <div className="flex h-12 items-center rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/30">
                <span className="shrink-0 border-r border-border px-3 text-sm font-bold text-muted-foreground">KES</span>
                <input
                  id="deposit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Live conversion rate</span>
                  <span className="font-semibold">1 KES = 1 KES</span>
                </div>
                {amount && (
                  <div className="mt-2 flex justify-between gap-3 border-t border-primary/10 pt-2 text-xs">
                    <span className="text-muted-foreground">Estimated wallet credit</span>
                    <span className="font-semibold">KES {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between gap-3 border-t border-primary/10 pt-2 text-xs">
                  <span className="text-muted-foreground">GreenPay deposit fee</span><span className="font-semibold">KES 0.00</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">KES deposits to a KES wallet are credited at 1:1. Provider fees, if any, are shown before payment confirmation.</p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Card deposits require at least USD 10 equivalent. Provider limits and fees may apply.
              </p>
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Continue to payment <ArrowRight className="h-4 w-4" />
              </button>
              {method === "mpesa" && <p className="text-center text-xs text-muted-foreground">A payment prompt will be sent to your phone.</p>}
            </section>
          ) : (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold">Manual M-Pesa instructions</h3>
                <p className="mt-1 text-xs text-muted-foreground">Enter the amount and transaction code after paying.</p>
              </div>
              <div className="space-y-2 rounded-xl bg-muted/60 p-3 text-xs">
                <p className="flex justify-between gap-3"><span className="text-muted-foreground">Paybill</span><span className="font-semibold">Shown for your account</span></p>
                <p className="flex justify-between gap-3"><span className="text-muted-foreground">Account</span><span className="font-semibold">Shown for your account</span></p>
              </div>
              <label htmlFor="manual-deposit-amount" className="block text-xs font-semibold text-muted-foreground">Amount (KES)</label>
              <div className="flex h-11 items-center rounded-xl border border-input bg-background">
                <span className="border-r border-border px-3 text-xs font-bold text-muted-foreground">KES</span>
                <input
                  id="manual-deposit-amount"
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="0.00"
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="flex justify-between rounded-lg bg-muted/60 p-3 text-xs">
                <span className="text-muted-foreground">GreenPay deposit fee</span><span className="font-semibold">KES 0.00</span>
              </div>
              <label htmlFor="manual-deposit-reference" className="block text-xs font-semibold text-muted-foreground">M-PESA transaction code</label>
              <input id="manual-deposit-reference" placeholder="Enter the code after you pay" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground/60" />
              <ol className="list-inside list-decimal space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li>Open M-PESA and select <strong className="text-foreground">Lipa na M-PESA → Pay Bill</strong>.</li>
                <li>Enter the Paybill and account details above.</li>
                <li>Send the exact KES amount and keep the transaction code.</li>
                <li>Submit the code for review. Your wallet is credited after verification.</li>
              </ol>
              <p className="rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">Accepts KES 0.01–99,999,999.99. M-PESA may enforce lower transaction limits or fees.</p>
              <button onClick={() => setStatus("pending")} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">Submit for verification</button>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-2xl border border-primary/15 bg-card p-5 text-center shadow-sm">
          {status === "pending" ? (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock3 className="h-6 w-6" />
              </span>
              <h2 className="mt-3 font-bold">{method === "manual" ? "Submitted for review" : "Payment pending"}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {method === "manual"
                  ? "Your deposit remains pending until the M-Pesa transaction code is verified."
                  : "Complete the payment prompt. Your wallet will be credited after confirmation."}
              </p>
              <button onClick={() => setStatus("complete")} className="mt-4 text-xs font-semibold text-primary">
                {method === "manual" ? "Show verified state" : "Show confirmed state"}
              </button>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="mt-3 font-bold">Deposit confirmed</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your wallet balance has been updated.</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
