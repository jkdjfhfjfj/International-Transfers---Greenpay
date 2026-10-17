import { motion } from "framer-motion";
import { WavyHeader } from "@/components/wavy-header";

const MERCHANT_URL = "https://greenpay.co.ke";

export default function MerchantPayPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <WavyHeader
        size="md"
      />
      <main className="mx-auto mt-5 max-w-lg space-y-4 px-4 pb-28 md:pb-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
        >
          <div className="space-y-4 p-5">
            <h1 className="text-lg font-semibold text-foreground">Before you pay</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Check Greenpay.co.ke for the latest payment method, amount, merchant name, and reference before sending money.
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3"><span className="font-semibold text-primary">1.</span> Confirm the payment method and amount on the official site.</li>
              <li className="flex gap-3"><span className="font-semibold text-primary">2.</span> Check the merchant name and reference before confirming.</li>
            </ol>
            <a
              href={MERCHANT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              data-testid="button-open-merchant-guidance"
            >
              Open official site
            </a>
            <p className="text-xs leading-relaxed text-muted-foreground">
              This screen does not process or confirm payments. Use only the current instructions published by Greenpay.co.ke.
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
