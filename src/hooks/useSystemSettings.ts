import { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';

export interface SystemSettings {
  plans: Array<{
    id: string;
    name: string;
    price: number;
    duration: string;
    features: string[];
    active: boolean;
  }>;
  servers: Array<{
    id: string;
    name: string;
    url: string;
    status: 'online' | 'offline' | 'maintenance';
    cost: number;
    active: boolean;
  }>;
  paymentMethods: Array<{
    id: string;
    name: string;
    type: string;
    active: boolean;
  }>;
  devices: Array<{
    id: string;
    name: string;
    type: string;
    active: boolean;
  }>;
  applications: Array<{
    id: string;
    name: string;
    platform: string;
    active: boolean;
  }>;
  leadSources: Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  plans: [
    { id: '1', name: 'Mensal', price: 30, duration: '1 mês', features: ['Acesso completo'], active: true },
    { id: '2', name: 'Trimestral', price: 90, duration: '3 meses', features: ['Acesso completo'], active: true },
    { id: '3', name: 'Semestral', price: 180, duration: '6 meses', features: ['Acesso completo'], active: true },
    { id: '4', name: 'Anual', price: 360, duration: '12 meses', features: ['Acesso completo'], active: true }
  ],
  servers: [
    { id: '1', name: 'Servidor 1', url: 'http://server1.com:8080', status: 'online', cost: 50, active: true },
    { id: '2', name: 'Servidor 2', url: 'http://server2.com:8080', status: 'online', cost: 60, active: true },
    { id: '3', name: 'Servidor 3', url: 'http://server3.com:8080', status: 'online', cost: 55, active: true }
  ],
  paymentMethods: [
    { id: '1', name: 'Pix', type: 'instant', active: true },
    { id: '2', name: 'Cartão', type: 'card', active: true },
    { id: '3', name: 'Boleto', type: 'boleto', active: true },
    { id: '4', name: 'Transferência', type: 'transfer', active: true }
  ],
  devices: [
    { id: '1', name: 'TV Box', type: 'tv', active: true },
    { id: '2', name: 'Smartphone', type: 'mobile', active: true },
    { id: '3', name: 'Tablet', type: 'tablet', active: true },
    { id: '4', name: 'Smart TV', type: 'smarttv', active: true },
    { id: '5', name: 'Computador', type: 'computer', active: true }
  ],
  applications: [
    { id: '1', name: 'IPTV Smarters', platform: 'multi', active: true },
    { id: '2', name: 'Tivimate', platform: 'android', active: true },
    { id: '3', name: 'Perfect Player', platform: 'multi', active: true },
    { id: '4', name: 'XCIPTV', platform: 'multi', active: true },
    { id: '5', name: 'Outro', platform: 'other', active: true }
  ],
  leadSources: []
};

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const context = useContext(DataContext);

  useEffect(() => {
    const loadSettings = () => {
      try {
        // Return default settings if no context is available (e.g., during testing)
        if (!context) {
          setSettings(DEFAULT_SETTINGS);
          setLoading(false);
          return;
        }

        const newSettings = { ...DEFAULT_SETTINGS };

        // Load from DataContext
        if (context.planos) {
          newSettings.plans = context.planos.map((plano: any) => ({
            id: plano.id,
            name: plano.nome,
            price: plano.preco,
            duration: `${plano.meses} meses`,
            features: ['Acesso completo'],
            active: plano.ativo
          }));
        }

        if (context.servidores) {
          newSettings.servers = context.servidores.map((servidor: any) => ({
            id: servidor.id,
            name: servidor.nome,
            url: 'http://example.com:8080',
            status: 'online' as const,
            cost: servidor.custo,
            active: servidor.ativo
          }));
        }

        if (context.formasPagamento) {
          newSettings.paymentMethods = context.formasPagamento.map((forma: any) => ({
            id: forma.id,
            name: forma.nome,
            type: 'instant',
            active: forma.ativo
          }));
        }

        if (context.dispositivos) {
          newSettings.devices = context.dispositivos.map((dispositivo: any) => ({
            id: dispositivo.id,
            name: dispositivo.nome,
            type: 'other',
            active: dispositivo.ativo
          }));
        }

        if (context.aplicativos) {
          newSettings.applications = context.aplicativos.map((aplicativo: any) => ({
            id: aplicativo.id,
            name: aplicativo.nome,
            platform: 'multi',
            active: aplicativo.ativo
          }));
        }

        if (context.prospeccoes) {
          newSettings.leadSources = context.prospeccoes.map((fonte: any) => ({
            id: fonte.id,
            name: fonte.nome,
            active: fonte.ativo
          }));
        }

        setSettings(newSettings);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [context]);

  const getActivePlans = () => settings.plans.filter(plan => plan.active);
  const getActiveServers = () => settings.servers.filter(server => server.active);
  const getActivePaymentMethods = () => settings.paymentMethods.filter(method => method.active);
  const getActiveDevices = () => settings.devices.filter(device => device.active);
  const getActiveApplications = () => settings.applications.filter(app => app.active);
  const getActiveLeadSources = () => settings.leadSources.filter(source => source.active);

  return {
    settings,
    loading,
    getActivePlans,
    getActiveServers,
    getActivePaymentMethods,
    getActiveDevices,
    getActiveApplications,
    getActiveLeadSources
  };
};