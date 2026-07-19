import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface WavyHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightContent?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export function WavyHeader({
  title,
  subtitle,
  onBack,
  rightContent,
  size = 'md',
  icon,
}: WavyHeaderProps) {
  const minHeightMap = { sm: 120, md: 150, lg: 180 };
  const minH = minHeightMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: minH,
        zIndex: 10,
      }}
    >
      {/* Rich multi-stop gradient — deeper at top-left, lighter at bottom-right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(145deg, #064e3b 0%, #0f766e 35%, #15803d 70%, #16a34a 100%)',
        }}
      />

      {/* Glow orb — right side, large, animated */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.30, 0.18] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: -50,
          right: -30,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(134,239,172,0.35) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      {/* Glow orb — bottom-left, smaller */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.40) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Asymmetric SVG wave — the right side stays high, left dips low */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '115%',
          height: '55%',
          pointerEvents: 'none',
        }}
        viewBox="0 0 460 80"
        preserveAspectRatio="none"
      >
        {/* Deep asymmetric wave: bottom-left low, sweeping up to upper-right */}
        <path
          d="M 0,65 C 70,75 140,25 230,42 C 310,57 380,8 460,2 L 460,80 L 0,80 Z"
          fill="rgba(0,0,0,0.13)"
        />
        {/* Mid shimmer wave */}
        <path
          d="M 0,75 C 90,62 180,72 270,58 C 350,46 410,62 460,52 L 460,80 L 0,80 Z"
          fill="rgba(255,255,255,0.07)"
        />
        {/* Bottom edge shimmer */}
        <path
          d="M 0,78 C 120,74 240,79 360,76 C 400,74 430,77 460,75 L 460,80 L 0,80 Z"
          fill="rgba(255,255,255,0.06)"
        />
      </svg>

      {/* Top arc shimmer — leans to the right */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80%',
          height: '45%',
          pointerEvents: 'none',
        }}
        viewBox="0 0 320 55"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,0 Q 100,40 220,18 Q 280,5 320,22 L 320,0 Z"
          fill="rgba(255,255,255,0.10)"
        />
      </svg>

      {/* Diagonal light streak */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 60,
          width: 2,
          height: '70%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
          transform: 'rotate(25deg)',
          transformOrigin: 'top',
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          padding: '14px 20px 32px',
          minHeight: minH,
        }}
      >
        {/* Nav row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'auto' }}>
          {onBack ? (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={onBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'white',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </motion.button>
          ) : (
            <div style={{ width: 38 }} />
          )}

          {rightContent ? (
            <div style={{ flexShrink: 0 }}>{rightContent}</div>
          ) : (
            <div style={{ width: 38 }} />
          )}
        </div>

        {/* Bottom title area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {icon && (
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginBottom: 6 }}
            >
              {icon}
            </motion.div>
          )}
          {title && (
            <motion.h1
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              style={{
                color: 'white',
                fontWeight: 800,
                fontSize: size === 'sm' ? 22 : size === 'md' ? 26 : 30,
                letterSpacing: '-0.6px',
                textShadow: '0 2px 10px rgba(0,0,0,0.22)',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.20, duration: 0.4 }}
              style={{
                color: 'rgba(255,255,255,0.72)',
                fontSize: 13,
                fontWeight: 500,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
