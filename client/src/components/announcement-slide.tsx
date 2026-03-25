import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Megaphone, Gift, Play, Pause, Volume2, VolumeX, Maximize2, ChevronLeft, ChevronRight, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl?: string;
  actionUrl?: string;
}

interface AnnouncementSlideProps {
  announcements: Announcement[];
}

function isVideo(url?: string) {
  if (!url) return false;
  return url.includes("/video/") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function MediaModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const video = isVideo(url);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setDuration(v.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
          {video ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={url}
                className="w-full max-h-[70vh] object-contain bg-black"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setPlaying(false)}
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence>
                  {!playing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                <div
                  className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-white/80 transition-colors"
                  >
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-white/80 transition-colors"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <span className="text-white/70 text-xs flex-1">
                    {formatTime((progress / 100) * duration)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={url}
              alt={title}
              className="w-full max-h-[80vh] object-contain"
            />
          )}

          <div className="p-3 bg-black/80">
            <p className="text-white text-sm font-medium">{title}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AnnouncementSlide({ announcements }: AnnouncementSlideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaOpen, setMediaOpen] = useState(false);

  const duration = 25000;
  const interval = 100;

  useEffect(() => {
    if (announcements.length > 0) {
      setIsVisible(true);
      setProgress(0);
      setCurrentIndex(0);
    }
  }, [announcements]);

  useEffect(() => {
    if (!isVisible || announcements.length === 0 || mediaOpen) return;

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
  }, [isVisible, currentIndex, announcements.length, mediaOpen]);

  const handleNext = () => {
    setMediaOpen(false);
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setIsVisible(false);
    }
  };

  const handlePrev = () => {
    setMediaOpen(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleClose = () => setIsVisible(false);

  const current = announcements[currentIndex];

  if (!current || !isVisible) return null;

  const Icon =
    current.type === "offer"
      ? Gift
      : current.type === "promotion"
      ? Megaphone
      : Sparkles;

  const hasMedia = !!current.imageUrl;
  const mediaIsVideo = isVideo(current.imageUrl);

  return (
    <>
      <AnimatePresence>
        {mediaOpen && current.imageUrl && (
          <MediaModal
            url={current.imageUrl}
            title={current.title}
            onClose={() => setMediaOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
          >
            <div className="relative bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-primary/10 overflow-hidden">
              {hasMedia && (
                <div
                  className="relative w-full cursor-pointer overflow-hidden"
                  style={{ height: mediaIsVideo ? 180 : 150 }}
                  onClick={() => setMediaOpen(true)}
                >
                  {mediaIsVideo ? (
                    <video
                      src={current.imageUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={current.imageUrl}
                      alt={current.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg">
                      {mediaIsVideo ? (
                        <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                      ) : (
                        <Maximize2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <span className="flex items-center gap-1 text-[10px] text-white/90 font-medium">
                      {mediaIsVideo ? (
                        <><VideoIcon className="w-3 h-3" /> Tap to play video</>
                      ) : (
                        <><ImageIcon className="w-3 h-3" /> Tap to view full image</>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="relative p-4 flex gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    current.type === "offer"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  <h4 className="font-bold text-sm text-foreground leading-tight">{current.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{current.content}</p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {hasMedia && (
                      <button
                        onClick={() => setMediaOpen(true)}
                        className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        {mediaIsVideo ? (
                          <><Play className="w-3 h-3" /> Play Video</>
                        ) : (
                          <><Maximize2 className="w-3 h-3" /> View Image</>
                        )}
                      </button>
                    )}
                    {hasMedia && current.actionUrl && (
                      <span className="text-muted-foreground text-xs">·</span>
                    )}
                    {current.actionUrl && (
                      <button
                        onClick={() => window.location.href = current.actionUrl!}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Learn More →
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="h-0.5 w-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {announcements.length > 1 && (
                <div className="flex items-center justify-between px-4 py-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="flex gap-1">
                    {announcements.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setCurrentIndex(i); setProgress(0); }}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === announcements.length - 1}
                    className="p-1 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
