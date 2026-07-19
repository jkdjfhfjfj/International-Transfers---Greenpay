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
  const paddingMap = {
    sm: '12px 16px',
    md: '16px 20px',
    lg: '20px 20px',
  };

  const minHeightMap = {
    sm: 64,
    md: 80,
    lg: 100,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #16a34a 100%)',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        padding: paddingMap[size],
        minHeight: minHeightMap[size],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
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
    </motion.div>
  );
}
