import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface WavyHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function WavyHeader({
  title,
  onBack,
  rightContent,
  size = 'md',
}: WavyHeaderProps) {
  const paddingMap = { sm: '12px 16px', md: '16px 20px', lg: '20px 20px' };
  const minHeightMap = { sm: 64, md: 80, lg: 100 };
  const minH = minHeightMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: minH,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        zIndex: 10,
      }}
    >
      {/* Gradient base */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0f766e 0%, #16a34a 100%)',
        }}
      />

      {/* Decorative SVG waves — recolored to teal/green palette */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
      >
        {/* Deep arc sweep bottom-right */}
        <path
          d="M 0,60 Q 120,100 250,55 Q 330,25 400,70 L 400,120 L 0,120 Z"
          fill="rgba(0,0,0,0.10)"
        />
        {/* Mid wave */}
        <path
          d="M 0,80 Q 100,55 200,80 Q 300,105 400,75 L 400,120 L 0,120 Z"
          fill="rgba(255,255,255,0.06)"
        />
        {/* Subtle top shimmer arc */}
        <path
          d="M -20,0 Q 100,28 220,8 Q 330,-10 420,18 L 420,0 Z"
          fill="rgba(255,255,255,0.08)"
        />
        {/* Bottom highlight line */}
        <path
          d="M 0,115 Q 200,105 400,115"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2"
        />
      </svg>

      {/* Content row */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: paddingMap[size],
          minHeight: minH,
        }}
      >
        {onBack ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </motion.button>
        ) : (
          <div style={{ width: 36 }} />
        )}

        {title && (
          <h1
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: size === 'sm' ? 15 : size === 'md' ? 17 : 19,
              letterSpacing: '-0.2px',
              textAlign: 'center',
              flex: 1,
              textShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}
          >
            {title}
          </h1>
        )}

        {rightContent ? (
          <div style={{ flexShrink: 0 }}>{rightContent}</div>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>
    </motion.div>
  );
}
