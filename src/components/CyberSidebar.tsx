import React from 'react';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  UsersIcon, 
  MegaphoneIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  UserGroupIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface CyberSidebarProps {
  currentView: 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings';
  setCurrentView: (view: 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings') => void;
}

export const CyberSidebar: React.FC<CyberSidebarProps> = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, color: 'from-purple-500 to-pink-500' },
    { id: 'clients', label: 'Clientes', icon: UsersIcon, color: 'from-cyan-500 to-blue-500' },
    { id: 'leads', label: 'Leads', icon: MegaphoneIcon, color: 'from-green-500 to-emerald-500' },
    { id: 'billing', label: 'Cobranças', icon: BanknotesIcon, color: 'from-red-500 to-orange-500' },
    { id: 'financial', label: 'Financeiro', icon: CurrencyDollarIcon, color: 'from-yellow-500 to-amber-500' },
    { id: 'resellers', label: 'Revendedores', icon: UserGroupIcon, color: 'from-indigo-500 to-purple-500' },
    { id: 'reports', label: 'Relatórios', icon: ChartBarIcon, color: 'from-teal-500 to-cyan-500' },
    { id: 'tests', label: 'Testes', icon: BeakerIcon, color: 'from-pink-500 to-rose-500' },
    { id: 'settings', label: 'Configurações', icon: Cog6ToothIcon, color: 'from-gray-500 to-slate-500' },
  ];

  return (
    <div className="w-64 min-h-screen glass border-r border-purple-500/20 p-6">
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold neon-text text-center mb-2"
        >
          ⚡ CYBER IPTV
        </motion.h1>
        <div className="h-px bg-gradient-to-r from-purple-500 to-pink-500"></div>
      </div>
      
      <nav className="space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView(item.id as any)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300
                ${isActive 
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                  : 'glass text-gray-300 hover:text-white hover:bg-purple-500/20'
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="font-semibold">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-8">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Sistema Online</span>
          </div>
          <div className="text-xs text-gray-500">
            Versão Cyberpunk 1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberSidebar;