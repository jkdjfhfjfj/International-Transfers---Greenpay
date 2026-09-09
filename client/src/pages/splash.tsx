import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Send, CreditCard, TrendingUp, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Send Money Instantly",
    description: "Send money to Kenya and Africa with just a few taps. Fast, secure, and affordable.",
    icon: <Send className="w-24 h-24" />,
    gradient: "from-[#0f766e] to-[#14b8a6]",
  },
  {
    id: 2,
    title: "Virtual Cards",
    description: "Get instant virtual Mastercard for online shopping worldwide. No waiting.",
    icon: <CreditCard className="w-24 h-24" />,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: 3,
    title: "Best Exchange Rates",
    description: "Real-time rates with no hidden fees. Get more value for your money.",
    icon: <TrendingUp className="w-24 h-24" />,
    gradient: "from-[#0f766e] to-cyan-500",
  },
  {
    id: 4,
    title: "Bank-Level Security",
    description: "Your money is protected with military-grade encryption and biometric login.",
    icon: <Shield className="w-24 h-24" />,
    gradient: "from-orange-500 to-red-600",
  },
];

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { isAuthenticated, isLoading } = useAuth();

  // If user is already signed in (valid session cookie), skip onboarding
  // and take them straight to the dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setLocation("/signup");
    }
  };

  const handleSkip = () => {
    setLocation("/login");
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const slide = slides[currentSlide];

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-[#062a2a] via-[#083f3b] to-[#021716] flex flex-col relative overflow-hidden"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="gp-splash-grid absolute inset-0 opacity-50" />
        <motion.div
          className="gp-splash-orb absolute top-20 right-10 w-96 h-96 bg-teal-400 rounded-full opacity-20 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="gp-splash-orb-delayed absolute -bottom-10 -left-20 w-96 h-96 bg-cyan-500 rounded-full opacity-15 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Top Navigation Bar - Wavy Design */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        {/* Wavy SVG Background */}
        <svg className="w-full" viewBox="-50 0 1380 130" preserveAspectRatio="none" style={{ height: '140px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#0f766e', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#14b8a6', stopOpacity: 0.45 }} />
            </linearGradient>
          </defs>
          
          {/* Main wave fill */}
          <path
            d="M-50,60 Q315,0 665,60 T1365,60 L1365,0 L-50,0 Z"
            fill="#0f766e"
          />
          
          {/* Flowing curves */}
          <path
            d="M-50,80 Q315,40 665,80 T1365,80 Q1035,120 665,100 Q295,80 -50,100 Z"
            fill="rgba(20, 184, 166, 0.35)"
            opacity="0.6"
          />
          
          {/* Accent curves */}
          <path
            d="M-50,120 Q315,90 665,120 T1365,120"
            stroke="#14b8a6"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </svg>

        {/* Content Overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-end px-6 py-6 h-24">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            aria-label="Skip onboarding"
            className="text-white hover:text-gray-200 transition-colors text-sm font-medium drop-shadow-md"
          >
            Skip
          </motion.button>
        </div>
      </motion.div>
      {/* Slide Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 overflow-hidden pt-0 mt-0">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentSlide}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
            }}
            className="w-full max-w-2xl flex flex-col items-center justify-center"
          >
            {/* Icon */}
            <div className="relative mb-8">
              <div className="gp-splash-ring absolute inset-0 rounded-[2rem] border border-teal-300/40" />
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180 }}
                className={`relative bg-gradient-to-br ${slide.gradient} p-8 rounded-[2rem] text-white shadow-2xl shadow-teal-950/40`}
              >
                {slide.icon}
              </motion.div>
            </div>

            {/* Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
            >
              {slide.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-300 text-center text-base md:text-lg leading-relaxed max-w-xl"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-2 justify-center py-4 relative z-10"
      >
        {slides.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to onboarding slide ${idx + 1}`}
            aria-current={idx === currentSlide ? "step" : undefined}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentSlide ? "bg-[#0f766e] w-8 shadow-[0_0_12px_rgba(20,184,166,0.65)]" : "bg-white/25 w-2.5"
            }`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
      </motion.div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-2 relative z-10"
      >
        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrev}
               className="flex-1 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold py-3 px-4 rounded-xl transition-colors backdrop-blur-sm"
            >
              Back
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
             className="flex-1 bg-gradient-to-r from-[#0f766e] to-[#14b8a6] hover:from-[#115e59] hover:to-[#0f766e] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-950/30"
          >
            <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
