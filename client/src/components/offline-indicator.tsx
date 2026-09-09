import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

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
      {status === "offline" && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed left-1/2 top-3 z-[10001] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-card px-4 py-2.5 text-amber-700 shadow-lg dark:text-amber-300"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-semibold">You are offline</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
