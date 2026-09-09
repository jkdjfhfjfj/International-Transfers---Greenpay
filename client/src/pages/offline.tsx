import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card text-primary shadow-sm">
          <WifiOff className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">GreenPay</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">You are offline</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Check your connection and try again. GreenPay will return to your account when you are back online.
        </p>
        <Button className="mt-8 gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}