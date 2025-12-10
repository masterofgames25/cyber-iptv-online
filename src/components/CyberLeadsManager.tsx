import React, { useState, useEffect, useRef, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  TableCellsIcon,
  PhoneIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { Lead, LeadStatus } from '../types';
import { formatPhone, sanitizeText } from '../utils/format';
import { parseDateString, isThisMonth, formatDateStringForDisplay } from '../utils/date';
import CyberLeadForm from './CyberLeadForm';

const LEAD_STATUS_CONFIG = {
  Novo: { title: 'Novo', color: '#00FFFF', bgColor: 'rgba(0, 255, 255, 0.1)' },
  Contatado: { title: 'Contatado', color: '#FF00FF', bgColor: 'rgba(255, 0, 255, 0.1)' },
  'Não testou': { title: 'Não testou', color: '#00FF00', bgColor: 'rgba(0, 255, 0, 0.1)' },
  // Compatibilidade retroativa para leads antigos com status "Qualificado"
  Qualificado: { title: 'Não testou', color: '#00FF00', bgColor: 'rgba(0, 255, 0, 0.1)' },
  Convertido: { title: 'Convertido', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.1)' },
  Perdido: { title: 'Perdido', color: '#FF4444', bgColor: 'rgba(255, 68, 68, 0.1)' },
  'Ex-Clientes': { title: 'Ex-Clientes', color: '#FF8C00', bgColor: 'rgba(255, 140, 0, 0.1)' }
};

type CyberLeadsManagerProps = Record<string, never>;

const CyberLeadsManager: React.FC<CyberLeadsManagerProps> = () => {
  const { leads, addLead, updateLead, deleteLead } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'new' | 'ex-client'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [kanbanPage, setKanbanPage] = useState(1);
  const [confirmLead, setConfirmLead] = useState<Lead | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const confirmLeadBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelLeadBtnRef = useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    setTablePage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  React.useEffect(() => {
    if (viewMode === 'table') setTablePage(1);
  }, [viewMode]);

  const uniqueLeads = React.useMemo(() => {
    const seen = new Set();
    return leads.filter(lead => {
      if (seen.has(lead.id)) return false;
      seen.add(lead.id);
      return true;
    });
  }, [leads]);

  const filteredLeads = uniqueLeads.filter(lead => {
    const normalized = deferredSearchTerm.replace(/\D/g, '');
    const matchesSearch = lead.nome.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
      lead.whatsapp.includes(normalized);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'ex-client' && lead.category === 'ex-client') ||
      (categoryFilter === 'new' && lead.category !== 'ex-client');

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: leads.length,
    converted: leads.filter(l => l.status === 'Convertido').length,
    newThisMonth: leads.filter(l => isThisMonth(parseDateString(l.createdAt))).length,
    exClients: leads.filter(l => l.category === 'ex-client').length
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setShowForm(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleDeleteLead = (leadId: number) => {
    const target = leads.find(l => l.id === leadId) || null;
    setConfirmLead(target);
  };



  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== newStatus) {
      updateLead({
        ...draggedLead,
        status: newStatus
      });
    }
    setDraggedLead(null);
  };

  const openWhatsApp = (whatsapp: string) => {
    const raw = String(whatsapp || '').trim();
    const apiNumber = raw.startsWith('+') ? raw.slice(1).replace(/\D/g, '') : raw.replace(/\D/g, '');
    const message = `Olá! Vim do sistema CRM e gostaria de conversar sobre nossos planos de IPTV.`;
    window.open(`https://wa.me/${apiNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const renderExClientInfo = (lead: Lead) => {
    if (!lead.fromMigration) return null;

    return (
      <div className="mt-3 p-3 rounded-lg glass border-l-4 border-orange-500">
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>Ex-cliente migrado</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Plano anterior:</span>
            <span className="text-cyan-400">{lead.originalPlano}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Valor:</span>
            <span className="text-green-400">R$ {lead.originalValor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Vencimento:</span>
            <span className="text-yellow-400">{formatDateStringForDisplay(lead.originalExpiration || '')}</span>
          </div>
          {lead.migrationReason && (
            <div className="mt-2 p-2 bg-orange-900/20 rounded border border-orange-500/30">
              <span className="text-orange-400 text-xs">Motivo: {lead.migrationReason}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTestHistory = (lead: Lead) => {
    if (!lead.testHistory || lead.testHistory.length === 0) return null;
    const last = lead.testHistory[lead.testHistory.length - 1];
    return (
      <div className="mt-3 p-3 rounded-lg glass border-l-4 border-cyan-500">
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <ChartBarIcon className="w-4 h-4" />
          <span>Histórico de Testes</span>
          <span className="ml-auto text-cyan-300">{lead.contador_testes || lead.testHistory.length} teste(s)</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Servidor:</span>
            <span className="text-cyan-400">{last.server || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duração:</span>
            <span className="text-cyan-400">{typeof last.durationHours === 'number' ? `${last.durationHours}h` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Último:</span>
            <span className="text-cyan-400">{formatDateStringForDisplay(String(last.migratedAt))}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderKanbanView = () => {
    const statusOrder: LeadStatus[] = ['Novo', 'Contatado', 'Não testou', 'Convertido', 'Perdido', 'Ex-Clientes'];
    const itemsPerPage = 10;
    const lengths = statusOrder.map(st => filteredLeads.filter(l => l.status === st).length);
    const totalPages = Math.max(1, ...lengths.map(len => Math.ceil(len / itemsPerPage)));
    const startIndex = (kanbanPage - 1) * itemsPerPage;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statusOrder.map(status => {
            const statusLeads = filteredLeads.filter(lead => lead.status === status).slice(startIndex, startIndex + itemsPerPage);
            const config = LEAD_STATUS_CONFIG[status];

            return (
              <motion.div
                key={status}
                className="glass rounded-xl p-4 min-h-96"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: statusOrder.indexOf(status) * 0.1 }}
              >
                <div
                  className="flex items-center gap-2 mb-4 pb-2 border-b"
                  style={{ borderColor: config.color + '40' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <h3 className="font-bold text-sm" style={{ color: config.color }}>
                    {config.title}
                  </h3>
                  <span className="ml-auto bg-black/30 px-2 py-1 rounded-full text-xs border border-purple-500/30">
                    {statusLeads.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {statusLeads.map(lead => (
                      <motion.div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className="glass p-3 rounded-lg border cursor-move hover:border-cyan-400 transition-all duration-300 group"
                        style={{ borderColor: config.color + '40' }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm text-cyber-primary">{lead.nome}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openWhatsApp(lead.whatsapp)}
                              className="p-2 rounded hover:bg-green-500/20 text-green-400"
                              title="WhatsApp"
                            >
                              <PhoneIcon className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditLead(lead)}
                              className="p-2 rounded hover:bg-cyan-500/20 text-cyan-400"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 rounded hover:bg-red-500/20 text-red-400"
                              title="Excluir"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-cyber-secondary mb-2">
                          {formatPhone(lead.whatsapp)}
                        </p>

                        {lead.observacoes && (
                          <p className="text-xs text-cyber-secondary mb-2 line-clamp-2">
                            {lead.observacoes}
                          </p>
                        )}

                        <div className="flex justify-between items-center text-xs text-cyber-secondary">
                          <span>{lead.source}</span>
                          <span>{formatDateStringForDisplay(String(lead.createdAt))}</span>
                        </div>

                        {renderExClientInfo(lead)}
                        {renderTestHistory(lead)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button onClick={() => setKanbanPage(Math.max(1, kanbanPage - 1))} disabled={kanbanPage === 1} className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30">Anterior</button>
            <span className="text-sm text-gray-400">Página {kanbanPage} de {totalPages}</span>
            <button onClick={() => setKanbanPage(Math.min(totalPages, kanbanPage + 1))} disabled={kanbanPage === totalPages} className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30">Próxima</button>
          </div>
        )}
      </>
    );
  };

  const renderTableView = () => {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
    const startIndex = (tablePage - 1) * itemsPerPage;
    const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="space-y-4">
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="cyber-table thead">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Origem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Criação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedLeads.map(lead => {
                const config = LEAD_STATUS_CONFIG[lead.status];
                return (
                  <motion.tr
                    key={lead.id}
                    className="hover:bg-black/30 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-cyber-primary">{lead.nome}</div>
                        {lead.category === 'ex-client' && (
                          <div className="text-xs text-orange-400">Ex-cliente</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-cyber-secondary">
                      {formatPhone(lead.whatsapp)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: config.bgColor,
                          color: config.color,
                          border: `1px solid ${config.color}40`
                        }}
                      >
                        {config.title}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-cyber-secondary">{lead.source}</td>
                    <td className="px-4 py-4 text-sm text-cyber-secondary">
                      {formatDateStringForDisplay(String(lead.createdAt))}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openWhatsApp(lead.whatsapp)}
                          className="p-2 rounded hover:bg-green-500/20 text-green-400"
                          title="WhatsApp"
                        >
                          <PhoneIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEditLead(lead)}
                          className="p-2 rounded hover:bg-cyan-500/20 text-cyan-400"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 rounded hover:bg-red-500/20 text-red-400"
                          title="Excluir"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setTablePage(Math.max(1, tablePage - 1))}
              disabled={tablePage === 1}
              className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-400">
              Página {tablePage} de {totalPages}
            </span>
            <button
              onClick={() => setTablePage(Math.min(totalPages, tablePage + 1))}
              disabled={tablePage === totalPages}
              className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="glass p-4 rounded-xl border border-cyan-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total de Leads</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.total}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-yellow-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Convertidos</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.converted}</p>
            </div>
            <UserPlusIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-green-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Novos no Mês</p>
              <p className="text-2xl font-bold text-green-400">{stats.newThisMonth}</p>
            </div>
            <ArrowPathIcon className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-orange-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ex-Clientes</p>
              <p className="text-2xl font-bold text-orange-400">{stats.exClients}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-400" />
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
            <div style={{ position: 'relative', width: '400px', minWidth: '300px' }}>
              <MagnifyingGlassIcon
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  color: '#00ffff'
                }}
              />
              <input
                type="text"
                placeholder="Buscar por nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '12px 16px 12px 52px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: '#ffffff',
                  backgroundColor: '#0a1520',
                  border: '2px solid #00ffff',
                  borderRadius: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <select
              value={statusFilter}
              className="px-3 py-2 select-cyber"
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            >
              <option value="all">Todos Status</option>
              {Object.entries(LEAD_STATUS_CONFIG)
                .filter(([status]) => status !== 'Qualificado') // Exclui duplicado do dropdown
                .map(([status, config]) => (
                  <option key={status} value={status} style={{ color: config.color }}>
                    {config.title}
                  </option>
                ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'new' | 'ex-client')}
              className="px-3 py-2 select-cyber"
            >
              <option value="all">Todas Categorias</option>
              <option value="new">Novos Leads</option>
              <option value="ex-client">Ex-Clientes</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-black/30 rounded-lg p-1 border border-purple-500/30">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-gray-400 hover:text-white'}`}
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

            <motion.button
              onClick={handleAddLead}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-cyan-400 hover:to-blue-400 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusIcon className="w-5 h-5" />
              Novo Lead
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {viewMode === 'kanban' ? renderKanbanView() : renderTableView()}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <CyberLeadForm
            lead={editingLead}
            onClose={() => setShowForm(false)}
            onSave={(leadData) => {
              if (editingLead) {
                updateLead({ ...editingLead, ...leadData });
              } else {
                addLead(leadData);
              }
              setShowForm(false);
            }}
          />
        )}
        {confirmLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#0a0a0f] bg-opacity-100 backdrop-blur-sm flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-lead-title"
            aria-describedby="confirm-lead-desc"
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirmLead(null);
              if (e.key === 'Enter' && !confirmLoading && confirmLead) {
                (async () => {
                  setConfirmLoading(true);
                  try {
                    const can = true;
                    if (!can) return;
                    deleteLead(confirmLead.id);
                    setConfirmLead(null);
                  } finally {
                    setConfirmLoading(false);
                  }
                })();
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                const next = document.activeElement === confirmLeadBtnRef.current ? cancelLeadBtnRef.current : confirmLeadBtnRef.current;
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
                <h3 id="confirm-lead-title" className="text-lg font-semibold text-white">Tem certeza que deseja excluir este lead?</h3>
              </div>
              <p id="confirm-lead-desc" className="text-sm text-gray-300 mb-4">Esta ação é irreversível. Confira os detalhes antes de confirmar.</p>
              <div className="rounded-xl p-3 border border-purple-500/40 bg-[#12121a] mb-4 shadow-inner">
                <div className="text-white font-semibold">{confirmLead.nome}</div>
                <div className="text-cyber-secondary text-sm">WhatsApp: {formatPhone(confirmLead.whatsapp)}</div>
                <div className="text-cyber-secondary text-sm">Status: {confirmLead.status}</div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={confirmLoading}
                  onClick={async () => {
                    setConfirmLoading(true);
                    try {
                      const can = true;
                      if (!can) return;
                      deleteLead(confirmLead.id);
                      setConfirmLead(null);
                    } finally {
                      setConfirmLoading(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg ring-1 ring-pink-400/50 shadow-[0_0_12px_#ff00ff]"
                  ref={confirmLeadBtnRef}
                >
                  Confirmar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmLead(null)}
                  className="flex-1 bg-[#12121a] border border-cyan-500/50 text-white px-4 py-2 rounded-lg hover:border-cyan-400 transition-colors ring-1 ring-cyan-400/30"
                  ref={cancelLeadBtnRef}
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

export default CyberLeadsManager;
