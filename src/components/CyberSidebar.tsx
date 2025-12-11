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
  BeakerIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface CyberSidebarProps {
  currentView: 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings';
  setCurrentView: (view: 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CyberSidebar: React.FC<CyberSidebarProps> = ({ currentView, setCurrentView, isOpen = false, onClose }) => {
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
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-[100]
        w-64 h-full
        glass border-r border-purple-500/20 p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-8 mt-2 md:mt-0">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold neon-text text-center mb-2"
          >
            ⚡ CYBER
          </motion.h1>
          <div className="h-px bg-gradient-to-r from-purple-500 to-pink-500"></div>
        </div>

        <nav className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <motion.button
                key={item.id}
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
                <Icon className="w-6 h-6 shrink-0" />
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

        <div className="mt-4 pt-4 border-t border-gray-800">
          <InstallPrompt />
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Sistema Online</span>
            </div>
            <div className="text-xs text-gray-500">
              Versão Cyberpunk 1.1
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleInstall}
        className="w-full mb-4 p-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-[0_0_15px_rgba(8,145,178,0.5)] flex items-center justify-center gap-2 group"
      >
        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
        <span className="text-sm">INSTALAR APP</span>
      </motion.button>

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowInstructions(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-purple-500 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Como Instalar</h3>
            <div className="space-y-4 text-gray-300 text-sm">
              <p>Instalação manual:</p>

              <div className="bg-white/5 p-3 rounded-lg">
                <strong className="text-cyan-400 block mb-1">PC (Chrome/Edge):</strong>
                Clique no ícone de download na barra de endereço.
              </div>

              <div className="bg-white/5 p-3 rounded-lg">
                <strong className="text-pink-400 block mb-1">Android (Chrome):</strong>
                Menu (3 pontos) ➝ "Instalar aplicativo".
              </div>

              <div className="bg-white/5 p-3 rounded-lg">
                <strong className="text-white block mb-1">iPhone (Safari):</strong>
                Compartilhar ➝ "Adicionar à Tela de Início".
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
            >
              Entendi
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default CyberSidebar;