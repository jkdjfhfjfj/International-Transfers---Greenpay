import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Home, CreditCard, Send, ClipboardList, LayoutGrid, Sun, Moon, Settings2, X, TrendingUp, WalletCards, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWallets } from "@/hooks/use-wallets";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const navItems = [
  { id: "dashboard",    Icon: Home,            label: "Home",     path: "/dashboard" },
  { id: "virtual-card", Icon: CreditCard,       label: "Card",     path: "/virtual-card" },
  { id: "send",         Icon: Send,             label: "Send",     path: "/send-money",  isCenter: true },
  { id: "transactions", Icon: ClipboardList,    label: "History",  path: "/transactions" },
  { id: "settings",     Icon: LayoutGrid,       label: "More",     path: "/settings" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { wallets } = useWallets();
  const { data: rateData, isLoading: ratesLoading } = useQuery<any>({
    queryKey: ["/api/exchange-rates", "USD", "bottom-menu"],
    queryFn: async () => (await apiRequest("GET", "/api/exchange-rates/USD")).json(),
    enabled: isAuthenticated && menuOpen,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const openMenu = () => setMenuOpen(true);
    window.addEventListener("open-bottom-menu", openMenu);
    return () => window.removeEventListener("open-bottom-menu", openMenu);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("geepay-theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  const isExternal = window.opener !== null || window.parent !== window;

  const showBottomNav = !isExternal && isAuthenticated && (
    location.startsWith('/dashboard') ||
    location.startsWith('/transactions') ||
    location.startsWith('/virtual-card') ||
    location.startsWith('/virtual-accounts') ||
    location.startsWith('/support') ||
    location.startsWith('/settings') ||
    location.startsWith('/send-money') ||
    location.startsWith('/send-amount') ||
    location.startsWith('/send-confirm') ||
    location.startsWith('/transfer') ||
    location.startsWith('/receive-money') ||
    location.startsWith('/deposit') ||
    location.startsWith('/withdraw') ||
    location.startsWith('/exchange') ||
    location.startsWith('/airtime') ||
    location.startsWith('/bills') ||
    location.startsWith('/status') ||
    location.startsWith('/admin-notifications') ||
    location.startsWith('/crypto') ||
    location.startsWith('/analytics') ||
    location.startsWith('/kyc') ||
    location.startsWith('/payment-requests') ||
    location.startsWith('/payment-processing') ||
    location.startsWith('/payment-success') ||
    location.startsWith('/payment-failed') ||
    location.startsWith('/kyc') ||
    location.startsWith('/payment-requests') ||
    location.startsWith('/live-chat') ||
    location.startsWith('/user-support') ||
    location.startsWith('/receive-money')
  );

  if (!showBottomNav) return null;

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
        data-testid="bottom-navigation"
      >
       <div
        className="bg-background/95 border-t border-border shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:shadow-[0_-4px_18px_rgba(0,0,0,0.28)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', minHeight: 'var(--bottom-nav-height)' }}
      >
        <div className="flex justify-around items-end max-w-lg mx-auto px-2 relative" style={{ height: 72 }}>
          {navItems.map((item) => {
            const { Icon } = item;
            const isActive =
              location === item.path ||
              (item.path === '/send-money' &&
                (location.startsWith('/send-money') ||
                  location.startsWith('/send-amount') ||
                  location.startsWith('/send-confirm')));

            if (item.isCenter) {
              return (
                <div key={item.id} className="flex flex-col items-center justify-end pb-2 relative" style={{ flex: 1 }}>
                  <motion.button
                    onClick={() => setLocation(item.path)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    data-testid={`nav-${item.id}`}
                    style={{
                      position: 'absolute',
                      top: -26,
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'var(--gp-brand)',
                      border: '3px solid var(--background)',
                      boxShadow: '0 6px 20px rgba(5, 150, 105, 0.40)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </motion.button>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? 'var(--gp-brand)' : 'var(--muted-foreground)',
                      marginTop: 32,
                      lineHeight: 1,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => setLocation(item.path)}
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.88 }}
                data-testid={`nav-${item.id}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 8,
                  gap: 3,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? 'var(--gp-brand)' : 'var(--muted-foreground)',
                  position: 'relative',
                }}
              >
                <Icon size={21} strokeWidth={isActive ? 2.3 : 1.8} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--gp-brand)',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      </motion.div>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerContent className="z-[10001] max-h-[calc(100dvh-var(--bottom-nav-height)-env(safe-area-inset-bottom,0px))] overflow-y-auto rounded-t-[28px] pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+1rem)]">
          <DrawerHeader className="text-left">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>App menu</DrawerTitle>
                <DrawerDescription>Quick access to app preferences</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <button className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Close app menu">
                  <X className="h-5 w-5" />
                </button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <WalletCards className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Wallet balance</p>
                    <p className="text-sm font-semibold text-foreground">
                      {wallets.length ? `${wallets[0].currency} ${Number(wallets[0].availableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Loading wallet"}
                    </p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="border-t border-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Live rates</p>
                  {ratesLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["KES", "UGX", "NGN"].map((currency) => {
                    const rate = Number(rateData?.rates?.[currency] ?? rateData?.[currency]);
                    return (
                      <div key={currency} className="rounded-xl bg-muted/60 px-2 py-2 text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground">USD/{currency}</p>
                        <p className="mt-0.5 text-xs font-bold text-foreground">
                          {Number.isFinite(rate) && rate > 0 ? rate.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-left transition-colors hover:bg-muted"
              data-testid="button-theme-toggle"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{isDark ? "Light mode" : "Dark mode"}</span>
                <span className="block text-xs text-muted-foreground">Switch the app appearance</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground">{isDark ? "On" : "Off"}</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                window.dispatchEvent(new CustomEvent("open-rates-sheet"));
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-muted"
              data-testid="button-rates"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Rates</span>
                <span className="block text-xs text-muted-foreground">View live exchange rates</span>
              </span>
            </button>
            <button
              onClick={() => { setMenuOpen(false); setLocation("/settings"); }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-muted"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Settings</span>
                <span className="block text-xs text-muted-foreground">Manage your account and preferences</span>
              </span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
