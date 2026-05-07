import { useState, useEffect, createContext, useContext } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, Users, FileCheck, DollarSign, Banknote, CreditCard,
  Bell, Mail, MessageCircle, Headphones, FileText, Activity, Smartphone,
  Settings, MessageSquare, History, Database, BarChart3, LogOut, Menu, X,
  Shield, ChevronRight, User, Megaphone, Bitcoin, AlertTriangle, ArrowDownToLine
} from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface AdminContextValue {
  admin: AdminUser | null;
}

const AdminContext = createContext<AdminContextValue>({ admin: null });
export const useAdmin = () => useContext(AdminContext);

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Users & KYC",
    items: [
      { href: "/admin/users", label: "User Management", icon: Users },
      { href: "/admin/kyc", label: "KYC Review", icon: FileCheck },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/transactions", label: "Transactions", icon: DollarSign },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote },
      { href: "/admin/cards", label: "Virtual Cards", icon: CreditCard },
      { href: "/admin/pricing", label: "Card Pricing", icon: CreditCard },
      { href: "/admin/crypto", label: "Crypto", icon: Bitcoin },
      { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    ],
  },
  {
    title: "Messaging",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/mail", label: "Mail Management", icon: Mail },
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/admin/support", label: "Live Support", icon: Headphones },
      { href: "/admin/tickets", label: "Support Tickets", icon: FileText },
      { href: "/admin/templates", label: "WA Templates", icon: MessageSquare },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/logs", label: "System Logs", icon: Activity },
      { href: "/admin/activity", label: "Activity Logs", icon: History },
      { href: "/admin/database", label: "Database", icon: Database },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings", label: "System Settings", icon: Settings },
      { href: "/admin/deposit-settings", label: "Deposit Settings", icon: ArrowDownToLine },
      { href: "/admin/manual-payment", label: "Manual Payment", icon: Smartphone },
      { href: "/admin/payhero-settings", label: "PayHero Settings", icon: Smartphone },
      { href: "/admin/messaging", label: "Messaging & SMS", icon: MessageCircle },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/admin/profile", label: "Admin Profile", icon: User },
    ],
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  const [location, setLocation] = useLocation();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data && data.admin) {
          setAdmin(data.admin);
        } else {
          setLocation("/admin/login");
        }
      })
      .catch(() => {
        setLocation("/admin/login");
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {}
    setLocation("/admin/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  const pageTitle = title || navSections
    .flatMap((s) => s.items)
    .find((item) => item.href === location)?.label || "Admin Panel";

  return (
    <AdminContext.Provider value={{ admin }}>
      <div className="min-h-screen flex bg-gray-50">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg
            flex flex-col transform transition-transform duration-300 ease-in-out
            lg:static lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-green-600" />
              <span className="font-bold text-gray-900 text-base">GreenPay Admin</span>
            </div>
            <button
              className="lg:hidden p-1 rounded text-gray-500 hover:text-gray-900"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ScrollArea className="flex-1">
            <nav className="py-4 px-3 space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = location === item.href;
                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            setLocation(item.href);
                            setSidebarOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${active
                              ? "bg-green-50 text-green-700 font-semibold"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-green-600" : ""}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {active && <ChevronRight className="w-3 h-3 text-green-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 font-bold text-sm">
                  {admin.fullName?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{admin.fullName || admin.email}</p>
                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-gray-900 text-base">{pageTitle}</h1>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
