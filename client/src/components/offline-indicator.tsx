import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wentOffline, setWentOffline] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      setIsOnline(true);
      if (wentOffline) {
        setShowBackOnline(true);
        setWentOffline(false);
        hideTimer = setTimeout(() => setShowBackOnline(false), 3000);
      }
      window.dispatchEvent(new CustomEvent('app-online'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
      setWentOffline(true);
      window.dispatchEvent(new CustomEvent('app-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(hideTimer);
    };
  }, [wentOffline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            You're offline - some features may be limited
          </span>
        </motion.div>
      )}

      {showBackOnline && (
        <motion.div
          key="back-online"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
