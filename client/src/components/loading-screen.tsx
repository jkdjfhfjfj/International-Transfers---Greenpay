import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-gradient-to-br from-[#0f766e] via-[#0b625e] to-[#073c3a] flex items-center justify-center z-50 overflow-hidden"
          data-testid="loading-screen"
        >
          <div className="absolute inset-0 gp-splash-grid opacity-25" />
          <motion.div
            className="gp-splash-orb absolute -top-24 -right-20 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="gp-splash-orb-delayed absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-cyan-300/15 blur-3xl"
            animate={{ scale: [1, 0.9, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 text-center px-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 180 }}
              className="relative w-20 h-20 bg-white rounded-[1.6rem] flex items-center justify-center mb-5 mx-auto elevation-3 shadow-2xl shadow-teal-950/30"
            >
              <div className="gp-splash-ring absolute inset-0 rounded-[1.6rem] border-2 border-white/70" />
              <Send className="w-8 h-8 text-[#0f766e] -rotate-12" />
              <Sparkles className="absolute -right-2 -top-2 w-5 h-5 text-teal-100" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold text-white mb-2"
            >
              Geepay
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
               className="text-teal-100"
            >
              International Money Transfer
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
               className="mt-8 flex flex-col items-center gap-3"
            >
               <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
               <div className="flex items-center gap-1.5" aria-label="Loading">
                 {[0, 1, 2].map((dot) => (
                   <motion.span
                     key={dot}
                     className="w-1.5 h-1.5 rounded-full bg-teal-100"
                     animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
                     transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }}
                   />
                 ))}
               </div>
            </motion.div>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
