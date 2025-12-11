
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import CyberDashboard from './components/CyberDashboard';
import { CyberClientsList } from './components/CyberClientsList';
import CyberLeadsManager from './components/CyberLeadsManager';
import CyberBillingManager from './components/CyberBillingManager';
import CyberFinancials from './components/CyberFinancials';
import CyberSidebar from './components/CyberSidebar';
import CyberResellersManager from './components/CyberResellersManager';
import CyberReports from './components/CyberReports';
import CyberTestsList from './components/CyberTestsList';
import CyberTestForm from './components/CyberTestForm';
import CyberSystemSettings from './components/CyberSystemSettings';
import { CyberpunkLoader } from './components/CyberpunkLoader';

import { CyberpunkParticles, FloatingOrbs, GridBackground } from './components/CyberpunkParticles';
import { CyberpunkNotificationCenter, useRealTimeNotifications } from './components/CyberpunkNotificationCenter';

import './styles/cyberpunk.css';
import { testSystemData } from './utils/testSystem';

import { useAuth } from './context/AuthContext';
import { CyberLogin } from './components/CyberLogin';

type ViewType = 'dashboard' | 'clients' | 'leads' | 'billing' | 'financial' | 'resellers' | 'reports' | 'tests' | 'settings';

const CyberApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifySystemUpdate, notifyPaymentReceived, notifySubscriptionExpiring, notifyError, notifyNewLead } = useRealTimeNotifications();

  useEffect(() => {
    try {
      console.log('Sistema Neural SQLite iniciado com sucesso');
      testSystemData();
    } catch { }
  }, []);

  useEffect(() => {
    const enablePersistence = async () => {
      try {
        const api = (navigator as any).storage;
        if (api && typeof api.persist === 'function') {
          const persisted = await api.persist();
          if (persisted) console.log('Armazenamento persistente habilitado');
        }
      } catch (e) {
        console.warn('Erro ao habilitar persistência:', e);
      }
    };

    enablePersistence();
  }, []);

  useEffect(() => {
    const onNavigate = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (detail && typeof detail.view === 'string') {
          setCurrentView(detail.view as ViewType);
        }
      } catch { }
    };
    window.addEventListener('navigate', onNavigate as EventListener);
    return () => window.removeEventListener('navigate', onNavigate as EventListener);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <CyberDashboard />;
      case 'clients':
        return <CyberClientsList />;
      case 'leads':
        return <CyberLeadsManager />;
      case 'billing':
        return <CyberBillingManager />;
      case 'financial':
        return <CyberFinancials />;
      case 'resellers':
        return <CyberResellersManager />;
      case 'reports':
        return <CyberReports />;
      case 'tests':
        return <CyberTestsList />;
      case 'settings':
        return <CyberSystemSettings />;
      default:
        return <CyberDashboard />;
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen cyber-background flex items-center justify-center">
        <CyberpunkLoader size="lg" text="VERIFICANDO IDENTIDADE..." color="#00FFFF" />
      </div>
    );
  }

  if (!user) {
    return <CyberLogin />;
  }

  return (
    <div className="min-h-screen cyber-background text-white overflow-hidden relative font-sans">
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 cyber-background flex items-center justify-center z-[100]"
          >
            <CyberpunkLoader size="lg" text="INICIANDO SISTEMA NEURAL..." color="#00FFFF" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row h-screen overflow-hidden relative z-10">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 glass border-b border-purple-500/20 z-40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold neon-text">⚡ CYBER IPTV</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-cyan-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>

        {/* Sidebar Cyberpunk - Responsive Wrapper */}
        <CyberSidebar
          currentView={currentView}
          setCurrentView={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false); // Close sidebar on selection (mobile)
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 w-full relative">
          {renderContent()}
        </div>
      </div>

      {/* Notification Center */}
      <CyberpunkNotificationCenter position="top-right" />
    </div>
  );
};


export default CyberApp;