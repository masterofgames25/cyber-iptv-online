import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
  name: string;
  value: number;
  color: string;
}

interface CyberpunkPieChartProps {
  data: DataPoint[];
  title: string;
  centerText?: string;
  height?: number;
}

export const CyberpunkPieChart: React.FC<CyberpunkPieChartProps> = ({
  data,
  title,
  centerText,
  height = 300
}) => {
  const hasData = Array.isArray(data) && data.length > 0 && data.some(d => typeof d.value === 'number' && d.value > 0);
  // Transform data for Recharts with proper typing
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    fill: item.color,
    color: item.color // Keep original color for styling
  }));

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-xl p-6 border border-purple-500/30 hover:border-cyan-500/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-cyber-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse bg-cyan-400" />
          <span className="text-cyber-secondary text-sm">Total: {total.toLocaleString('pt-BR')}</span>
        </div>
      </div>
      
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-lg opacity-20"
          style={{ 
            background: 'conic-gradient(from 0deg, #FF00FF20, #00FFFF20, #00FF0020, #FF00FF20)',
            filter: 'blur(30px)',
            animation: 'spin 10s linear infinite'
          }}
        />
        
        {!hasData && (
          <div className="rounded-lg border border-purple-500/30 bg-black/40 p-6 text-center">
            <p className="text-gray-300 text-sm">Sem dados para exibir</p>
          </div>
        )}
        {hasData && (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <defs>
              <filter id="pieSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={2}
              minAngle={8}
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
              labelLine
              label={(props:any) => {
                const pct = (props?.percent || 0) * 100;
                return pct >= 6 ? String(props?.name ?? '') : '';
              }}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={activeIndex === index ? 3 : 2}
                  style={{
                    filter: `drop-shadow(0 0 8px ${entry.color}60)`,
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
              <LabelList position="inside" dataKey="value" formatter={(value:any)=> `${Math.round((Number(value) / (total || 1)) * 100)}%`} style={{ fill: '#fff', fontWeight: 700 }} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        )}
        
        {centerText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
                {centerText}
              </div>
              <div className="text-xs text-cyber-secondary mt-1">
                {total.toLocaleString('pt-BR')} unidades
              </div>
            </div>
          </div>
        )}
      </div>
      
      {hasData && (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ 
                background: item.color,
                boxShadow: `0 0 8px ${item.color}60`
              }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-cyber-primary">{item.name}</div>
              <div className="text-xs text-cyber-secondary">
                {item.value.toLocaleString('pt-BR')} ({((item.value / total) * 100).toFixed(1)}%)
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </motion.div>
  );
};

export default CyberpunkPieChart;