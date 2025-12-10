import React from 'react';
import { motion } from 'framer-motion';

interface CyberpunkLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  color?: string;
}

export const CyberpunkLoader: React.FC<CyberpunkLoaderProps> = ({ 
  size = 'md', 
  text = 'CARREGANDO...', 
  color = '#00FFFF' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={`${sizeClasses[size]} border-2 border-opacity-30 rounded-full`}
          style={{ borderColor: color }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Middle ring */}
        <motion.div
          className={`${sizeClasses[size]} border-2 border-opacity-50 rounded-full absolute top-0 left-0`}
          style={{ borderColor: color, borderLeftColor: 'transparent' }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Inner ring */}
        <motion.div
          className={`${sizeClasses[size]} border border-opacity-70 rounded-full absolute top-0 left-0`}
          style={{ borderColor: color, borderRightColor: 'transparent' }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Center glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}` }}
          />
        </motion.div>
      </div>

      {/* Loading text */}
      <motion.div
        className={`${textSizes[size]} font-mono font-bold text-cyber-primary`}
        style={{ color }}
        animate={{
          opacity: [0.4, 1, 0.4]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {text}
      </motion.div>

      {/* Progress dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: dot * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const CyberpunkSpinner: React.FC<{ color?: string }> = ({ color = '#00FFFF' }) => {
  return (
    <div className="relative w-6 h-6">
      <motion.div
        className="absolute inset-0 border-2 border-opacity-50 rounded-full"
        style={{ borderColor: color, borderTopColor: 'transparent' }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute inset-1 border border-opacity-30 rounded-full"
        style={{ borderColor: color, borderBottomColor: 'transparent' }}
        animate={{ rotate: -360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};