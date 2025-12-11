import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowDownTrayIcon,
  ArrowRightStartOnRectangleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { CyberProfileModal } from './CyberProfileModal';

interface CyberSidebarProps {
  currentView: 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings';
  setCurrentView: (view: 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CyberSidebar: React.FC<CyberSidebarProps> = ({ currentView, setCurrentView, isOpen = false, onClose }) => {
  const { signOut } = useAuth();
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

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
      <AnimatePresence>
        {/* Mobile Backdrop */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Render Profile Modal */}
      {showProfileModal && <CyberProfileModal onClose={() => setShowProfileModal(false)} />}

      <div className={`fixed left-0 top-0 h-full background-cyber border-r border-purple-500/20 z-[100] transition-all duration-300 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-purple-500/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-xl font-bold text-white">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold neon-text">CYBER IPTV</h1>
            <p className="text-xs text-gray-500 tracking-wider">SYSTEM v2.0</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 transition-colors duration-300
                  ${isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-white'}
                `} />
                <span className={`font-medium transition-colors duration-300
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                `}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          {/* User Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-cyan-500/30 transition-all text-xs text-gray-300 hover:text-cyan-400"
              title="Alterar Senha"
            >
              <KeyIcon className="w-4 h-4" />
              Senha
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 hover:border-red-500/50 transition-all text-xs text-red-400 hover:text-red-300"
              title="Sair do Sistema"
            >
              <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
              Sair
            </button>
          </div>

          <InstallPrompt />

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Sistema Online</span>
            </div>
            <div className="text-xs text-gray-500">
              Versão Cyberpunk 1.1 + Auth
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