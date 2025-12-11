import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  PhoneIcon,
  BanknotesIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { Client } from '../types';
import { formatDateStringForDisplay } from '../utils/date';
import { formatPhone, formatCurrency } from '../utils/format';
import { useSystemData } from '../utils/systemData';
import { BillingService } from '../utils/BillingService';

type CyberBillingManagerProps = Record<string, never>;

const CyberBillingManager: React.FC<CyberBillingManagerProps> = () => {
  const { clients, markClientAsPaid } = useData();
  const [confirmPaid, setConfirmPaid] = useState<Client | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { getPlans, getPaymentMethods } = useSystemData();
  const availablePlans = getPlans();
  const paymentMethods = getPaymentMethods();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'expiring' | 'expired' | 'due_pending'>('due_pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClients = useMemo(() => {
    return BillingService.filterClients(clients, searchTerm, statusFilter);
  }, [clients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return BillingService.calculateStats(filteredClients);
  }, [filteredClients]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const handleMarkAsPaid = async (client: Client) => {
    setConfirmPaid(client);
  };

  const openWhatsApp = (client: Client, type: 'standard' | 'promo' = 'standard') => {
    const raw = String(client.whatsapp || '').trim();
    const cleanPhone = raw.startsWith('+') ? raw.slice(1).replace(/\D/g, '') : raw.replace(/\D/g, '');
    const plan = availablePlans.find(p => p.name === client.plano);
    const planSpecs = plan
      ? `${plan.name}`
      : client.plano;
    const dueDate = formatDateStringForDisplay(client.vencimento);
    const amount = formatCurrency(parseFloat(client.valor.toString()) || 0);
    const methods = paymentMethods.length > 0 ? paymentMethods.join(' / ') : client.formaPagamento;

    let message = '';

    if (type === 'standard') {
      message = `Olá ${client.nome}, tudo bem? 😊 Estamos entrando em contato para lembrá-lo(a) que seu plano ${planSpecs} vence no dia ${dueDate}. Caso precise de auxílio para renovação ou tenha alguma dúvida, estamos à disposição!`;
    } else {
      message = `Olá ${client.nome}, tudo bem? 😊 Notamos que seu plano ${planSpecs} vence em ${dueDate}. Temos uma oferta especial para você: 3 meses por apenas R$ 75,00! 🎁 Entre em contato para garantir essa promoção exclusiva.`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="glass p-4 rounded-xl border border-red-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Pendente</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.totalPending)}</p>
            </div>
            <BanknotesIcon className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-orange-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Vencidos</p>
              <p className="text-2xl font-bold text-orange-400">{stats.expiredCount}</p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-400" />
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-yellow-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Vencendo (7 dias)</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.expiringCount}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          className="glass p-4 rounded-xl border border-cyan-500/30"
          whileHover={{ scale: 1.05, y: -5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Clientes</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.totalCount}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input-cyber"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 select-cyber"
            >
              <option value="all">Todos Status</option>
              <option value="expired">Vencidos</option>
              <option value="expiring">Vencendo (7 dias)</option>
              <option value="pending">Pendentes</option>
              <option value="due_pending">Vencendo (≤7d) ou Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="cyber-table thead">
              <tr>
                <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plano</th>
                <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Vencimento</th>
                <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-2 py-2 md:px-4 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedClients.map(client => {
                const expirationInfo = BillingService.getExpirationStatus(client);

                return (
                  <motion.tr
                    key={client.id}
                    className="hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <td className="px-2 py-2 md:px-4 md:py-4">
                      <div>
                        <div className="text-[10px] md:text-sm font-medium text-white">{client.nome}</div>
                        <div className="text-[10px] md:text-xs text-gray-400">{formatPhone(client.whatsapp)}</div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-400">{client.plano}</td>
                    <td className="px-2 py-2 md:px-4 md:py-4 text-[10px] md:text-sm text-green-400">{formatCurrency(parseFloat(client.valor.toString()) || 0)}</td>
                    <td className="px-2 py-2 md:px-4 md:py-4 text-[10px] md:text-sm text-gray-400">{formatDateStringForDisplay(client.vencimento)}</td>
                    <td className="px-2 py-2 md:px-4 md:py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${expirationInfo.borderColor} ${expirationInfo.bgColor} ${expirationInfo.color}`}>
                        {expirationInfo.text}
                      </span>
                      {client.statusPagamento === 'Pendente' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-cyan-500/30 bg-cyan-900/20 text-cyan-300 ml-2">
                          Pagamento Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openWhatsApp(client, 'standard')}
                          className="p-2 rounded hover:bg-green-500/20 text-green-400"
                          title="WhatsApp (Cobrança)"
                        >
                          <PhoneIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openWhatsApp(client, 'promo')}
                          className="p-2 rounded hover:bg-purple-500/20 text-purple-400"
                          title="WhatsApp (Promoção 3 Meses)"
                        >
                          <GiftIcon className="w-4 h-4" />
                        </button>
                        {client.statusPagamento === 'Pendente' && (
                          <button
                            onClick={() => handleMarkAsPaid(client)}
                            className="p-2 rounded hover:bg-cyan-500/20 text-cyan-400"
                            title="Marcar como Pago"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-purple-500/30">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-black/30 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-purple-500/30"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {filteredClients.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma cobrança pendente</h3>
          <p className="text-gray-400">Todos os clientes estão com pagamento em dia!</p>
        </div>
      )}

      {confirmPaid && (
        <div className="fixed inset-0 z-[70] bg-[#0a0a0f] bg-opacity-100 backdrop-blur-sm flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-6 w-full max-w-md border border-purple-500/50 shadow-2xl bg-gradient-to-br from-[#0a0a0f] via-[#0b0b13] to-[#0a0a0f]">
            <div className="flex items-center gap-2 mb-2"><ExclamationTriangleIcon className="w-5 h-5 text-pink-400" /><h3 className="text-lg font-semibold text-white">Confirmar pagamento?</h3></div>
            <p className="text-sm text-gray-300 mb-4">Esta operação registrará pagamento e afetará os totais financeiros.</p>
            <div className="rounded-xl p-3 border border-purple-500/40 bg-[#12121a] mb-4 shadow-inner">
              <div className="text-white font-semibold">{confirmPaid.nome}</div>
              <div className="text-cyber-secondary text-sm">Plano: {confirmPaid.plano}</div>
              <div className="text-cyber-secondary text-sm">Valor: {formatCurrency(parseFloat(confirmPaid.valor.toString()) || 0)}</div>
              <div className="text-cyber-secondary text-sm">Vencimento: {formatDateStringForDisplay(confirmPaid.vencimento)}</div>
            </div>
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={confirmLoading} onClick={async () => { setConfirmLoading(true); try { const can = true; if (!can) return; await markClientAsPaid(confirmPaid.id); setConfirmPaid(null); } finally { setConfirmLoading(false); } }} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg ring-1 ring-emerald-400/50 shadow-[0_0_12px_#00FFAA]">Confirmar</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setConfirmPaid(null)} className="flex-1 bg-[#12121a] border border-purple-500/40 text-white px-4 py-2 rounded-lg">Cancelar</motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CyberBillingManager;
