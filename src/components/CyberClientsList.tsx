import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ClockIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  BoltIcon,
  SparklesIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/format';
import { getExpirationStatus, formatDateStringForDisplay, parseDateString } from '../utils/date';
import { formatPhone } from '../utils/format';
import { Client } from '../types';
import CyberClientForm from './CyberClientForm';
import { useClientsLogic } from '../hooks/useClientsLogic';
import CyberClientDetailsModal from './CyberClientDetailsModal';
import CyberRenewClientModal from './CyberRenewClientModal';
import { useCyberpunkNotification } from './CyberpunkNotification';

export const CyberClientsList: React.FC = () => {
  const {
    filteredClients: uniqueFilteredClients,
    paginatedClients,
    totalPages,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterExpiration,
    setFilterExpiration,
    selectedServers,
    setSelectedServers,
    selectedApps,
    setSelectedApps,
    selectedDevices,
    setSelectedDevices,
    paymentFilter,
    setPaymentFilter,
    viewMode,
    setViewMode,
    serversList,
    appsList,
    devicesList,
    stats,
    expStatusMap,
    addClient,
    updateClient,
    deleteClient,
    renewClient,
    markClientAsPaid,
    clients
  } = useClientsLogic();

  const { addNotification } = useCyberpunkNotification();

  const [previewExpiry, setPreviewExpiry] = useState<Record<number, string>>({});
  const [previewOk, setPreviewOk] = useState<Record<number, boolean>>({});
  const [appQuery, setAppQuery] = useState('');
  const [openServers, setOpenServers] = useState(false);
  const [openApps, setOpenApps] = useState(false);
  const [openDevices, setOpenDevices] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Client | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmRenewTarget, setConfirmRenewTarget] = useState<Client | null>(null);
  const [confirmPaidTarget, setConfirmPaidTarget] = useState<Client | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColor = (client: Client) => {
    const expStatus = expStatusMap[client.id] || getExpirationStatus(client.vencimento);
    if (expStatus.status === 'Vencido') return 'border-red-500 bg-red-500/10';
    if (expStatus.days <= 7) return 'border-yellow-500 bg-yellow-500/10';
    if (client.situacao === 'Ativo') return 'border-green-500 bg-green-500/10';
    return 'border-gray-500 bg-gray-500/10';
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (client: Client) => {
    setConfirmTarget(client);
  };

  const openWhatsAppClient = (client: Client) => {
    const raw = String(client.whatsapp || '').trim();
    const apiNumber = raw.startsWith('+') ? raw.slice(1).replace(/\D/g, '') : raw.replace(/\D/g, '');
    const url = `https://wa.me/${apiNumber}?text=${encodeURIComponent(`Olá ${client.nome}`)}`;
    window.open(url, '_blank');
  };

  const handleRenewClient = (client: Client) => {
    setConfirmRenewTarget(client);
  };

  const handleRenewConfirm = async (newDate: string) => {
    if (!confirmRenewTarget) return;

    try {
      await renewClient(confirmRenewTarget.id, newDate);
      addNotification({
        type: 'success',
        title: 'Renovação Confirmada',
        message: `Assinatura de ${confirmRenewTarget.nome} renovada até ${formatDateStringForDisplay(newDate)}`,
        priority: 'medium',
        autoClose: true,
        duration: 3000,
        read: false
      });
    } catch (error) {
      console.error('Erro ao renovar:', error);
      addNotification({
        type: 'error',
        title: 'Erro na Renovação',
        message: 'Falha ao processar renovação',
        priority: 'high',
        autoClose: true,
        duration: 3000,
        read: false
      });
    }
    setConfirmRenewTarget(null);
  };

  const handleMarkAsPaid = async (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    try {
      await markClientAsPaid(clientId);
      addNotification({
        type: 'success',
        title: 'Pagamento Confirmado',
        message: `Pagamento de ${client.nome} marcado como realizado.`,
        priority: 'medium',
        autoClose: true,
        duration: 3000,
        read: false
      });
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error);
      addNotification({
        type: 'error',
        title: 'Erro no Pagamento',
        message: 'Falha ao processar pagamento',
        priority: 'high',
        autoClose: true,
        duration: 3000,
        read: false
      });
    }
  };

  const handleSaveClient = (clientData: Omit<Client, 'id'>) => {
    if (editingClient) {
      updateClient({ ...editingClient, ...clientData });
    } else {
      addClient(clientData);
    }
    setShowForm(false);
    setEditingClient(null);
  };

  useEffect(() => {
    const onPreview = (ev: any) => {
      const { id, vencimento } = ev.detail || {};
      if (typeof id !== 'number') return;
      const d = parseDateString(String(vencimento));
      if (d) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setPreviewExpiry(prev => ({ ...prev, [id]: iso }));
        setPreviewOk(prev => ({ ...prev, [id]: true }));
      } else {
        setPreviewOk(prev => ({ ...prev, [id]: false }));
      }
    };
    const onClientsUpdated = (ev: any) => {
      try {
        const updated: Client[] = ev.detail || [];
        const ids = new Set(updated.map(c => c.id));
        setPreviewExpiry(prev => {
          const next = { ...prev };
          ids.forEach(id => { delete next[id]; });
          return next;
        });
        setPreviewOk(prev => {
          const next = { ...prev };
          ids.forEach(id => { delete next[id]; });
          return next;
        });
      } catch { }
    };
    window.addEventListener('clientDatePreviewChanged', onPreview as any);
    window.addEventListener('clientsUpdated', onClientsUpdated as any);
    return () => {
      window.removeEventListener('clientDatePreviewChanged', onPreview as any);
      window.removeEventListener('clientsUpdated', onClientsUpdated as any);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div

        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-bold neon-text mb-2">👥 Clientes</h1>
          <p className="text-gray-400">Gerenciamento de assinantes com interface neural</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddClient}
          className="btn-cyber flex items-center gap-3"
        >
          <UserPlusIcon className="w-5 h-5" />
          Novo Cliente
        </motion.button>
      </motion.div>

      {/* Filtros */}
      <motion.div

        className="glass p-6 rounded-2xl overflow-visible relative z-50"
      >
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp ou login..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none transition-all duration-300"
              aria-label="Buscar clientes"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 select-cyber focus:border-purple-400 transition-all duration-300"
              aria-label="Status"
            >
              <option value="all">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>

          <select
            value={filterExpiration}
            onChange={(e) => setFilterExpiration(e.target.value as any)}
            className="px-4 py-3 select-cyber focus:border-purple-400 transition-all duration-300"
            aria-label="Filtro de Expiração"
          >
            <option value="all">Todas as Expirações</option>
            <option value="expiring">Vencendo (7 dias)</option>
            <option value="expired">Vencidas</option>
          </select>

          <div className="flex items-center gap-3">
            <div className="flex bg-black/30 rounded-lg p-1 border border-purple-500/30">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'cards' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-gray-400 hover:text-white'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-gray-400 hover:text-white'}`}
              >
                Tabela
              </button>
            </div>
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 select-cyber focus:border-purple-400 transition-all duration-300"
              aria-label="Status Pagamento"
            >
              <option value="all">Pagamento: Todos</option>
              <option value="Pago">Pagamento: Pago</option>
              <option value="Pendente">Pagamento: Pendente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-semibold">Servidores</div>
            <div className="relative">
              <button onClick={() => setOpenServers(v => !v)} className="w-full pl-10 pr-4 py-3 select-cyber flex items-center justify-between">
                <span className="flex items-center gap-2"><FunnelIcon className="w-5 h-5" />{selectedServers.length > 0 ? `${selectedServers.length} Servidor(es)` : 'Todos Servidores'}</span>
                <span>▾</span>
              </button>
              {openServers && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[60] mt-2 w-full rounded-xl p-3 max-h-64 overflow-auto shadow-xl border border-purple-500/50 bg-gradient-to-br from-[#0a0a0f] via-[#0a0a0f] to-[#0a0a0f]">
                  {serversList.map(s => (
                    <label key={s} className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#12121a] transition">
                      <span className="text-sm text-white flex items-center gap-2">
                        <BoltIcon className="w-5 h-5 text-cyan-400" />
                        {s}
                      </span>
                      <input type="checkbox" className="ml-2 accent-cyan-400" checked={selectedServers.includes(s)} onChange={(e) => {
                        setSelectedServers(prev => e.target.checked ? [...prev, s] : prev.filter(x => x !== s));
                      }} />
                    </label>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-semibold">Aplicativos</div>
            <div className="relative">
              <button onClick={() => setOpenApps(v => !v)} className="w-full pl-10 pr-4 py-3 select-cyber flex items-center justify-between">
                <span className="flex items-center gap-2"><FunnelIcon className="w-5 h-5" />{selectedApps.length > 0 ? `${selectedApps.length} Aplicativo(s)` : 'Todos Aplicativos'}</span>
                <span>▾</span>
              </button>
              {openApps && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[60] mt-2 w-full rounded-xl p-3 max-h-64 overflow-auto shadow-xl border border-purple-500/50 bg-gradient-to-br from-[#0a0a0f] via-[#0a0a0f] to-[#0a0a0f]">
                  <input value={appQuery} onChange={(e) => setAppQuery(e.target.value)} placeholder="Buscar..." className="w-full mb-2 px-2 py-2 bg-[#12121a] border border-purple-500/40 rounded text-sm text-white focus:outline-none focus:border-cyan-400" />
                  {appsList.filter(a => a.toLowerCase().includes(appQuery.toLowerCase())).map(a => (
                    <label key={a} className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#12121a] transition">
                      <span className="text-sm text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-purple-400" />
                        {a}
                      </span>
                      <input type="checkbox" className="ml-2 accent-purple-400" checked={selectedApps.includes(a)} onChange={(e) => {
                        setSelectedApps(prev => e.target.checked ? [...prev, a] : prev.filter(x => x !== a));
                      }} />
                    </label>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-semibold">Dispositivos</div>
            <div className="relative">
              <button onClick={() => setOpenDevices(v => !v)} className="w-full pl-10 pr-4 py-3 select-cyber flex items-center justify-between">
                <span className="flex items-center gap-2"><FunnelIcon className="w-5 h-5" />{selectedDevices.length > 0 ? 'Filtro de Dispositivos' : 'Todos Dispositivos'}</span>
                <span>▾</span>
              </button>
              {openDevices && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[60] mt-2 w-full rounded-xl p-3 max-h-64 overflow-auto shadow-xl border border-purple-500/50 bg-gradient-to-br from-[#0a0a0f] via-[#0a0a0f] to-[#0a0a0f]">
                  {devicesList.map(d => (
                    <label key={d} className="flex items-center justify-between py-2 px-2 rounded hover:bg-[#12121a] transition">
                      <span className="text-sm text-white flex items-center gap-2">
                        <CpuChipIcon className="w-5 h-5 text-blue-400" />
                        {d}
                      </span>
                      <input type="checkbox" className="ml-2 accent-blue-400" checked={selectedDevices.includes(d)} onChange={(e) => {
                        setSelectedDevices(prev => e.target.checked ? [...prev, d] : prev.filter(x => x !== d));
                      }} />
                    </label>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(selectedServers.length > 0 || selectedApps.length > 0 || selectedDevices.length > 0) && (
            <button onClick={() => { setSelectedServers([]); setSelectedApps([]); setSelectedDevices([]); setAppQuery(''); }} className="px-3 py-1 bg-black/30 border border-purple-500/30 rounded text-sm">Limpar Filtros</button>
          )}
          {selectedServers.map(s => (
            <span key={s} className="px-2 py-1 text-xs bg-cyan-900/30 border border-cyan-500/30 rounded text-cyan-300">{s}</span>
          ))}
          {selectedApps.map(a => (
            <span key={a} className="px-2 py-1 text-xs bg-magenta-900/30 border border-magenta-500/30 rounded text-pink-300">{a}</span>
          ))}
          {selectedDevices.map(d => (
            <span key={d} className="px-2 py-1 text-xs bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-300">{d}</span>
          ))}
        </div>
      </motion.div>

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-sm text-gray-400">Ativos</div>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-red-400">{stats.expired}</div>
          <div className="text-sm text-gray-400">Vencidos</div>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.expiring}</div>
          <div className="text-sm text-gray-400">Vencendo</div>
        </div>
        <div className="glass p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-400">{formatCurrency(stats.revenue)}</div>
          <div className="text-sm text-gray-400">Receita do Mês</div>
        </div>
      </motion.div>

      {viewMode === 'table' ? (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="cyber-table thead">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Servidor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dispositivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Aplicativo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vencimento</th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {paginatedClients.map((client) => {
                  const expStatus = getExpirationStatus(client.vencimento);
                  const d = expStatus.days;
                  const isExpired = d < 0;
                  const isNear = d >= 0 && d <= 7;
                  const expirationInfo = {
                    text: d === 0 ? 'Vence hoje' : (d > 0 ? `Restam ${d} dias` : `Vencido há ${Math.abs(d)} dias`),
                    color: isExpired ? 'text-red-300' : isNear ? 'text-yellow-300' : 'text-cyan-300',
                    bgColor: isExpired ? 'bg-red-900/20' : isNear ? 'bg-yellow-900/20' : 'bg-cyan-900/20',
                    borderColor: isExpired ? 'border-red-500/30' : isNear ? 'border-yellow-500/30' : 'border-cyan-500/30'
                  };
                  return (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{client.nome}</div>
                          <div className="text-xs text-gray-400">{formatPhone(client.whatsapp)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-cyber-highlight font-semibold">{client.plano}</td>
                      <td className="px-4 py-4 text-sm text-green-400">{formatCurrency(parseFloat(client.valor.toString()) || 0)}</td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <BoltIcon className="w-4 h-4 text-cyan-400" />
                          <span className="text-cyber-primary">{client.servidor}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CpuChipIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-cyber-primary">{client.dispositivo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <SparklesIcon className="w-4 h-4 text-purple-400" />
                          <span className="text-cyber-primary">{client.aplicativo || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{formatDateStringForDisplay(client.vencimento)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${expirationInfo.borderColor} ${expirationInfo.bgColor} ${expirationInfo.color}`}>
                          {expirationInfo.text}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 ${client.statusPagamento === 'Pago'
                            ? 'border-green-500/30 bg-green-900/20 text-green-300'
                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-300'
                            }`}
                        >
                          {client.statusPagamento === 'Pago' ? 'Pagamento Pago' : 'Pagamento Pendente'}
                        </span>
                        {(() => {
                          const info = expStatusMap[client.id] || getExpirationStatus(client.vencimento); const isExpired = info.status === 'Vencido'; return (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 ${isExpired
                                ? 'border-red-500/30 bg-red-900/20 text-red-300'
                                : (client.situacao === 'Ativo'
                                  ? 'border-green-500/30 bg-green-900/20 text-green-300'
                                  : 'border-red-500/30 bg-red-900/20 text-red-300')
                                }`}
                            >
                              {isExpired ? 'Expirado' : client.situacao}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openWhatsAppClient(client)} className="p-2 rounded hover:bg-green-500/20 text-green-400" title="WhatsApp">
                            <PaperAirplaneIcon className="w-6 h-6" />
                          </button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            console.log('Visualizar clicked', client);
                            setViewingClient(client);
                          }} className="p-2 rounded hover:bg-purple-500/20 text-purple-400" title="Visualizar">
                            <EyeIcon className="w-6 h-6" />
                          </button>
                          <button onClick={() => handleEditClient(client)} className="p-2 rounded hover:bg-cyan-500/20 text-cyan-400" title="Editar" aria-label="Editar cliente">
                            <PencilIcon className="w-6 h-6" />
                          </button>
                          <button onClick={() => handleDeleteClient(client)} className="p-2 rounded hover:bg-red-500/20 text-red-400" title="Excluir" aria-label="Excluir cliente">
                            <TrashIcon className="w-6 h-6" />
                          </button>
                          <button onClick={() => handleRenewClient(client)} className="p-2 rounded hover:bg-blue-500/20 text-blue-400" title="Renovar">
                            <ClockIcon className="w-6 h-6" />
                          </button>
                          {client.statusPagamento === 'Pendente' && (
                            <button onClick={() => handleMarkAsPaid(client.id)} className="p-2 rounded hover:bg-emerald-500/20 text-emerald-400" title="Marcar Pago">
                              <CheckCircleIcon className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-purple-500/30">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30">Anterior</button>
              <span className="text-sm text-gray-400">Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30">Próxima</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {paginatedClients.map((client, index) => {
              const expStatus = getExpirationStatus(client.vencimento);
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className={`glass rounded-2xl p-6 border-l-4 ${getStatusColor(client)} hover:border-purple-400 transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-cyber-primary mb-1">{client.nome}</h3>
                      <p className="text-cyber-secondary text-sm">{formatPhone(client.whatsapp)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => openWhatsAppClient(client)} className="p-3 bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 rounded-lg transition-all">
                        <PaperAirplaneIcon className="w-6 h-6 text-green-400" />
                      </button>
                      <button onClick={() => setViewingClient(client)} className="p-3 bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 rounded-lg transition-all border border-purple-500/30">
                        <EyeIcon className="w-6 h-6 text-purple-400" />
                      </button>
                      <button onClick={() => handleEditClient(client)} className="p-3 bg-black/30 hover:bg-purple-500/20 active:bg-purple-500/30 rounded-lg transition-all border border-purple-500/30">
                        <PencilIcon className="w-6 h-6 text-white" />
                      </button>
                      <button onClick={() => handleDeleteClient(client)} className="p-3 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 rounded-lg transition-all">
                        <TrashIcon className="w-6 h-6 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${client.situacao === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-300">{client.situacao}</span>
                    </div>
                    <div className={`text-sm font-semibold px-2 py-1 rounded ${client.statusPagamento === 'Pago' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {client.statusPagamento === 'Pago' ? '✅ PAGO' : '⚠️ PENDENTE'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className={expStatus.status === 'Vencido' ? 'text-red-400' : 'text-gray-300'}>
                        Vence: {formatDateStringForDisplay(previewExpiry[client.id] || client.vencimento)}
                      </span>
                      {(() => {
                        const d = expStatus.days; const isExpired = d < 0; const near = d >= 0 && d <= 7; const clsText = isExpired ? 'text-red-300' : near ? 'text-yellow-300' : 'text-cyan-300'; const clsBg = isExpired ? 'bg-red-400/10' : near ? 'bg-yellow-400/10' : 'bg-cyan-400/10'; return (
                          <span className={`${clsText} text-xs font-semibold ${clsBg} px-2 py-1 rounded`}>
                            {d === 0 ? 'Vence hoje' : (d > 0 ? `Restam ${d} dias` : `Vencido há ${Math.abs(d)} dias`)}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-cyber-secondary text-xs">Plano</div>
                        <div className="text-cyber-highlight font-semibold">{client.plano}</div>
                      </div>
                      <div>
                        <div className="text-cyber-secondary text-xs">Valor</div>
                        <div className="text-cyber-success font-semibold">R$ {client.valor}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-cyber-secondary text-xs flex items-center gap-1"><BoltIcon className="w-4 h-4 text-cyan-400" /> Servidor</div>
                        <div className="text-cyber-primary">{client.servidor}</div>
                      </div>
                      <div>
                        <div className="text-cyber-secondary text-xs flex items-center gap-1"><CpuChipIcon className="w-4 h-4 text-blue-400" /> Dispositivo</div>
                        <div className="text-cyber-primary">{client.dispositivo}</div>
                      </div>
                      <div>
                        <div className="text-cyber-secondary text-xs flex items-center gap-1"><SparklesIcon className="w-4 h-4 text-purple-400" /> Aplicativo usado</div>
                        <div className="text-cyber-primary">{client.aplicativo || '—'}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex">
                      <motion.button
                        onClick={() => handleRenewClient(client)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow hover:shadow-blue-500/40 transition-all"
                      >
                        <ClockIcon className="w-5 h-5" />
                        Renovar
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30">Anterior</button>
              <span className="text-sm text-gray-400">Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30">Próxima</button>
            </div>
          )}
        </div>
      )}

      {uniqueFilteredClients.length === 0 && null}

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="glass rounded-2xl p-8 w-full mx-4 max-w-[90vw] min-h-[70vh] max-h-[90vh] overflow-y-auto"
          >
            <CyberClientForm
              client={editingClient}
              onSave={handleSaveClient}
              onClose={() => {
                setShowForm(false);
                setEditingClient(null);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {viewingClient && (
        <CyberClientDetailsModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
        />
      )}

      {/* Modal de Renovação */}
      {confirmRenewTarget && (
        <CyberRenewClientModal
          client={confirmRenewTarget}
          onConfirm={handleRenewConfirm}
          onClose={() => setConfirmRenewTarget(null)}
        />
      )}

      {/* Modal de Confirmação */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-[70] bg-[#0a0a0f] bg-opacity-100 backdrop-blur-sm flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-client-title"
          aria-describedby="confirm-client-desc"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setConfirmTarget(null);
            if (e.key === 'Enter' && !confirmLoading && confirmTarget) {
              (async () => {
                setConfirmLoading(true);
                try {
                  const can = true;
                  if (!can) return;
                  deleteClient(confirmTarget.id);
                  setConfirmTarget(null);
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 w-full max-w-md border border-purple-500/50 shadow-2xl bg-gradient-to-br from-[#0a0a0f] via-[#0b0b13] to-[#0a0a0f]"
          >
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-pink-400" />
              <h3 id="confirm-client-title" className="text-lg font-semibold text-white">Tem certeza que deseja arquivar este cliente?</h3>
            </div>
            <p id="confirm-client-desc" className="text-sm text-gray-300 mb-4">O cliente será marcado como arquivado e os dados financeiros serão preservados.</p>
            <div className="rounded-xl p-3 border border-purple-500/40 bg-[#12121a] mb-4 shadow-inner">
              <div className="text-white font-semibold">{confirmTarget.nome}</div>
              <div className="text-cyber-secondary text-sm">WhatsApp: {formatPhone(confirmTarget.whatsapp)}</div>
              <div className="text-cyber-secondary text-sm">Login: {confirmTarget.login}</div>
              <div className="text-cyber-secondary text-sm">Plano: {confirmTarget.plano}</div>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={confirmLoading}
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    const can = true; // validação de permissão simplificada
                    if (!can) return;
                    deleteClient(confirmTarget.id);
                    setConfirmTarget(null);
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
                onClick={() => setConfirmTarget(null)}
                className="flex-1 bg-[#12121a] border border-cyan-500/50 text-white px-4 py-2 rounded-lg hover:border-cyan-400 transition-colors ring-1 ring-cyan-400/30"
                ref={cancelBtnRef}
              >
                Cancelar
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
