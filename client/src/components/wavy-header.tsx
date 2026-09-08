import { motion } from 'framer-motion';
import { ReactNode } from 'react';

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
  const heightMap = {
    sm: '88px',
    md: '110px',
    lg: '148px',
  };

  const viewBoxMap = {
    sm:  '-50 0 1380 100',
    md:  '-50 0 1380 110',
    lg:  '-50 0 1380 130',
  };

  const pathMap = {
    sm: {
      main:    'M-50,50 Q315,0 665,50 T1365,50 L1365,0 L-50,0 Z',
      flowing: 'M-50,65 Q315,30 665,65 T1365,65 Q1035,95 665,80 Q295,65 -50,85 Z',
      accent:  'M-50,90 Q315,65 665,90 T1365,90',
    },
    md: {
      main:    'M-50,55 Q315,5 665,55 T1365,55 L1365,0 L-50,0 Z',
      flowing: 'M-50,75 Q315,35 665,75 T1365,75 Q1035,110 665,90 Q295,75 -50,95 Z',
      accent:  'M-50,105 Q315,75 665,105 T1365,105',
    },
    lg: {
      main:    'M-50,60 Q315,0 665,60 T1365,60 L1365,0 L-50,0 Z',
      flowing: 'M-50,80 Q315,40 665,80 T1365,80 Q1035,120 665,100 Q295,80 -50,100 Z',
      accent:  'M-50,120 Q315,90 665,120 T1365,120',
    },
  };

  const paddingMap = {
    sm: 'py-3 px-4',
    md: 'py-4 px-5',
    lg: 'py-5 px-5',
  };

  const paths = pathMap[size];
  const GREEN = '#16a34a';
  const GREEN_MID = 'rgba(22,163,74,0.45)';
  const GREEN_STROKE = 'rgba(22,163,74,0.55)';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10"
    >
      {/* Wavy SVG background — matches onboarding splash style */}
      <svg
        className="w-full"
        viewBox={viewBoxMap[size]}
        preserveAspectRatio="none"
        style={{ height: heightMap[size], overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   style={{ stopColor: '#16a34a', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Main solid wave fill */}
        <path d={paths.main} fill="url(#waveGrad)" />

        {/* Flowing inner wave */}
        <path d={paths.flowing} fill={GREEN_MID} opacity="0.55" />

        {/* Accent stroke */}
        <path
          d={paths.accent}
          stroke={GREEN_STROKE}
          strokeWidth="2.5"
          fill="none"
          opacity="0.5"
        />
      </svg>

      {/* Content overlay */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-start justify-between ${paddingMap[size]}`}
        style={{ height: heightMap[size] }}
      >
        {/* Left — back button */}
        <div className="flex items-center pt-1">
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors mr-2"
              style={{ color: 'white' }}
            >
              <span className="material-icons" style={{ fontSize: 20 }}>arrow_back</span>
            </motion.button>
          )}
          {icon && <div className="mr-2">{icon}</div>}
        </div>

        {/* Center / title block */}
        <div className="flex-1 flex flex-col justify-end h-full pb-3">
          {title && (
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-bold text-white drop-shadow"
              style={{
                fontSize: size === 'sm' ? 16 : size === 'md' ? 18 : 21,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, marginTop: 2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Right content */}
        {rightContent && (
          <div className="flex items-center pt-1">{rightContent}</div>
        )}
      </div>
    </motion.div>
  );
}
