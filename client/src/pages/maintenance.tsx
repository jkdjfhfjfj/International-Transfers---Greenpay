import { Wrench, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemSettings } from "@/hooks/use-system-settings";

export default function MaintenancePage() {
  const { getMaintenanceMessage } = useSystemSettings();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Wrench className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Geepay
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          We’ll be back shortly
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          {getMaintenanceMessage()}
        </p>
        <Button className="mt-8 gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Check again
        </Button>
      </div>
    </main>
  );
}