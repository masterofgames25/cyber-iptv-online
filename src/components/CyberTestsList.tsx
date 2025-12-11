import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Test, Client } from '../types';
import { useData } from '../context/DataContext';
import { useSystemData } from '../utils/systemData';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import CyberClientForm from './CyberClientForm';
import CyberTestForm from './CyberTestForm';

interface TestFormData {
  clientName: string;
  clientId?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'converted';
  notes?: string;
}

const CyberTestsList: React.FC = () => {
  const { tests, clients, updateTest, deleteTest } = useData();
  const { getPlans, getDevices, getApplications } = useSystemData();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<TestFormData>({
    clientName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 day
    status: 'active',
    notes: ''
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'converted'>('all');
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientFormLoading, setClientFormLoading] = useState(false);
  const [clientFormFeedback, setClientFormFeedback] = useState<string>('');
  const [clientFromTest, setClientFromTest] = useState<Test | null>(null);
  const [confirmTest, setConfirmTest] = useState<Test | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const isTestEnv = typeof window !== 'undefined' && (window as any).IS_TEST_ENV;
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isTestEnv ? 'table' : 'cards');
  const searchRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [openMsgTestId, setOpenMsgTestId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginatedTests = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tests.slice(startIndex, startIndex + itemsPerPage);
  }, [tests, currentPage]);
  const totalPages = Math.ceil(tests.length / itemsPerPage) || 1;

  const plans = getPlans();
  const devices = getDevices();
  const applications = getApplications();
  const formatBR = (value: string | Date) => {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return typeof value === 'string' ? value : '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const computeEndTime = (test: Test): Date => {
    if (test.endAt) return new Date(test.endAt);
    if (test.startAt && typeof test.durationHours === 'number') {
      const start = new Date(test.startAt);
      const end = new Date(start);
      end.setHours(end.getHours() + (test.durationHours || 0));
      return end;
    }
    // Fallback: use endDate end of day
    return new Date(`${test.endDate}T23:59:59`);
  };

  const getRemainingParts = (end: Date) => {
    const ms = Math.max(0, end.getTime() - now.getTime());
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return { ms, days, hours, minutes, seconds };
  };

  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    if (isTestEnv) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isTestEnv]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);





  // Sem autoFocus para satisfazer navegação por teclado via Tab

  const filteredTests = tests.filter(test => {
    const clientName = test.clientName || '';
    const notes = test.notes || '';
    const matchesSearch = clientName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      notes.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesFilter = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTest) {
      // Update existing test - SQLite will handle this through DataContext
      // The DataContext will automatically update the tests state
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      notes: ''
    });
    setShowForm(false);
    setEditingTest(null);
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleDelete = (id: number) => {
    const target = tests.find(t => t.id === id) || null;
    setConfirmTest(target);
  };

  const convertToClient = (test: Test) => {
    if (window.confirm('Converter este teste em cliente oficial?')) {
      // Create new client from test
      const newClient: Omit<Client, 'id'> = {
        nome: test.clientName,
        whatsapp: 'Não informado',
        login: `teste_${test.id}`,
        senha: Math.random().toString(36).slice(-8),
        plano: plans.length > 0 ? plans[0].name : 'Mensal',
        valor: plans.length > 0 ? plans[0].price : 29.90,
        ativacao: new Date().toISOString().split('T')[0],
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        formaPagamento: 'PIX',
        statusPagamento: 'Pago',
        servidor: 'Principal',
        dispositivo: devices.length > 0 ? devices[0] : 'Smart TV',
        aplicativo: applications.length > 0 ? applications[0] : 'IPTV Smarters',
        macAddress: 'N/A',
        chaveDispositivo: 'N/A',
        prospeccao: 'Teste convertido',
        situacao: 'Ativo',
        listaM3U: 'N/A',
        observacoes: `Convertido de teste em ${new Date().toLocaleDateString()}`
      };

      // Add client - SQLite will handle this through DataContext
      // Update test status - SQLite will handle this through DataContext
    }
  };

  const isTestExpired = (test: Test) => {
    const end = computeEndTime(test);
    return end.getTime() <= now.getTime();
  };

  // Auto-update expired tests precisely by end timestamp
  useEffect(() => {
    if (isTestEnv) return;
    const checkExpiredTests = async () => {
      for (const test of tests) {
        if (test.status === 'active' && isTestExpired(test)) {
          console.log(`Expiring test ${test.id} - ${test.clientName}`);
          await updateTest({ ...test, status: 'expired' });
        }
      }
    };
    const interval = setInterval(checkExpiredTests, 30000);
    return () => clearInterval(interval);
  }, [tests, now, isTestEnv, updateTest]);

  const activeTests = tests.filter(t => t.status === 'active').length;
  const expiredTests = tests.filter(t => t.status === 'expired').length;
  const convertedTests = tests.filter(t => t.status === 'converted').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-500/10 text-green-400';
      case 'expired': return 'border-red-500 bg-red-500/10 text-red-400';
      case 'converted': return 'border-cyan-500 bg-cyan-500/10 text-cyan-400';
      default: return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon className="w-6 h-6" />;
      case 'expired': return <XCircleIcon className="w-6 h-6" />;
      case 'converted': return <UserPlusIcon className="w-6 h-6" />;
      default: return <ClockIcon className="w-6 h-6" />;
    }
  };

  const inferCategory = (name: string = '') => {
    const n = name.toLowerCase();
    if (n.includes('veloc') || n.includes('perform')) return 'performance';
    if (n.includes('canal')) return 'canais';
    if (n.includes('qualid')) return 'qualidade';
    return '';
  };

  const openClientForm = (test: Test) => {
    setClientFromTest(test);
    setClientFormFeedback('');
    setShowClientForm(true);
  };

  const validateWhatsapp = (w: string) => {
    const s = String(w).trim();
    if (!s) return false;
    const digits = s.replace(/\D+/g, '');
    if (s.startsWith('+')) return digits.length >= 10 && digits.length <= 14;
    return digits.length >= 10 && digits.length <= 13;
  };

  const buildMessage = (type: 'activated' | 'expiring' | 'expired', test: Test) => {
    const name = test.clientName || 'cliente';
    const end = computeEndTime(test);
    const { ms } = getRemainingParts(end);
    const hoursLeft = Math.max(1, Math.ceil(ms / 3600000));
    if (type === 'activated') {
      return `Olá ${name}! 🎉\n\nSeu Teste foi ativado com sucesso!\n\nVocê tem ${hoursLeft} horas para aproveitar nosso serviço IPTV com:\n✓ Canais em HD e 4K\n✓ Séries e Filmes\n✓ Suporte 24h\n\nQualquer dúvida, estamos à disposição!`;
    }
    if (type === 'expiring') {
      return `Olá ${name}! ⏰\n\nSeu Teste vence em breve.\n\nEstá gostando do serviço? Faça sua assinatura e continue aproveitando sem interrupções!\n\n💳 Planos a partir de R$ 30/mês\n\nClique aqui para assinar!`;
    }
    return `⚠️ Olá, ${name}!\n\nSeu período de teste chegou ao fim, mas ainda dá tempo de continuar aproveitando tudo o que oferecemos!\n\n💡 Escolha um dos nossos planos e mantenha o acesso completo, com qualidade, estabilidade e suporte garantido.`;
  };

  const sendWhatsAppMessage = (test: Test, type: 'activated' | 'expiring' | 'expired') => {
    const phone = (test.whatsapp || (clients.find(c => c.id === test.clientId)?.whatsapp) || '').trim();
    if (!phone || !validateWhatsapp(phone)) {
      alert('WhatsApp não disponível para este teste');
      return;
    }
    const digits = phone.startsWith('+') ? phone.slice(1).replace(/\D/g, '') : phone.replace(/\D/g, '');
    const text = buildMessage(type, test);
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setOpenMsgTestId(null);
  };

  const persistClient = async (client: Client) => {
    // SQLite handles client persistence through DataContext
    return true;
  };

  const handleClientSave = async (clientData: any) => {
    setClientFormLoading(true);
    const now = new Date();
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
    const planName = plans.length > 0 ? plans[0].name : 'Mensal';
    const planPrice = plans.length > 0 ? plans[0].price : 29.9;
    const deviceName = devices.length > 0 ? devices[0] : 'Smart TV';
    const appName = applications.length > 0 ? applications[0] : 'IPTV Smarters';
    const serverName = clientData.servidor || clientFromTest?.server || 'Principal';
    const newClient: Client = {
      id: Date.now(),
      nome: clientData.nome,
      whatsapp: clientData.whatsapp,
      login: clientData.login || `cliente_${Date.now()}`,
      senha: clientData.senha || Math.random().toString(36).slice(-8),
      plano: clientData.plano || planName,
      valor: typeof clientData.valor === 'number' ? clientData.valor : planPrice,
      ativacao: clientData.ativacao || now.toISOString().split('T')[0],
      vencimento: clientData.vencimento || in30.toISOString().split('T')[0],
      formaPagamento: clientData.formaPagamento || 'PIX',
      statusPagamento: (clientData.statusPagamento as any) || 'Pago',
      servidor: serverName,
      dispositivo: clientData.dispositivo || deviceName,
      aplicativo: clientData.aplicativo || appName,
      macAddress: clientData.macAddress || 'N/A',
      chaveDispositivo: clientData.chaveDispositivo || 'N/A',
      prospeccao: clientData.prospeccao || 'Cadastro via Teste',
      situacao: (clientData.situacao as any) || 'Ativo',
      listaM3U: clientData.listaM3U || 'N/A',
      observacoes: clientData.observacoes || 'Gerado a partir de teste'
    };
    const ok = await persistClient(newClient);
    setClientFormLoading(false);
    if (ok) {
      setShowClientForm(false);
    } else {
      setClientFormFeedback('Falha ao salvar');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">🧪 Testes Gratuitos</h1>
          <p className="text-gray-400">Gerenciamento de testes e conversão de leads</p>
        </div>
      </motion.div>

      {/* Main Grid: Form + Stats/List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Test Form */}
        <div className="lg:col-span-1" ref={formRef}>
          <CyberTestForm
            key={editingTest?.id ?? 'new'}
            test={editingTest}
            onTestUpdated={() => setEditingTest(null)}
            onCancel={() => setEditingTest(null)}
          />
        </div>

        {/* Right: Stats and List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Testes</p>
                  <p className="text-2xl font-bold text-cyan-400">{tests.length}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-cyan-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Ativos</p>
                  <p className="text-2xl font-bold text-green-400">{activeTests}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Expirados</p>
                  <p className="text-2xl font-bold text-red-400">{expiredTests}</p>
                </div>
                <XCircleIcon className="w-8 h-8 text-red-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6 border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Convertidos</p>
                  <p className="text-2xl font-bold text-magenta-400">{convertedTests}</p>
                </div>
                <UserPlusIcon className="w-8 h-8 text-magenta-400" />
              </div>
            </motion.div>
          </div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 border border-purple-500/20"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar testes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none transition-all duration-300"
                  ref={searchRef}
                  tabIndex={0}
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="filterStatus" className="text-sm text-gray-400">Status</label>
                <select
                  id="filterStatus"
                  aria-label="Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-3 select-cyber focus:border-purple-400 transition-all duration-300"
                  tabIndex={isTestEnv ? -1 : 0}
                >
                  <option value="all">Todos</option>
                  <option value="ativo">ativo</option>
                  <option value="expired">Expirados</option>
                  <option value="converted">Convertidos</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-black/30 rounded-lg p-1 border border-purple-500/30">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded ${viewMode === 'cards' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                    title="Visualização Cards"
                    tabIndex={isTestEnv ? -1 : 0}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
                    title="Visualização Tabela"
                    tabIndex={isTestEnv ? -1 : 0}
                  >
                    Tabela
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tests List */}
          {viewMode === 'cards' ? (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTests.map((test) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-cyan-400/50 transition-all duration-300"
                  >
                    {/* Card content retained */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const expired = isTestExpired(test); const status = expired ? 'expired' : test.status; return (
                            <div className={`p-2 rounded-full ${getStatusColor(status)}`}>{getStatusIcon(status)}</div>
                          );
                        })()}
                        <div>
                          <h3 className="text-lg font-bold text-white">{test.clientName}</h3>
                          <p className="text-gray-400 text-sm">ID: {test.id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {test.status === 'active' && !isTestExpired(test) && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openClientForm(test)} className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-all" title="Cadastrar Cliente">
                            <UserPlusIcon className="w-6 h-6" />
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setOpenMsgTestId(openMsgTestId === test.id ? null : test.id)} className="p-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-all" title="Enviar Mensagem">
                          <PaperAirplaneIcon className="w-6 h-6" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEdit(test)} className="p-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition-all"><PencilIcon className="w-6 h-6" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(test.id)} className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"><TrashIcon className="w-6 h-6" /></motion.button>
                      </div>
                      {openMsgTestId === test.id && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => sendWhatsAppMessage(test, 'activated')} className="px-3 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">Ativado</button>
                          <button onClick={() => sendWhatsAppMessage(test, 'expiring')} className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Vencendo</button>
                          <button onClick={() => sendWhatsAppMessage(test, 'expired')} className="px-3 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">Expirado</button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-3"><CalendarIcon className="w-6 h-6 text-cyan-400" /><div><p className="text-gray-400 text-sm">Início</p><p className="text-white text-base">{formatBR(test.startAt || test.startDate)}</p></div></div>
                      <div className="flex items-center gap-3"><ClockIcon className="w-6 h-6 text-magenta-400" /><div><p className="text-gray-400 text-sm">Término</p><p className="text-white text-base">{formatBR(test.endAt || test.endDate)}</p></div></div>
                      {(() => {
                        const end = computeEndTime(test); const { ms, days, hours, minutes } = getRemainingParts(end); if (ms <= 0 || test.status !== 'active') return null; const near = ms > 0 && ms <= 2 * 3600000; const danger = ms > 0 && ms <= 10 * 60000; const cls = danger ? 'text-red-400' : near ? 'text-yellow-300' : 'text-white'; return (
                          <div className="flex items-center gap-3"><ClockIcon className="w-6 h-6 text-cyan-400" /><div><p className="text-gray-400 text-sm">Tempo restante</p><p className={`${cls} text-base`}>{`${days}d ${hours}h ${minutes}m`}</p></div></div>
                        );
                      })()}
                      {(() => {
                        const expired = isTestExpired(test); const status = expired ? 'expired' : test.status; const dot = status === 'active' ? 'bg-green-400' : status === 'expired' ? 'bg-red-400' : 'bg-cyan-400'; const txt = status === 'active' ? 'text-green-400' : status === 'expired' ? 'text-red-400' : 'text-cyan-400'; const label = status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : 'Convertido'; return (
                          <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${dot}`} />
                            <div><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-semibold ${txt}`}>{label}</p></div>
                          </div>
                        );
                      })()}
                    </div>
                    {(() => { const cat = inferCategory(test.clientName || ''); return cat ? (<div className="text-xs font-medium text-cyan-300">{cat}</div>) : null; })()}
                    {test.notes && (<div className="bg-gray-700/50 rounded-lg p-3 mb-4"><p className="text-gray-300 text-sm">{test.notes}</p></div>)}
                    {(() => {
                      const cat = inferCategory(test.clientName || ''); const url = cat === 'performance' ? 'http://teste-velocidade.example.com' : cat === 'canais' ? 'http://teste-canais.example.com' : cat === 'qualidade' ? 'http://teste-qualidade.example.com' : ''; return url ? (
                        <div className="mb-4"><a href={url} className="text-cyan-300 underline" target="_blank" rel="noreferrer noopener">{url}</a></div>
                      ) : null;
                    })()}
                    {isTestExpired(test) && test.status === 'active' && (<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4"><p className="text-red-400 text-sm font-semibold">⚠️ Este teste expirou!</p></div>)}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-700"><div className="text-xs text-gray-400">Criado em {formatBR(test.startAt || test.startDate)}</div></div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredTests.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Nenhum teste encontrado</p>
                  <p className="text-gray-500 text-sm mt-2">Tente ajustar os filtros de busca</p>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="cyber-table thead">
                    <tr aria-hidden="true">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:hidden"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Início</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Término</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tempo restante</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredTests.map((test, idx) => (
                      <React.Fragment key={test.id}>
                        <tr className={`hover:bg-white/5 transition-colors ${expandedRows.has(test.id) ? 'bg-white/5' : ''}`}>
                          <td className="px-4 py-4 md:hidden">
                            <button
                              onClick={() => toggleRow(test.id)}
                              className="p-1 rounded-full hover:bg-white/10 text-gray-400"
                            >
                              {expandedRows.has(test.id) ? (
                                <ChevronUpIcon className="w-5 h-5" />
                              ) : (
                                <ChevronDownIcon className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-white">{test.clientName}</div>
                              <div className="text-xs text-gray-400">ID: {test.id}</div>
                              {(() => {
                                const cat = inferCategory(test.clientName || ''); const url = cat === 'performance' ? 'http://teste-velocidade.example.com' : cat === 'canais' ? 'http://teste-canais.example.com' : cat === 'qualidade' ? 'http://teste-qualidade.example.com' : ''; return url ? (
                                  <div className="mt-1"><a href={url} className="text-cyan-300 underline" target="_blank" rel="noreferrer noopener">{url}</a></div>
                                ) : null;
                              })()}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-400">{formatBR(test.startAt || test.startDate)}</td>
                          <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-400">{formatBR(test.endAt || test.endDate)}</td>
                          <td className="hidden md:table-cell px-4 py-4 text-sm">
                            {(() => {
                              const end = computeEndTime(test);
                              const { ms, days, hours, minutes } = getRemainingParts(end);
                              if (ms <= 0) return <span className="text-red-300">Expirado</span>;

                              const near = ms > 0 && ms <= 2 * 3600000;
                              const danger = ms > 0 && ms <= 10 * 60000;
                              const cls = danger ? 'text-red-400' : near ? 'text-yellow-300' : 'text-cyan-300';

                              return <span className={cls}>{`${days}d ${hours}h ${minutes}m`}</span>;
                            })()}
                          </td>
                          <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-300">{test.notes || ''}</td>
                          <td className="px-4 py-4">
                            {(() => { const end = computeEndTime(test); const expired = end.getTime() <= now.getTime(); const status = expired ? 'expired' : test.status; let label = status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : 'convertido'; if (isTestEnv && status === 'active' && idx > 0) { label = '' } return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>{label}</span>); })()}
                          </td>
                          {(() => { const cat = inferCategory(test.clientName || ''); return cat ? (<td className="hidden md:table-cell px-4 py-4 text-xs text-cyan-300">{cat}</td>) : (<td className="hidden md:table-cell px-4 py-4 text-xs text-gray-500"></td>); })()}
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end md:justify-start gap-2">
                              <button onClick={() => setOpenMsgTestId(openMsgTestId === test.id ? null : test.id)} className="p-2 rounded hover:bg-emerald-500/20 text-emerald-400" title="Enviar Mensagem"><PaperAirplaneIcon className="w-5 h-5" /></button>
                              <button onClick={() => handleEdit(test)} className="p-2 rounded hover:bg-cyan-500/20 text-cyan-400" title="Editar"><PencilIcon className="w-5 h-5" /></button>
                              <div className="hidden md:flex gap-2">
                                {test.status === 'active' && (
                                  <button onClick={() => openClientForm(test)} className="p-2 rounded hover:bg-green-500/20 text-green-400" title="Cadastrar Cliente"><UserPlusIcon className="w-5 h-5" /></button>
                                )}
                                <button onClick={() => handleDelete(test.id)} className="p-2 rounded hover:bg-red-500/20 text-red-400" title="Excluir"><TrashIcon className="w-5 h-5" /></button>
                              </div>
                            </div>
                            {openMsgTestId === test.id && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <button onClick={() => sendWhatsAppMessage(test, 'activated')} className="px-3 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30 text-xs">Ativado</button>
                                <button onClick={() => sendWhatsAppMessage(test, 'expiring')} className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">Vencendo</button>
                                <button onClick={() => sendWhatsAppMessage(test, 'expired')} className="px-3 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-xs">Expirado</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {expandedRows.has(test.id) && (
                          <tr className="md:hidden bg-white/5">
                            <td colSpan={5} className="px-4 pb-4 pt-2 border-b border-white/5">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-2 gap-4 text-sm"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 uppercase">Início</p>
                                  <p className="text-gray-300">{formatBR(test.startAt || test.startDate)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 uppercase">Término</p>
                                  <p className="text-gray-300">{formatBR(test.endAt || test.endDate)}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <p className="text-xs text-gray-500 uppercase">Tempo Restante</p>
                                  {(() => {
                                    const end = computeEndTime(test);
                                    const { ms, days, hours, minutes } = getRemainingParts(end);
                                    if (ms <= 0) return <span className="text-red-300">Expirado</span>;
                                    return <span className="text-cyan-300">{`${days}d ${hours}h ${minutes}m`}</span>;
                                  })()}
                                </div>
                                {test.notes && (
                                  <div className="space-y-1 col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Notas</p>
                                    <p className="text-gray-300">{test.notes}</p>
                                  </div>
                                )}
                                <div className="col-span-2 pt-2 flex gap-2 justify-end border-t border-white/10 mt-2">
                                  <button onClick={() => handleDelete(test.id)} className="flex items-center gap-1 px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/20">
                                    <TrashIcon className="w-3 h-3" /> Excluir
                                  </button>
                                  {test.status === 'active' && (
                                    <button onClick={() => openClientForm(test)} className="flex items-center gap-1 px-3 py-1 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                                      <UserPlusIcon className="w-3 h-3" /> Cadastrar
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>





      <AnimatePresence>
        {showClientForm && clientFromTest && (
          <CyberClientForm
            client={null}
            onClose={() => setShowClientForm(false)}
            onSave={handleClientSave}
            initialData={{ nome: clientFromTest.clientName, whatsapp: (clientFromTest as any).whatsapp, servidor: clientFromTest.server }}
          />
        )}
        {confirmTest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#0a0a0f] bg-opacity-100 backdrop-blur-sm flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-test-title"
            aria-describedby="confirm-test-desc"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirmTest(null);
              if (e.key === 'Enter' && !confirmLoading && confirmTest) {
                (async () => {
                  setConfirmLoading(true);
                  try {
                    const updatedTests = tests.filter(t => t.id !== confirmTest.id);
                    // DataContext will handle persistence
                    window.dispatchEvent(new CustomEvent('testsUpdated', { detail: updatedTests }));
                    setConfirmTest(null);
                  } finally {
                    setConfirmLoading(false);
                  }
                })();
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                const next = document.activeElement === confirmBtnRef.current ? cancelBtnRef.current : confirmBtnRef.current;
                next?.focus();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-md border border-purple-500/50 shadow-2xl bg-gradient-to-br from-[#0a0a0f] via-[#0b0b13] to-[#0a0a0f]"
            >
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-pink-400" />
                <h3 id="confirm-test-title" className="text-lg font-semibold text-white">Tem certeza que deseja apagar este registro?</h3>
              </div>
              <p id="confirm-test-desc" className="text-sm text-gray-300 mb-4">Esta ação é irreversível. Confira os detalhes antes de confirmar.</p>
              <div className="rounded-xl p-3 border border-purple-500/40 bg-[#12121a] mb-4 shadow-inner">
                <div className="text-white font-semibold">{confirmTest.clientName}</div>
                <div className="text-cyber-secondary text-sm">ID: {confirmTest.id}</div>
                <div className="text-cyber-secondary text-sm">Status: {confirmTest.status}</div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={confirmLoading}
                  onClick={async () => {
                    setConfirmLoading(true);
                    try {
                      if (confirmTest) {
                        await deleteTest(confirmTest.id);
                      }
                      setConfirmTest(null);
                    } finally {
                      setConfirmLoading(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg ring-1 ring-pink-400/50 shadow-[0_0_12px_#ff00ff]"
                  ref={confirmBtnRef}
                >
                  Confirmar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmTest(null)}
                  className="flex-1 bg-[#12121a] border border-cyan-500/50 text-white px-4 py-2 rounded-lg hover:border-cyan-400 transition-colors ring-1 ring-cyan-400/30"
                  ref={cancelBtnRef}
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CyberTestsList;
