import { WifiOff, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-5 py-8 text-foreground">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col items-center justify-center">
        <div className="w-full rounded-[2rem] border border-border bg-card/95 p-7 text-center shadow-xl backdrop-blur">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 text-primary">
            <WifiOff className="h-10 w-10" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-primary">GreenPay</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Connection interrupted</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your account is safe, but live money operations need an internet connection. Reconnect and try again when you are ready.
          </p>
          <Button className="mt-7 w-full gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Check connection
          </Button>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-border bg-muted/40 p-3">
              <Smartphone className="h-4 w-4 text-primary" />
              <p className="mt-2 text-xs font-semibold">Reconnect your device</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Check Wi-Fi or mobile data.</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="mt-2 text-xs font-semibold">Your funds are safe</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">No action was submitted offline.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}