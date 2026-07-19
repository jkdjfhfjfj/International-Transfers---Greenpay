import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Home, CreditCard, ArrowLeftRight, ClipboardList, User } from "lucide-react";

const navItems = [
  { id: "dashboard",    Icon: Home,            label: "Home",     path: "/dashboard" },
  { id: "virtual-card", Icon: CreditCard,       label: "Card",     path: "/virtual-card" },
  { id: "send",         Icon: ArrowLeftRight,   label: "Transfer", path: "/send-money",    isCenter: true },
  { id: "transactions", Icon: ClipboardList,    label: "History",  path: "/transactions" },
  { id: "settings",     Icon: User,             label: "Profile",  path: "/settings" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const isExternal = window.opener !== null || window.parent !== window;

  const showBottomNav = !isExternal && isAuthenticated && (
    location.startsWith('/dashboard') ||
    location.startsWith('/transactions') ||
    location.startsWith('/virtual-card') ||
    location.startsWith('/support') ||
    location.startsWith('/settings') ||
    location.startsWith('/send-money') ||
    location.startsWith('/send-amount') ||
    location.startsWith('/send-confirm') ||
    location.startsWith('/receive-money') ||
    location.startsWith('/deposit') ||
    location.startsWith('/withdraw') ||
    location.startsWith('/exchange') ||
    location.startsWith('/airtime') ||
    location.startsWith('/bills') ||
    location.startsWith('/status') ||
    location.startsWith('/loans') ||
    location.startsWith('/api-documentation') ||
    location.startsWith('/admin-notifications') ||
    location.startsWith('/crypto') ||
    location.startsWith('/analytics') ||
    location.startsWith('/payment-processing') ||
    location.startsWith('/payment-success') ||
    location.startsWith('/payment-failed')
  );

  if (!showBottomNav) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
      data-testid="bottom-navigation"
    >
      <div
        className="bg-background border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex justify-around items-end max-w-lg mx-auto px-2 relative" style={{ height: 64 }}>
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
                    whileTap={{ scale: 0.92 }}
                    data-testid={`nav-${item.id}`}
                    style={{
                      position: 'absolute',
                      top: -26,
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0f766e 0%, #16a34a 100%)',
                      border: '3px solid white',
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
                      color: isActive ? '#059669' : '#64748b',
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
                  color: isActive ? '#059669' : '#64748b',
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
                      background: '#059669',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
