import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface RealtimeStatProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  trend?: 'up' | 'down' | 'neutral';
  suffix?: string;
  prefix?: string;
}

export const RealtimeStat: React.FC<RealtimeStatProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  glowColor,
  trend = 'neutral',
  suffix = '',
  prefix = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof value === 'number' && displayValue !== value) {
      setIsAnimating(true);
      const startValue = typeof displayValue === 'number' ? displayValue : 0;
      const endValue = value;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (endValue - startValue) * easeOutQuart;
        
        setDisplayValue(Math.round(currentValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-current" />;
    }
  };

  const formatValue = () => {
    if (typeof displayValue === 'number') {
      return displayValue.toLocaleString('pt-BR');
    }
    return displayValue;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="relative group"
    >
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"
        style={{ 
          background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)`,
          filter: 'blur(20px)'
        }}
      />
      
      {/* Main card */}
      <div 
        className="relative glass rounded-xl p-6 border transition-all duration-300"
        style={{ 
          borderColor: color,
          boxShadow: `0 0 20px ${glowColor}30`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                rotate: isAnimating ? [0, 360] : 0,
                scale: isAnimating ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 1, repeat: isAnimating ? Infinity : 0 }}
              className="p-2 rounded-lg"
              style={{ 
                background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                border: `1px solid ${color}`
              }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </motion.div>
            <h3 className="text-sm font-medium text-cyber-secondary">{title}</h3>
          </div>
          
          {/* Trend indicator */}
          {change !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                trend === 'up' ? 'text-green-400 bg-green-400/20' :
                trend === 'down' ? 'text-red-400 bg-red-400/20' :
                'text-gray-400 bg-gray-400/20'
              }`}
            >
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
            </motion.div>
          )}
        </div>
        
        {/* Value */}
        <motion.div
          key={String(value)}
          initial={{ scale: 1.2, color: color }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold mb-2"
          style={{ textShadow: `0 0 20px ${glowColor}` }}
        >
          {prefix}{formatValue()}{suffix}
        </motion.div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span className="text-xs text-cyber-secondary">Atualizado agora</span>
        </div>
        
        {/* Animated border */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(45deg, transparent, ${color}40, transparent)`,
            animation: 'pulse 2s infinite'
          }}
        />
      </div>
    </motion.div>
  );
};

export default RealtimeStat;