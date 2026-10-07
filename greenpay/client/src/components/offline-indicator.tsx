import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [status, setStatus] = useState<"offline" | "online" | null>(
    typeof navigator !== 'undefined' && !navigator.onLine ? "offline" : null,
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const showStatus = (nextStatus: "offline" | "online") => {
      setStatus(nextStatus);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setStatus(null), 4000);
    };

    const handleOnline = () => {
      showStatus("online");
      window.dispatchEvent(new CustomEvent('app-online'));
    };

    const handleOffline = () => {
      showStatus("offline");
      window.dispatchEvent(new CustomEvent('app-offline'));
    };

    if (status === "offline") {
      hideTimer.current = setTimeout(() => setStatus(null), 4000);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-3 z-[10001] flex w-[min(360px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-card-foreground shadow-xl"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            status === "offline" ? "bg-amber-500/10 text-amber-600 dark:text-amber-300" : "bg-primary/10 text-primary"
          }`}>
            {status === "offline" ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              {status === "offline" ? "You are offline" : "You are back online"}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {status === "offline"
                ? "Some actions are paused until your connection returns."
                : "Your connection has been restored."}
            </span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
