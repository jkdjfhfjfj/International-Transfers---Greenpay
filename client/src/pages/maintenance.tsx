import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WavyHeader } from "@/components/wavy-header";
import { useSystemSettings } from "@/hooks/use-system-settings";

export default function MaintenancePage() {
  const {
    getMaintenanceMessage,
    getMaintenanceTitle,
    getMaintenanceEstimatedTime,
    getMaintenanceAffectedServices,
    getMaintenanceSeverity,
    getMaintenanceStartedAt,
    getMaintenanceStatusLabel,
    settings,
  } = useSystemSettings();

  const severity = getMaintenanceSeverity().toLowerCase();
  const severityDetails: Record<string, {
    label: string;
    description: string;
    className: string;
    iconClassName: string;
  }> = {
    minor: {
      label: "Minor impact",
      description: "A small part of the platform is temporarily unavailable.",
      className: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
      iconClassName: "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200",
    },
    moderate: {
      label: "Moderate impact",
      description: "Some services are temporarily unavailable while we work.",
      className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
      iconClassName: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200",
    },
    major: {
      label: "Major impact",
      description: "Most platform services are temporarily unavailable.",
      className: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-200",
      iconClassName: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-200",
    },
    critical: {
      label: "Critical impact",
      description: "The platform is temporarily unavailable while we resolve an incident.",
      className: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200",
      iconClassName: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
    },
  };
  const severityInfo = severityDetails[severity] || severityDetails.moderate;

  const services = getMaintenanceAffectedServices()
    .split(/\r?\n|,/)
    .map((service: string) => service.trim())
    .filter(Boolean);
  const supportEmail =
    settings?.general?.support_email?.value ||
    settings?.platform?.support_email?.value ||
    "";
  const startedAt = getMaintenanceStartedAt();
  const startedLabel = startedAt
    ? new Date(startedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Status updates will appear here";

  return (
    <main className="min-h-[100dvh] bg-background pb-36 text-foreground">
      <WavyHeader
        icon={<ServerCog className="h-5 w-5 text-white" aria-hidden="true" />}
        rightContent={
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">
            Live update
          </span>
        }
        size="md"
      />

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
        <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wrench className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">We’re taking care of things</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {getMaintenanceTitle()}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                {getMaintenanceMessage()}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-2 text-foreground shadow-sm">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              {getMaintenanceEstimatedTime()}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-2 text-foreground shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              {severityInfo.label}
            </span>
          </div>
        </section>

        <section className={`mt-4 rounded-3xl border p-4 ${severityInfo.className}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${severityInfo.iconClassName}`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold">{severityInfo.label}</p>
              <p className="mt-1 text-sm leading-5 opacity-90">{severityInfo.description}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Affected services
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">We’ll restore these as soon as possible.</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <div key={service} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/70">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{service}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Started</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{startedLabel}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Your funds</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Safe and unchanged</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 pb-32">
          {supportEmail ? (
            <Button asChild variant="outline" className="h-12 w-full gap-2 rounded-2xl border-slate-300 bg-white/80 font-bold dark:border-slate-700 dark:bg-slate-900/80">
              <a href={`mailto:${supportEmail}`}>
                <Mail className="h-4 w-4" />
                Contact support
              </a>
            </Button>
          ) : null}
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          You can safely keep this page open. It will update automatically when Geepay is available again.
        </p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-[#f5f8f7]/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto max-w-2xl pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <Button
            className="h-12 w-full gap-2 rounded-2xl bg-emerald-600 font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Check again
          </Button>
        </div>
      </div>
    </main>
  );
}