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
    <main className="min-h-[100dvh] overflow-hidden bg-[#f5f8f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-800/20" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-900/20" />

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-36 pt-4 sm:px-6 sm:pt-8">
        <header className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <ServerCog className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Geepay
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Service status</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-slate-900/80 dark:text-emerald-300">
            Live update
          </span>
        </header>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 px-6 pb-16 pt-6 text-white shadow-2xl shadow-emerald-900/15 sm:px-8 sm:pt-8">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <Wrench className="h-7 w-7" aria-hidden="true" />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
              {getMaintenanceStatusLabel()}
            </span>
          </div>
          <p className="relative z-10 mt-7 text-sm font-medium text-emerald-100">We’re taking care of things</p>
          <h1 className="relative z-10 mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {getMaintenanceTitle()}
          </h1>
          <p className="relative z-10 mt-4 max-w-xl text-sm leading-6 text-emerald-50/90 sm:text-base">
            {getMaintenanceMessage()}
          </p>
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-50">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-2">
              <Clock3 className="h-3.5 w-3.5" />
              {getMaintenanceEstimatedTime()}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              {severityInfo.label}
            </span>
          </div>
          <svg
            className="absolute inset-x-0 bottom-[-1px] h-14 w-full text-[#f5f8f7] dark:text-slate-950"
            viewBox="0 0 480 56"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M0 33C72 55 133 55 200 35C279 11 354 4 480 31V56H0Z"
            />
          </svg>
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