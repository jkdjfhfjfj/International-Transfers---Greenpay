import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink, Info, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WavyHeader } from "@/components/wavy-header";

const MERCHANT_URL = "https://greenpay.co.ke";

export default function MerchantPayPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <WavyHeader size="sm" />
      <main className="mx-auto max-w-lg space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to dashboard"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Services</p>
            <h1 className="text-xl font-bold">Merchant Pay</h1>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Store className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Merchant</p>
              <a
                href={MERCHANT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                Greenpay.co.ke
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-bold">Merchant payment details</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            For merchant payments, use the current payment instructions published on Greenpay.co.ke. Virtual-card purchase instructions are available in the card purchase flow.
          </p>
          <a
            href={MERCHANT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View details at Greenpay.co.ke
            <ExternalLink className="h-4 w-4" />
          </a>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-relaxed">
            This page only provides instructions; it does not send or confirm a payment. Verify the current number and merchant name on Greenpay.co.ke before paying.
          </p>
        </div>
      </main>
    </div>
  );
}
