import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CloudIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  TvIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Plano {
  id: string;
  nome: string;
  meses: number;
  preco: number;
  ativo: boolean;
}

interface Servidor {
  id: string;
  nome: string;
  custo: number;
  valorCredito?: number;
  ativo: boolean;
}

interface FormaPagamento {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Dispositivo {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Aplicativo {
  id: string;
  nome: string;
  ativo: boolean;
}

interface FonteLead {
  id: string;
  nome: string;
  ativo: boolean;
}

export default function CyberSystemSettings() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [aplicativos, setAplicativos] = useState<Aplicativo[]>([]);
  const [fontesLead, setFontesLead] = useState<FonteLead[]>([]);

  const [planoForm, setPlanoForm] = useState({ nome: '', meses: 1, preco: 0 });
  const [servidorForm, setServidorForm] = useState({ nome: '', custo: 0 });
  const [formaPagamentoForm, setFormaPagamentoForm] = useState('');
  const [dispositivoForm, setDispositivoForm] = useState('');
  const [aplicativoForm, setAplicativoForm] = useState('');
  const [fonteLeadForm, setFonteLeadForm] = useState('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteModal] = useState<{ open: boolean; section: 'planos' | 'servidores' | 'formas' | 'dispositivos' | 'aplicativos' | 'prospeccoes' | null }>({ open: false, section: null });
  const [confirmIndividualDeleteModal, setConfirmIndividualDeleteModal] = useState<{ open: boolean; item: any; section: string; itemName: string }>({ open: false, item: null, section: '', itemName: '' });
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = React.useRef<HTMLButtonElement | null>(null);


  // Load data from SQLite
  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      // Load planos
      const planosData = await api.planos.list();
      setPlanos(planosData);

      // Load servidores
      const servidoresData = await api.servidores.list();
      setServidores(servidoresData);

      // Load formas de pagamento
      const formasData = await api.formasPagamento.list();
      setFormasPagamento(formasData);

      // Load dispositivos
      const dispositivosData = await api.dispositivos.list();
      setDispositivos(dispositivosData);

      // Load aplicativos
      const aplicativosData = await api.aplicativos.list();
      setAplicativos(aplicativosData);

      // Load fontes de lead
      const fontesData = await api.fontesLead.list();
      setFontesLead(fontesData);
    } catch (error) {
      console.error('Error loading system settings:', error);
      showNotification('Erro ao carregar configurações do sistema', 'error');
    }
  };



  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const protectedDefaults: Record<string, Set<string>> = {
    planos: new Set<string>(),
    servidores: new Set<string>(),
    formas: new Set<string>(),
    dispositivos: new Set<string>(),
    aplicativos: new Set<string>(),
    prospeccoes: new Set<string>(),
  };

  const isProtectedItem = (_section: string, _nome: string): boolean => {
    return false;
  };

  const openIndividualDeleteConfirmation = (section: string, item: any, itemName: string) => {
    if (isProtectedItem(section, itemName)) {
      showNotification('Item padrão do sistema não pode ser excluído', 'error');
      return;
    }
    setConfirmIndividualDeleteModal({ open: true, item, section, itemName });
  };

