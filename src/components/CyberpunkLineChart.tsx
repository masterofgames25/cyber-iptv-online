import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
  name: string;
  value: number;
  revenue?: number;
  clients?: number;
}

interface CyberpunkLineChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  glowColor?: string;
  height?: number;
  area?: boolean;
  electric?: boolean;
  showDots?: boolean;
  animatedDots?: boolean;
  yTickFormatter?: (value: number) => string;
}

export const CyberpunkLineChart: React.FC<CyberpunkLineChartProps> = ({
  data,
  title,
  color = '#00FFFF',
  gradientStart = '#00FFFF',
  gradientEnd = '#FF00FF',
  glowColor = 'rgba(0, 255, 255, 0.3)',
  height = 300,
  area = false,
  electric = false,
  showDots = true,
  animatedDots = false,
  yTickFormatter
}) => {
  const hasData = Array.isArray(data) && data.length > 0 && data.some(d => typeof d.value === 'number');
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-3 rounded-lg border border-cyan-500/30"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
        >
          <p className="text-cyan-400 text-sm font-medium">{label}</p>
          <p className="text-white text-lg font-bold">
            {payload[0].value.toLocaleString('pt-BR')}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-xl p-6 border border-purple-500/30 hover:border-cyan-500/50 transition-all duration-300"
      >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold neon-text" style={{ letterSpacing: '0.5px' }}>{title}</h3>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 10px ${glowColor}` }}
          />
          <span className="text-cyber-secondary text-sm">Ativo</span>
        </div>
      </div>
      
      <div className="relative">
        {!hasData && (
          <div className="rounded-lg border border-purple-500/30 bg-black/40 p-6 text-center">
            <p className="text-gray-300 text-sm">Sem dados para exibir</p>
          </div>
        )}
        <div 
          className="absolute inset-0 rounded-lg cyber-holo-grid"
          style={{ opacity: 0.25 }}
        />
        <div 
          className="absolute inset-0 rounded-lg"
          style={{ 
            background: `linear-gradient(135deg, ${gradientStart}22, ${gradientEnd}22)`,
            filter: 'blur(18px)'
          }}
        />
        
        {hasData && (
        <ResponsiveContainer width="100%" height={height}>
          {area ? (
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientStart} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={gradientEnd} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)" 
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255, 255, 255, 0.5)" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => yTickFormatter ? yTickFormatter(value) : `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                fill="url(#colorGradient)"
                dot={showDots ? { fill: color, strokeWidth: 2, r: 4, className: animatedDots ? 'neon-pulse' : '' } : false}
                activeDot={showDots ? { r: 6, stroke: color, strokeWidth: 2, fill: '#000', className: animatedDots ? 'neon-pulse' : '' } : false}
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255, 255, 255, 0.1)" 
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255, 255, 255, 0.5)" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.5)" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => yTickFormatter ? yTickFormatter(value) : value.toLocaleString('pt-BR')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={4}
                dot={showDots ? { fill: color, strokeWidth: 2, r: 4, className: animatedDots ? 'neon-pulse' : '' } : false}
                activeDot={showDots ? { r: 7, stroke: color, strokeWidth: 2, fill: '#000', className: animatedDots ? 'neon-pulse' : '' } : false}
                filter={`drop-shadow(0 0 10px ${glowColor})`}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
        )}

        {electric && (
          <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="boltGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7C3AED"/>
                <stop offset="50%" stopColor="#22D3EE"/>
                <stop offset="100%" stopColor="#EC4899"/>
              </linearGradient>
              <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Cyberpunk lightning bolt overlay */}
            <path 
              d="M0 60 L10 55 L20 65 L30 50 L40 70 L50 45 L60 68 L70 52 L80 72 L90 48 L100 66"
              stroke="url(#boltGradient)"
              strokeWidth="1.8"
              fill="none"
              filter="url(#boltGlow)"
              style={{ strokeDasharray: 12, animation: 'bolt-flow 2.2s linear infinite' }}
            />
          </svg>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center text-xs text-cyber-secondary">
        <span className="tracking-wider">Últimos 30 dias</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full neon-pulse" style={{ background: color }} />
          <span className="tracking-wider">Em tempo real</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CyberpunkLineChart;