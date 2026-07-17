import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, History,
  User, Settings, HelpCircle, LogOut, TrendingUp, Smartphone,
  BarChart3, Bitcoin, Zap
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard",    icon: LayoutDashboard,    label: "Home",        path: "/dashboard" },
  { id: "send-money",   icon: ArrowLeftRight,      label: "Transfer",    path: "/send-money" },
  { id: "virtual-card", icon: CreditCard,           label: "Card",        path: "/virtual-card" },
  { id: "transactions", icon: History,              label: "History",     path: "/transactions" },
  { id: "airtime",      icon: Smartphone,           label: "Airtime",     path: "/airtime" },
  { id: "analytics",    icon: BarChart3,            label: "Analytics",   path: "/analytics" },
  { id: "crypto",       icon: Bitcoin,              label: "Crypto",      path: "/crypto" },
];

const BOTTOM_ITEMS = [
  { id: "settings",    icon: Settings,   label: "Settings",  path: "/settings" },
  { id: "support",     icon: HelpCircle, label: "Support",   path: "/support" },
];

export default function DesktopSidebar() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const showSidebar = isAuthenticated && !location.startsWith('/admin') && ![
    '/', '/login', '/signup', '/splash', '/landing', '/help', '/about', '/pricing',
    '/security', '/contact', '/terms', '/privacy', '/admin-login',
    '/auth/otp-verification', '/auth/google/complete', '/auth/kyc-verification',
    '/auth/forgot-password', '/auth/reset-password', '/auth/virtual-card-purchase',
  ].includes(location) && !location.startsWith('/features/');

  if (!showSidebar) return null;

  const isActive = (path: string) =>
    location === path || (path !== "/dashboard" && location.startsWith(path));

  return (
    <motion.aside
      initial={{ x: -264 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border/60 flex-col z-40 shadow-lg"
    >
      {/* Logo */}
      <div className="p-5 border-b border-border/40">
        <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-emerald-200 transition-shadow">
            <span className="text-white font-extrabold text-base">G</span>
          </div>
          <div>
            <p className="font-bold text-base text-foreground leading-tight">GreenPay</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Money Transfer</p>
          </div>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left
                ${active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} style={{ width: "18px", height: "18px" }} />
              {item.label}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border/40 p-3 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left
                ${active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <Icon style={{ width: "18px", height: "18px" }} className="shrink-0" />
              {item.label}
            </button>
          );
        })}

        {/* User profile */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted cursor-pointer" onClick={() => setLocation("/settings")}>
            {user?.profilePhotoUrl ? (
              <img src={user.profilePhotoUrl} alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">
                  {user?.fullName?.split(" ").map((n: string) => n[0]).join("") || "U"}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-all duration-150 text-left mt-0.5"
          >
            <LogOut style={{ width: "18px", height: "18px" }} className="shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
