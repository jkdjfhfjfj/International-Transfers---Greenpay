import { motion } from "framer-motion";
import { ExternalLink, Info, ShieldCheck, Store } from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";

const MERCHANT_URL = "https://greenpay.co.ke";

export default function MerchantPayPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <WavyHeader
        size="md"
        title="Merchant Pay"
        subtitle="Payment guidance for Greenpay merchants"
        icon={<Store className="h-5 w-5 text-white" />}
      />
      <main className="mx-auto -mt-1 max-w-lg space-y-5 px-4 pb-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Official merchant guidance</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">Pay with current merchant details</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Check Greenpay.co.ke for the latest payment instructions before sending money.
                </p>
              </div>
            </div>

            <a
              href={MERCHANT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              data-testid="button-open-merchant-guidance"
            >
              Open Greenpay.co.ke
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </motion.section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">Before you pay</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">1</span>
              Confirm the payment method and amount on the official site.
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">2</span>
              Check the merchant name and reference before confirming.
            </li>
          </ul>
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 text-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Safe payment reminder</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              This screen does not process or confirm payments. Use only the current instructions published by Greenpay.co.ke.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
