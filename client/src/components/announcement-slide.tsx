import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Megaphone, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  actionUrl?: string;
}

interface AnnouncementSlideProps {
  announcements: Announcement[];
}

export default function AnnouncementSlide({ announcements }: AnnouncementSlideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const duration = 25000; // 25 seconds
  const interval = 100; // Update every 100ms

  useEffect(() => {
    if (announcements.length > 0) {
      setIsVisible(true);
      setProgress(0);
      setCurrentIndex(0);
    }
  }, [announcements]);

  useEffect(() => {
    if (!isVisible || announcements.length === 0) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (interval / duration) * 100;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, currentIndex, announcements.length]);

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const current = announcements[currentIndex];

  if (!current || !isVisible) return null;

  const Icon = current.type === 'offer' ? Gift : (current.type === 'promotion' ? Megaphone : Sparkles);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
        >
          <div className="bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-primary/20 overflow-hidden relative">
            <div className="p-4 flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                current.type === 'offer' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 pr-6">
                <h4 className="font-bold text-sm text-foreground">{current.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{current.content}</p>
                {current.actionUrl && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs mt-2 text-primary font-semibold"
                    onClick={() => window.location.href = current.actionUrl!}
                  >
                    Check it out
                  </Button>
                )}
              </div>

              <button 
                onClick={handleClose}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-muted mt-auto">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            
            {/* Slide Indicator */}
            {announcements.length > 1 && (
              <div className="absolute bottom-2 right-4 flex gap-1">
                {announcements.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-3 rounded-full ${i === currentIndex ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
