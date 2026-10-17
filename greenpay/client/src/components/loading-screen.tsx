import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

export default function LoadingScreen() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex min-h-[100svh] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--gp-brand)] via-[var(--gp-brand)] to-[#073c3a]"
      data-testid="loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 gp-splash-grid opacity-25" aria-hidden="true" />
      <motion.div
        className="gp-splash-orb absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <motion.div
        className="gp-splash-orb-delayed absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl"
        animate={{ scale: [1, 0.9, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <div className="relative z-10 px-6 text-center">
        <motion.div
          initial={{ scale: 0.88, y: 8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 180 }}
          className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-white shadow-2xl shadow-teal-950/30"
          aria-hidden="true"
        >
          <div className="gp-splash-ring absolute inset-0 rounded-[1.6rem] border-2 border-white/70" />
          <Send className="h-8 w-8 -rotate-12 text-[var(--gp-brand)]" />
          <Sparkles className="absolute -right-2 -top-2 h-5 w-5 text-teal-100" />
        </motion.div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Geepay</h1>
        <p className="text-sm text-teal-100">Getting your wallet ready</p>
        <p className="mt-2 text-xs text-teal-100/75">Securely checking your session</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
          <span className="text-sm text-white/90">Please wait</span>
        </div>
      </div>
    </motion.main>
  );
}
