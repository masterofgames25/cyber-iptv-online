import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  FunnelIcon,
  CalendarIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { useSystemData } from '../utils/systemData';
import { getDaysUntilExpiration, parseDateString, formatDateStringForDisplay } from '../utils/date';
import { formatCurrency } from '../utils/format';

type CyberFinancialsProps = Record<string, never>;

interface RevenueTransaction {
  id: number;
  clientId: number;
  clientName: string;
  amount: number;
  type: 'subscription' | 'renewal' | 'other';
  date: string;
  description: string;
  status?: 'committed' | 'reverted' | 'pending';
}

const CyberFinancials: React.FC<CyberFinancialsProps> = () => {
  const { revenueLog, clients, clearRevenueData } = useData();
  const { getServerCostMap, getPlans } = useSystemData();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all');
  const [selectedRevenueType, setSelectedRevenueType] = useState<'all' | 'subscription' | 'renewal' | 'other'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmClearRevenue, setConfirmClearRevenue] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Ensure data is loaded before rendering
  useEffect(() => {
    if (revenueLog && clients && Array.isArray(revenueLog) && Array.isArray(clients)) {
      setIsLoading(false);
    }
  }, [revenueLog, clients]);

  // Calculate server costs (expenses)
  const serverCosts = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    const costMap = getServerCostMap();
    const activeClients = clients.filter(c => c.situacao === 'Ativo');
    const serverCounts = activeClients.reduce((acc, client) => {
      acc[client.servidor] = (acc[client.servidor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(serverCounts).map(([server, count]) => ({
      server,
      clients: count,
      monthlyCost: count * (costMap[server] ?? 0)
    }));
  }, [clients]);

  const totalExpensesBase = serverCosts.reduce((sum, server) => sum + server.monthlyCost, 0);

  // Filter revenue by period and type
  const filteredRevenue = useMemo(() => {
    if (!revenueLog || !Array.isArray(revenueLog)) return [];
    let filtered = revenueLog;

    if (selectedRevenueType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedRevenueType);
    }

    if (selectedPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (selectedPeriod === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (selectedPeriod === 'week') {
        filterDate.setDate(now.getDate() - 7);
      }

      filtered = filtered.filter(item => {
        try {
          const parsed = parseDateString(String(item.date));
          const d = parsed || new Date(item.date);
          return d >= filterDate;
        } catch {
          return false;
        }
      });
    }

    // Show renewals only if the client expires in 7 days or less (>= 0 and <= 7)
    filtered = filtered.filter(item => {
      if (item.type !== 'renewal') return true;
      const client = clients.find(c => c.id === item.clientId);
      if (!client) return false;
      const days = getDaysUntilExpiration(client.vencimento);
      return days >= 0 && days <= 7;
    });

    return filtered;
  }, [revenueLog, selectedPeriod, selectedRevenueType]);

  // Calculate financial metrics
  const metrics = useMemo(() => {
    if (!revenueLog || !Array.isArray(revenueLog)) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        monthlyRevenue: 0,
        avgTicket: 0,
        totalTransactions: 0
      };
    }
    const committedRevenue = (revenueLog || []).filter((item: any) => item?.status !== 'reverted');
    const totalRevenue = committedRevenue.reduce((sum, item) => sum + (item?.amount || 0), 0);
    const totalExpenses = committedRevenue.reduce((sum: number, item: any) => sum + Number(item?.costSnapshot || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const monthlyRevenue = committedRevenue
      .filter(item => {
        try {
          const parsed = parseDateString(String(item?.date || ''));
          const itemDate = parsed || new Date(item?.date || '');
          const now = new Date();
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } catch {
          return false;
        }
      })
      .reduce((sum, item) => sum + (item?.amount || 0), 0);

    const avgTicket = (clients?.length || 0) > 0 ? totalRevenue / clients.length : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      monthlyRevenue,
      avgTicket,
      totalTransactions: committedRevenue.length
    };
  }, [revenueLog, clients]);

  // Revenue by type
  const revenueByType = useMemo(() => {
    if (!revenueLog || !Array.isArray(revenueLog)) {
      return [
        { type: 'subscription', label: 'Novas Assinaturas', amount: 0, color: '#00FFFF' },
        { type: 'renewal', label: 'Renovações', amount: 0, color: '#FF00FF' },
        { type: 'other', label: 'Outros', amount: 0, color: '#00FF00' }
      ];
    }

    let source = (revenueLog || []).filter((item: any) => item?.status !== 'reverted');
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      if (selectedPeriod === 'month') filterDate.setMonth(now.getMonth() - 1);
      if (selectedPeriod === 'week') filterDate.setDate(now.getDate() - 7);
      source = source.filter(item => {
        try {
          const parsed = parseDateString(String(item.date));
          const d = parsed || new Date(item.date);
          return d >= filterDate;
        } catch {
          return false;
        }
      });
    }

    const byType = source.reduce((acc: Record<string, number>, item: any) => {
      if (item?.type && typeof item?.amount === 'number') {
        acc[item.type] = (acc[item.type] || 0) + item.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return [
      { type: 'subscription', label: 'Novas Assinaturas', amount: byType.subscription || 0, color: '#00FFFF' },
      { type: 'renewal', label: 'Renovações', amount: byType.renewal || 0, color: '#FF00FF' },
      { type: 'other', label: 'Outros', amount: byType.other || 0, color: '#00FF00' }
    ];
  }, [revenueLog, selectedPeriod]);

  // Monthly revenue trend
  const monthlyTrend = useMemo(() => {
    if (!revenueLog || !Array.isArray(revenueLog)) return [];

    const monthlyData: Record<string, number> = {};

    revenueLog.forEach(item => {
      try {
        const parsed = parseDateString(String(item?.date || ''));
        const date = parsed || new Date(item?.date || '');
        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()} -${String(date.getMonth() + 1).padStart(2, '0')} `;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (item?.amount || 0);
      } catch {
        // Skip invalid items
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        amount
      }));
  }, [revenueLog]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados financeiros...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              className="glass p-4 rounded-xl border border-green-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Receita Total</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              className="glass p-4 rounded-xl border border-red-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(metrics.totalExpenses)}</p>
                </div>
                <ArrowTrendingDownIcon className="w-8 h-8 text-red-400" />
              </div>
            </motion.div>

            <motion.div
              className="glass p-4 rounded-xl border border-cyan-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Lucro Líquido</p>
                  <p className="text-2xl font-bold text-cyan-400">{formatCurrency(metrics.netProfit)}</p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-cyan-400" />
              </div>
            </motion.div>

            <motion.div
              className="glass p-4 rounded-xl border border-yellow-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Ticket Médio</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(metrics.avgTicket)}</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
            <motion.div
              className="glass p-4 rounded-xl border border-purple-500/30"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Receita do Mês</p>
                  <p className="text-2xl font-bold text-purple-400">{formatCurrency(metrics.monthlyRevenue)}</p>
                </div>
                <BanknotesIcon className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="glass rounded-xl p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="px-3 py-2 select-cyber"
                  >
                    <option value="all">Todo Período</option>
                    <option value="month">Último Mês</option>
                    <option value="week">Última Semana</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedRevenueType}
                    onChange={(e) => setSelectedRevenueType(e.target.value as any)}
                    className="px-3 py-2 select-cyber"
                  >
                    <option value="all">Todas Receitas</option>
                    <option value="subscription">Novas Assinaturas</option>
                    <option value="renewal">Renovações</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  {metrics.totalTransactions} transações
                </div>
                <button
                  onClick={() => setConfirmClearRevenue(true)}
                  className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all border border-red-500/30 hover:border-red-400/50"
                  title="Limpar dados de receita"
                >
                  <TrashIcon className="w-4 h-4" />
                  Limpar Receita
                </button>
              </div>
            </div>
            {confirmClearRevenue && (
              <div
                className="fixed inset-0 z-[70] bg-[#0a0a0f] bg-opacity-100 backdrop-blur-sm flex items-center justify-center"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-clear-title"
                aria-describedby="confirm-clear-desc"
                tabIndex={-1}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setConfirmClearRevenue(false);
                  if (e.key === 'Enter' && !confirmLoading) {
                    (async () => {
                      setConfirmLoading(true);
                      try {
                        await clearRevenueData();
                        setConfirmClearRevenue(false);
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
                    <h3 id="confirm-clear-title" className="text-lg font-semibold text-white">Tem certeza que deseja limpar todos os dados de receita?</h3>
                  </div>
                  <p id="confirm-clear-desc" className="text-sm text-gray-300 mb-4">Esta ação é irreversível. Confira os detalhes antes de confirmar.</p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={confirmLoading}
                      onClick={async () => {
                        setConfirmLoading(true);
                        try {
                          await clearRevenueData();
                          setConfirmClearRevenue(false);
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
                      onClick={() => setConfirmClearRevenue(false)}
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

          {/* Revenue by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Receita por Tipo</h3>
              <div className="space-y-4">
                {revenueByType.map(item => {
                  const percentage = metrics.totalRevenue > 0 ? (item.amount / metrics.totalRevenue) * 100 : 0;

                  return (
                    <div key={item.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{item.label}</span>
                        <span className="text-sm font-medium" style={{ color: item.color }}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-2 border border-purple-500/30">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}% `,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tendência Mensal</h3>
              <div className="space-y-4">
                {monthlyTrend.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{item.month}</span>
                    <span className="text-sm font-medium text-green-400">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Server Costs */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Custos por Servidor</h3>
            <div className="space-y-4">
              {serverCosts.map(server => (
                <div key={server.server} className="flex justify-between items-center p-3 cyber-card">
                  <div>
                    <div className="text-sm font-medium text-white">{server.server}</div>
                    <div className="text-xs text-gray-400">{server.clients} clientes</div>
                  </div>
                  <div className="text-sm text-red-400">{formatCurrency(server.monthlyCost)}</div>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="text-sm font-medium text-white">Total de Despesas</div>
                <div className="text-sm font-bold text-red-400">{formatCurrency(metrics.totalExpenses)}</div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Transações Recentes</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[...(() => {
                let source = (revenueLog || []).filter((t: any) => t?.status !== 'reverted');
                if (selectedRevenueType !== 'all') {
                  source = source.filter((t: any) => t.type === selectedRevenueType);
                }
                if (selectedPeriod !== 'all') {
                  const now = new Date();
                  const filterDate = new Date();
                  if (selectedPeriod === 'month') filterDate.setMonth(now.getMonth() - 1);
                  if (selectedPeriod === 'week') filterDate.setDate(now.getDate() - 7);
                  source = source.filter((t: any) => {
                    try {
                      const parsed = parseDateString(String(t.date));
                      const d = parsed || new Date(t.date);
                      return d >= filterDate;
                    } catch {
                      return false;
                    }
                  });
                }
                return source;
              })()].sort((a, b) => {
                try {
                  const pb = parseDateString(String(b.date));
                  const pa = parseDateString(String(a.date));
                  const db = (pb || new Date(b.date)).getTime();
                  const da = (pa || new Date(a.date)).getTime();
                  return db - da;
                } catch {
                  return 0;
                }
              }).slice(0, 10).map((transaction: any) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 cyber-card">
                  <div>
                    <div className="text-sm font-medium text-white">{transaction.clientName}</div>
                    <div className="text-xs text-gray-400">
                      {transaction.description} • {formatDateStringForDisplay(String(transaction.date))}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] rounded border border-purple-500/30 text-purple-300">
                        {transaction.type === 'subscription' ? 'Nova Assinatura' : transaction.type === 'renewal' ? 'Renovação' : 'Outros'}
                      </span>
                      {transaction.status && (
                        <span className={`px - 2 py - 0.5 text - [11px] rounded border ${transaction.status === 'pending' ? 'border-yellow-500/40 text-yellow-300' : transaction.status === 'reverted' ? 'border-red-500/40 text-red-300' : 'border-green-500/40 text-green-300'} `}>
                          {transaction.status === 'pending' ? 'Pendente' : transaction.status === 'reverted' ? 'Revertida' : 'Confirmada'}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const client = clients.find(c => c.id === transaction.clientId);
                      const serverName = transaction.serverSnapshot || (client ? client.servidor : null);
                      const cost = Number(
                        transaction.costSnapshot ?? (client ? (getServerCostMap()[client.servidor] ?? 0) : 0)
                      );
                      if (!serverName) return null;
                      return (
                        <div className="mt-1 text-xs text-gray-400">
                          Servidor: {serverName} • Despesa servidor: {formatCurrency(cost)}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-sm font-medium text-green-400">
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}

              {filteredRevenue.length === 0 && (
                <div className="text-center py-8">
                  <BanknotesIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma transação encontrada</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CyberFinancials;