  const performIndividualDeletion = async () => {
    const { item, section } = confirmIndividualDeleteModal;
    if (!item || !section) return;

    try {
      if (section === 'planos') {
        const updatedPlanos = planos.filter(p => p.id !== item.id);
        setPlanos(updatedPlanos);
        await api.planos.save(updatedPlanos);
      } else if (section === 'servidores') {
        const updatedServidores = servidores.filter(s => s.id !== item.id);
        setServidores(updatedServidores);
        await api.servidores.save(updatedServidores);
      } else if (section === 'formas') {
        const updatedFormas = formasPagamento.filter(f => f.id !== item.id);
        setFormasPagamento(updatedFormas);
        await api.formasPagamento.save(updatedFormas);
      } else if (section === 'dispositivos') {
        const updatedDispositivos = dispositivos.filter(d => d.id !== item.id);
        setDispositivos(updatedDispositivos);
        await api.dispositivos.save(updatedDispositivos);
      } else if (section === 'aplicativos') {
        const updatedAplicativos = aplicativos.filter(a => a.id !== item.id);
        setAplicativos(updatedAplicativos);
        await api.aplicativos.save(updatedAplicativos);
      } else if (section === 'prospeccoes') {
        const updatedFontes = fontesLead.filter(f => f.id !== item.id);
        setFontesLead(updatedFontes);
        await api.fontesLead.save(updatedFontes);
      }

      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      showNotification('Item excluído com sucesso.', 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('Erro ao excluir item.', 'error');
    }

    setConfirmIndividualDeleteModal({ open: false, item: null, section: '', itemName: '' });
  };

  const addPlano = async () => {
    if (!planoForm.nome || planoForm.preco <= 0) {
      showNotification('Preencha o nome e preço do plano', 'error');
      return;
    }

    const exists = planos.some(p => String(p.nome).trim().toLowerCase() === String(planoForm.nome).trim().toLowerCase());
    if (exists) { showNotification('Plano já existe', 'error'); return; }
    const newPlano: Plano = {
      id: Date.now().toString(),
      ...planoForm,
      ativo: true
    };

    const updatedPlanos = [...planos, newPlano];
    setPlanos(updatedPlanos);

    try {
      await api.planos.save(updatedPlanos);
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      setPlanoForm({ nome: '', meses: 1, preco: 0 });
      showNotification('Plano adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving plano:', error);
      showNotification('Erro ao salvar plano', 'error');
    }
  };

  const removePlano = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      const updatedPlanos = planos.filter(plano => plano.id !== id);
      setPlanos(updatedPlanos);

      try {
        await api.planos.save(updatedPlanos);
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        showNotification('Plano removido com sucesso!', 'success');
      } catch (error) {
        console.error('Error removing plano:', error);
        showNotification('Erro ao remover plano', 'error');
      }
    }
  };

  const addServidor = async () => {
    if (!servidorForm.nome || servidorForm.custo <= 0) {
      showNotification('Preencha o nome e custo do servidor', 'error');
      return;
    }

    const exists = servidores.some(s => String(s.nome).trim().toLowerCase() === String(servidorForm.nome).trim().toLowerCase());
    if (exists) { showNotification('Servidor já existe', 'error'); return; }
    const newServidor: Servidor = {
      id: Date.now().toString(),
      ...servidorForm,
      ativo: true
    };

    const updatedServidores = [...servidores, newServidor];
    setServidores(updatedServidores);

    try {
      await api.servidores.save(updatedServidores);
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      setServidorForm({ nome: '', custo: 0 });
      showNotification('Servidor adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving servidor:', error);
      showNotification('Erro ao salvar servidor', 'error');
    }
  };

  const removeServidor = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este servidor?')) {
      const updatedServidores = servidores.filter(servidor => servidor.id !== id);
      setServidores(updatedServidores);

      try {
        await api.servidores.save(updatedServidores);
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        showNotification('Servidor removido com sucesso!', 'success');
      } catch (error) {
        console.error('Error removing servidor:', error);
        showNotification('Erro ao remover servidor', 'error');
      }
    }
  };

  const addFormaPagamento = async () => {
    if (!formaPagamentoForm.trim()) {
      showNotification('Digite o nome da forma de pagamento', 'error');
      return;
    }

    const exists = formasPagamento.some(f => String(f.nome).trim().toLowerCase() === String(formaPagamentoForm).trim().toLowerCase());
    if (exists) { showNotification('Forma de pagamento já existe', 'error'); return; }
    const newFormaPagamento: FormaPagamento = {
      id: Date.now().toString(),
      nome: formaPagamentoForm,
      ativo: true
    };

    const updatedFormasPagamento = [...formasPagamento, newFormaPagamento];
    setFormasPagamento(updatedFormasPagamento);

    try {
      await api.formasPagamento.save(updatedFormasPagamento);
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      setFormaPagamentoForm('');
      showNotification('Forma de pagamento adicionada com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving forma de pagamento:', error);
      showNotification('Erro ao salvar forma de pagamento', 'error');
    }
  };

  const removeFormaPagamento = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      const updatedFormasPagamento = formasPagamento.filter(forma => forma.id !== id);
      setFormasPagamento(updatedFormasPagamento);

      try {
        await api.formasPagamento.save(updatedFormasPagamento);
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        showNotification('Forma de pagamento removida com sucesso!', 'success');
      } catch (error) {
        console.error('Error removing forma de pagamento:', error);
        showNotification('Erro ao remover forma de pagamento', 'error');
      }
    }
  };

  const addDispositivo = async () => {
    if (!dispositivoForm.trim()) {
      showNotification('Digite o nome do dispositivo', 'error');
      return;
    }

    const exists = dispositivos.some(d => String(d.nome).trim().toLowerCase() === String(dispositivoForm).trim().toLowerCase());
    if (exists) { showNotification('Dispositivo já existe', 'error'); return; }
    const newDispositivo: Dispositivo = {
      id: Date.now().toString(),
      nome: dispositivoForm,
      ativo: true
    };

    const updatedDispositivos = [...dispositivos, newDispositivo];
    setDispositivos(updatedDispositivos);

    try {
      await api.dispositivos.save(updatedDispositivos);
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      setDispositivoForm('');
      showNotification('Dispositivo adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving dispositivo:', error);
      showNotification('Erro ao salvar dispositivo', 'error');
    }
  };

  const removeDispositivo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este dispositivo?')) {
      const updatedDispositivos = dispositivos.filter(dispositivo => dispositivo.id !== id);
      setDispositivos(updatedDispositivos);

      try {
        await api.dispositivos.save(updatedDispositivos);
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        showNotification('Dispositivo removido com sucesso!', 'success');
      } catch (error) {
        console.error('Error removing dispositivo:', error);
        showNotification('Erro ao remover dispositivo', 'error');
      }
    }
  };

  const addAplicativo = async () => {
    if (!aplicativoForm.trim()) {
      showNotification('Digite o nome do aplicativo', 'error');
      return;
    }

    const exists = aplicativos.some(a => String(a.nome).trim().toLowerCase() === String(aplicativoForm).trim().toLowerCase());
    if (exists) { showNotification('Aplicativo já existe', 'error'); return; }
    const newAplicativo: Aplicativo = {
      id: Date.now().toString(),
      nome: aplicativoForm,
      ativo: true
    };

    const updatedAplicativos = [...aplicativos, newAplicativo];
    setAplicativos(updatedAplicativos);

    try {
      await api.aplicativos.save(updatedAplicativos);
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      setAplicativoForm('');
      showNotification('Aplicativo adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving aplicativo:', error);
      showNotification('Erro ao salvar aplicativo', 'error');
    }
  };

  const removeAplicativo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este aplicativo?')) {
      const updatedAplicativos = aplicativos.filter(aplicativo => aplicativo.id !== id);
      setAplicativos(updatedAplicativos);

      try {
        await api.aplicativos.save(updatedAplicativos);
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        showNotification('Aplicativo removido com sucesso!', 'success');
      } catch (error) {
        console.error('Error removing aplicativo:', error);
        showNotification('Erro ao remover aplicativo', 'error');
      }
    }
  };

  const addFonteLead = async () => {
    if (!fonteLeadForm.trim()) {
      showNotification('Digite o nome da fonte de lead', 'error');
      return;
    }

    const exists = fontesLead.some(f => String(f.nome).trim().toLowerCase() === String(fonteLeadForm).trim().toLowerCase());
    if (exists) { showNotification('Prospecção já existe', 'error'); return; }
    const newFonteLead: FonteLead = {
      id: Date.now().toString(),
      nome: fonteLeadForm,
      ativo: true
    };

    const updatedFontesLead = [...fontesLead, newFonteLead];
    setFontesLead(updatedFontesLead);

    try {
      await api.fontesLead.save(updatedFontesLead);
      window.dispatchEvent(new CustomEvent('settingsUpdated'));
      setFonteLeadForm('');
      showNotification('Fonte de lead adicionada com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving fonte de lead:', error);
      showNotification('Erro ao salvar fonte de lead', 'error');
    }
  };

  const removeFonteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta fonte de lead?')) {
      const updatedFontesLead = fontesLead.filter(fonte => fonte.id !== id);
      setFontesLead(updatedFontesLead);

      try {
        await api.fontesLead.save(updatedFontesLead);
        window.dispatchEvent(new CustomEvent('settingsUpdated'));
        showNotification('Fonte de lead removida com sucesso!', 'success');
      } catch (error) {
        console.error('Error removing fonte de lead:', error);
        showNotification('Erro ao remover fonte de lead', 'error');
      }
    }
  };

  // Removed exportData function - no longer needed with SQLite
  // Removed importData function - no longer needed with SQLite

  const clearAllData = async () => {
    setConfirmClearAll(true);
  };

  // Removed restoreConfigsFromBackup function - no longer needed with SQLite



  const ensureDefaultConfigs = async () => {
    try {
      // Check if we have data in SQLite, if not create defaults
      const planosData = await api.planos.list();
      const servidoresData = await api.servidores.list();
      const formasData = await api.formasPagamento.list();
      const dispositivosData = await api.dispositivos.list();
      const aplicativosData = await api.aplicativos.list();
      const fontesData = await api.fontesLead.list();


      if (planosData.length === 0) {
        const defaults = [
          { id: '1', nome: 'MENSAL', meses: 1, preco: 30, ativo: true },
          { id: '2', nome: 'TRIMESTRAL', meses: 3, preco: 90, ativo: true },
          { id: '3', nome: 'SEMESTRAL', meses: 6, preco: 180, ativo: true },
          { id: '4', nome: 'ANUAL', meses: 12, preco: 360, ativo: true }
        ];
        await api.planos.save(defaults);
      }

      if (servidoresData.length === 0) {
        const defaults = [
          { id: '1', nome: 'BLAZE', custo: 4.0, valorCredito: 4.0, ativo: true },
          { id: '2', nome: 'NEWTVS', custo: 6.5, valorCredito: 6.5, ativo: true },
          { id: '3', nome: 'MEGGA', custo: 4.0, valorCredito: 4.0, ativo: true },
          { id: '4', nome: 'P2PNEWTVS', custo: 6.5, valorCredito: 6.5, ativo: true }
        ];
        await api.servidores.save(defaults);
      }

      if (formasData.length === 0) {
        const defaults = [
          { id: '1', nome: 'PIX', ativo: true },
          { id: '2', nome: 'Dinheiro', ativo: true },
          { id: '3', nome: 'Mercado Pago', ativo: true },
          { id: '4', nome: 'Cartão de Crédito', ativo: true }
        ];
        await api.formasPagamento.save(defaults);
      }

      if (dispositivosData.length === 0) {
        const defaults = [
          { id: '1', nome: 'TV Box', ativo: true },
          { id: '2', nome: 'Celular', ativo: true },
          { id: '3', nome: 'Computador', ativo: true },
          { id: '4', nome: 'Smart TV LG', ativo: true },
          { id: '5', nome: 'Smart TV Samsung', ativo: true },
          { id: '6', nome: 'Smart TV Philco', ativo: true },
          { id: '7', nome: 'Smart TV Multilazer', ativo: true },
          { id: '8', nome: 'Smart TV TLC', ativo: true }
        ];
        await api.dispositivos.save(defaults);
      }

      if (aplicativosData.length === 0) {
        const defaults = [
          { id: '1', nome: 'IPTV Smarters', ativo: true },
          { id: '2', nome: 'XCIPTV', ativo: true },
          { id: '3', nome: 'IBO BLAZE', ativo: true },
          { id: '4', nome: 'LAZER PLAYER', ativo: true },
          { id: '5', nome: 'NEW TVS', ativo: true },
          { id: '6', nome: 'PRIME IPTV', ativo: true },
          { id: '7', nome: 'XCLOUD', ativo: true },
          { id: '8', nome: 'BLAZE MAX', ativo: true },
          { id: '9', nome: 'IBO PRO PLAYER', ativo: true },
          { id: '10', nome: 'IBO PLAYER', ativo: true },
          { id: '11', nome: 'MEGGA', ativo: true },
          { id: '12', nome: 'FUNPLAY', ativo: true },
          { id: '13', nome: 'PLAYSIM', ativo: true }
        ];
        await api.aplicativos.save(defaults);
      }

      if (fontesData.length === 0) {
        const defaults = [
          { id: '1', nome: 'Redes Sociais', ativo: true },
          { id: '2', nome: 'Indicação', ativo: true },
          { id: '3', nome: 'WhatsApp', ativo: true },
          { id: '4', nome: 'YouTube', ativo: true },
          { id: '5', nome: 'Outros', ativo: true },
          { id: '6', nome: 'Direto', ativo: true }
        ];
        await api.fontesLead.save(defaults);
      }

      window.dispatchEvent(new CustomEvent('settingsUpdated'));
    } catch (error) {
      console.error('Error ensuring default configs:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold neon-text mb-4">⚙️ Configurações do Sistema</h1>
        <p className="text-gray-300 text-lg">Gerencie planos, servidores, formas de pagamento e muito mais</p>
      </motion.div>

      {/* Planos Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border border-cyan-500/30 cyber-glow"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 mr-3 text-cyan-400" />
          Planos
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Nome do plano"
            value={planoForm.nome}
            onChange={(e) => setPlanoForm({ ...planoForm, nome: e.target.value })}
            className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
          />
          <input
            type="number"
            placeholder="Meses"
            value={planoForm.meses}
            onChange={(e) => setPlanoForm({ ...planoForm, meses: parseInt(e.target.value) || 1 })}
            className="w-24 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
          />
          <input
            type="number"
            placeholder="Preço"
            value={planoForm.preco}
            onChange={(e) => setPlanoForm({ ...planoForm, preco: parseFloat(e.target.value) || 0 })}
            className="w-32 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
          />
          <button
            onClick={addPlano}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 cyber-button flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {planos.map((plano) => (
            <motion.div
              key={plano.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-black/30 border border-gray-600 rounded-lg p-4 flex justify-between items-center hover:border-cyan-500/50 transition-all duration-300`}
            >
              <div>
                <h3 className={`font-semibold ${isProtectedItem('planos', plano.nome) ? 'text-yellow-400' : 'text-white'}`}>
                  {plano.nome}
                  {isProtectedItem('planos', plano.nome) && (
                    <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Protegido</span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm">{plano.meses} meses</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-bold ${plano.preco <= 50 ? 'text-green-400' :
                  plano.preco <= 100 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                  R$ {plano.preco.toFixed(2)}
                </span>
                <div className="flex space-x-1">
                  <button
                    aria-label="Excluir item individualmente"
                    onClick={() => openIndividualDeleteConfirmation('planos', plano, plano.nome)}
                    disabled={isProtectedItem('planos', plano.nome)}
                    className={`px-2 py-1 rounded transition-all duration-300 ${isProtectedItem('planos', plano.nome) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                      'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                      }`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </motion.div>

      {/* Servidores Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-8 border border-purple-500/30 cyber-glow"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <CloudIcon className="h-6 w-6 mr-3 text-purple-400" />
          Servidores e Custo de Crédito
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Nome do servidor"
            value={servidorForm.nome}
            onChange={(e) => setServidorForm({ ...servidorForm, nome: e.target.value })}
            className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
          />
          <input
            type="number"
            placeholder="Custo R$"
            step="0.01"
            value={servidorForm.custo}
            onChange={(e) => setServidorForm({ ...servidorForm, custo: parseFloat(e.target.value) || 0 })}
            className="w-32 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
          />

          <button
            onClick={addServidor}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 cyber-button flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Adicionar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servidores.map((servidor) => (
            <motion.div
              key={servidor.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-black/30 border border-gray-600 rounded-lg p-4 flex justify-between items-center hover:border-purple-500/50 transition-all duration-300`}
            >
              <span className={`font-semibold ${isProtectedItem('servidores', servidor.nome) ? 'text-yellow-400' : 'text-white'}`}>
                {servidor.nome}
                {isProtectedItem('servidores', servidor.nome) && (
                  <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Protegido</span>
                )}
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-orange-400">Custo R$ {servidor.custo.toFixed(2)}</span>
                <div className="flex space-x-1">
                  <button
                    aria-label="Excluir item individualmente"
                    onClick={() => openIndividualDeleteConfirmation('servidores', servidor, servidor.nome)}
                    disabled={isProtectedItem('servidores', servidor.nome)}
                    className={`px-2 py-1 rounded transition-all duration-300 ${isProtectedItem('servidores', servidor.nome) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                      'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                      }`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </motion.div>

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formas de Pagamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border border-green-500/30 cyber-glow"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2 text-green-400" />
            Formas de Pagamento
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nova forma de pagamento"
              value={formaPagamentoForm}
              onChange={(e) => setFormaPagamentoForm(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 outline-none transition-all text-sm"
            />
            <button
              onClick={addFormaPagamento}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 cyber-button text-sm flex items-center"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {formasPagamento.map((forma) => (
              <motion.div
                key={forma.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-black/30 border border-gray-600 rounded p-3 flex justify-between items-center hover:border-green-500/50 transition-all duration-300`}
              >
                <span className={`text-sm ${isProtectedItem('formas', forma.nome) ? 'text-yellow-400' : 'text-white'}`}>
                  {forma.nome}
                  {isProtectedItem('formas', forma.nome) && (
                    <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Protegido</span>
                  )}
                </span>
                <div className="flex space-x-1">
                  <button
                    aria-label="Excluir item individualmente"
                    onClick={() => openIndividualDeleteConfirmation('formas', forma, forma.nome)}
                    disabled={isProtectedItem('formas', forma.nome)}
                    className={`px-2 py-1 rounded transition-all duration-300 ${isProtectedItem('formas', forma.nome) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                      'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                      }`}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>

        {/* Dispositivos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-blue-500/30 cyber-glow"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-blue-400" />
            Dispositivos
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Novo dispositivo"
              value={dispositivoForm}
              onChange={(e) => setDispositivoForm(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm"
            />
            <button
              onClick={addDispositivo}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 cyber-button text-sm flex items-center"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {dispositivos.map((dispositivo) => (
              <motion.div
                key={dispositivo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-black/30 border border-gray-600 rounded p-3 flex justify-between items-center hover:border-blue-500/50 transition-all duration-300`}
              >
                <span className={`text-sm ${isProtectedItem('dispositivos', dispositivo.nome) ? 'text-yellow-400' : 'text-white'}`}>
                  {dispositivo.nome}
                  {isProtectedItem('dispositivos', dispositivo.nome) && (
                    <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Protegido</span>
                  )}
                </span>
                <div className="flex space-x-1">
                  <button
                    aria-label="Excluir item individualmente"
                    onClick={() => openIndividualDeleteConfirmation('dispositivos', dispositivo, dispositivo.nome)}
                    disabled={isProtectedItem('dispositivos', dispositivo.nome)}
                    className={`px-2 py-1 rounded transition-all duration-300 ${isProtectedItem('dispositivos', dispositivo.nome) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                      'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                      }`}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>

        {/* Aplicativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-purple-500/30 cyber-glow"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <PlayIcon className="h-5 w-5 mr-2 text-purple-400" />
            Aplicativos
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Novo aplicativo"
              value={aplicativoForm}
              onChange={(e) => setAplicativoForm(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm"
            />
            <button
              onClick={addAplicativo}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 cyber-button text-sm flex items-center"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {aplicativos.map((aplicativo) => (
              <motion.div
                key={aplicativo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-black/30 border border-gray-600 rounded p-3 flex justify-between items-center hover:border-purple-500/50 transition-all duration-300`}
              >
                <span className={`text-sm ${isProtectedItem('aplicativos', aplicativo.nome) ? 'text-yellow-400' : 'text-white'}`}>
                  {aplicativo.nome}
                  {isProtectedItem('aplicativos', aplicativo.nome) && (
                    <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Protegido</span>
                  )}
                </span>
                <div className="flex space-x-1">
                  <button
                    aria-label="Excluir item individualmente"
                    onClick={() => openIndividualDeleteConfirmation('aplicativos', aplicativo, aplicativo.nome)}
                    disabled={isProtectedItem('aplicativos', aplicativo.nome)}
                    className={`px-2 py-1 rounded transition-all duration-300 ${isProtectedItem('aplicativos', aplicativo.nome) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                      'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                      }`}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>

      {/* Prospecção */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6 border border-orange-500/30 cyber-glow"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-400" />
          Prospecção
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nova prospecção"
            value={fonteLeadForm}
            onChange={(e) => setFonteLeadForm(e.target.value)}
            className="flex-1 px-3 py-2 bg-black/50 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all text-sm"
          />
          <button
            onClick={addFonteLead}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 cyber-button text-sm flex items-center"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Adicionar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {fontesLead.map((fonte) => (
            <motion.div
              key={fonte.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-black/30 border border-gray-600 rounded p-3 flex justify-between items-center hover:border-orange-500/50 transition-all duration-300`}
            >
              <span className={`text-sm ${isProtectedItem('prospeccoes', fonte.nome) ? 'text-yellow-400' : 'text-white'}`}>
                {fonte.nome}
                {isProtectedItem('prospeccoes', fonte.nome) && (
                  <span className="ml-2 text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">Protegido</span>
                )}
              </span>
              <div className="flex space-x-1">
                <button
                  aria-label="Excluir item individualmente"
                  onClick={() => openIndividualDeleteConfirmation('prospeccoes', fonte, fonte.nome)}
                  disabled={isProtectedItem('prospeccoes', fonte.nome)}
                  className={`px-2 py-1 rounded transition-all duration-300 ${isProtectedItem('prospeccoes', fonte.nome) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                    'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                    }`}
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </motion.div>

      {/* Gerenciamento de Dados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-8 border border-red-500/30 cyber-glow"
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 mr-3 text-red-400" />
          Gerenciamento de Dados
        </h2>

        <p className="text-gray-400 mb-6">
          Limpe todos os dados da aplicação.
          Cuidado, algumas ações são irreversíveis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Limpar Dados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/30 border border-gray-600 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <TrashIcon className="h-6 w-6 text-red-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Limpar Todos os Dados</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Exclua permanentemente todos os dados da aplicação. Esta ação não pode ser desfeita.
            </p>
            <button
              onClick={clearAllData}
              className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Limpar Dados
            </button>
          </motion.div>

          {/* Garantir Padrões Essenciais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/30 border border-gray-600 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-purple-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Garantir Padrões Essenciais</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Garante que todos os padrões essenciais do sistema estejam configurados.
            </p>
            <button
              onClick={ensureDefaultConfigs}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Garantir Padrões
            </button>
          </motion.div>
        </div>
      </motion.div>



      {confirmIndividualDeleteModal.open && (
        <div role="dialog" aria-modal="true" aria-labelledby="individual-confirm-title" aria-describedby="individual-confirm-desc" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass rounded-2xl p-6 border border-red-500/50 bg-black/60 backdrop-blur-xl shadow-[0_0_20px_#dc2626] max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mr-3 animate-pulse" />
              <h3 id="individual-confirm-title" className="text-xl font-bold text-white font-mono">Confirmar Exclusão Individual</h3>
            </div>
            <p id="individual-confirm-desc" className="text-gray-300 mb-4 font-mono">
              Tem certeza que deseja excluir permanentemente o item:
            </p>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400 font-mono text-lg text-center">
                "{confirmIndividualDeleteModal.itemName}"
              </p>
            </div>
            <p className="text-yellow-400 text-sm mb-4 font-mono">⚠️ Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={performIndividualDeletion}
                className="flex-1 px-4 py-2 font-mono rounded bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-[0_0_12px_#dc2626] hover:shadow-[0_0_20px_#dc2626] animate-pulse transition-all duration-300"
              >
                Confirmar Exclusão
              </button>
              <button
                onClick={() => setConfirmIndividualDeleteModal({ open: false, item: null, section: '', itemName: '' })}
                className="flex-1 px-4 py-2 font-mono rounded bg-gray-700 text-white hover:bg-gray-600 transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {confirmClearAll && (
        <div role="dialog" aria-modal="true" aria-labelledby="clearall-confirm-title" aria-describedby="clearall-confirm-desc" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass rounded-2xl p-6 border border-red-500/50 bg-black/60 backdrop-blur-xl shadow-[0_0_20px_#dc2626] max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mr-3 animate-pulse" />
              <h3 id="clearall-confirm-title" className="text-xl font-bold text-white font-mono">Confirmar Limpeza Total</h3>
            </div>
            <p id="clearall-confirm-desc" className="text-gray-300 mb-4 font-mono">
              Esta ação removerá Clientes, Leads, Testes, Receita, Revendedores e Logs do Sistema. Configurações (Planos, Servidores, Formas, Dispositivos, Aplicativos, Prospecções) serão preservadas.
            </p>
            <p className="text-yellow-400 text-sm mb-4 font-mono">⚠️ Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    // Clear all data not available in PWA - would need admin backend endpoint
                    console.warn('⚠️ clearAllData não disponível na versão PWA');
                    showNotification('Limpeza de dados em massa não disponível na versão online', 'error');
                    setConfirmClearAll(false);
                  } catch (error) {
                    console.error('Error clearing data:', error);
                    showNotification('Erro ao limpar dados', 'error');
                  } finally {
                    setConfirmLoading(false);
                  }
                }}
                className="flex-1 px-4 py-2 font-mono rounded bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-[0_0_12px_#dc2626] hover:shadow-[0_0_20px_#dc2626] transition-all duration-300"
                ref={confirmBtnRef}
                disabled={confirmLoading}
              >
                Confirmar Limpeza
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="flex-1 px-4 py-2 font-mono rounded bg-gray-700 text-white hover:bg-gray-600 transition-all duration-300"
                ref={cancelBtnRef}
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-lg border backdrop-blur-xl z-50 ${notification.type === 'success'
              ? 'bg-green-500/20 border-green-500/50 text-green-400'
              : 'bg-red-500/20 border-red-500/50 text-red-400'
              }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}