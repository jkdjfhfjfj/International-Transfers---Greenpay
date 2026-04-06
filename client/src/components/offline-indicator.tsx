import { useOfflineStatus } from '@/hooks/use-offline';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline } = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
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

      {isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
