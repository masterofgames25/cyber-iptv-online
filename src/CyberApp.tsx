
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
    <div className="min-h-screen cyber-background text-white overflow-hidden relative">
      {/* Cyberpunk Background Effects */}


      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 cyber-background flex items-center justify-center z-50"
          >
            <CyberpunkLoader size="lg" text="INICIANDO SISTEMA NEURAL..." color="#00FFFF" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!isLoading && (
        <div className="flex relative z-10">
          {/* Sidebar Cyberpunk */}
          <CyberSidebar currentView={currentView} setCurrentView={setCurrentView} />

          {/* Conteúdo Principal */}
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </div>
      )}



      {/* Notification Center */}
      <CyberpunkNotificationCenter position="top-right" />
    </div>
  );
};


export default CyberApp;