import { Bell, ChevronDown, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const pageNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/transactions": "Transaction history",
  "/send-money": "Send money",
  "/receive-money": "Receive money",
  "/virtual-card": "Virtual card",
  "/virtual-accounts": "Virtual accounts",
  "/settings": "Settings",
  "/kyc": "Identity verification",
  "/analytics": "Analytics",
  "/airtime": "Airtime",
  "/bills": "Bills",
  "/crypto": "Crypto",
  "/support": "Support",
};

export default function DesktopTopbar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const title = Object.entries(pageNames).find(([path]) =>
    location === path || location.startsWith(`${path}/`),
  )?.[1] || "Workspace";

  const initials = user?.fullName
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <header className="hidden md:flex fixed left-64 right-0 top-0 z-30 h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            Geepay workspace
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setLocation("/kyc")}
          className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          {user?.kycStatus === "verified" ? "Identity verified" : "Verify identity"}
        </button>
        <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setLocation("/settings")}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900"
        >
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{initials}</span>
          )}
          <span className="hidden lg:block max-w-28 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
            {user?.fullName || "Account"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
}