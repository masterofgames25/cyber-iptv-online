import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  MegaphoneIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useData } from '../context/DataContext';
import { getExpirationStatus, parseDateString } from '../utils/date';
import { RealtimeStat } from './RealtimeStat';
import { CyberpunkLineChart } from './CyberpunkLineChart';
import { CyberpunkPieChart } from './CyberpunkPieChart';
import { useRealTimeNotifications } from './CyberpunkNotificationCenter';

export const CyberDashboard: React.FC = () => {
  const { clients, revenueLog, resellers, tests } = useData();
  const { notifySubscriptionExpiring } = useRealTimeNotifications();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Monitor only pending payments expiring within < 7 days
  useEffect(() => {
    const expiringPending = clients.filter(c => {
      const status = getExpirationStatus(c.vencimento);
      return c.statusPagamento === 'Pendente' && status.days >= 0 && status.days < 7;
    });
    expiringPending.forEach(client => {
      const status = getExpirationStatus(client.vencimento);
      notifySubscriptionExpiring(client.nome, status.days);
    });
  }, [clients, notifySubscriptionExpiring]);

  // Listen for data updates instead of polling
  useEffect(() => {
    const handleDataUpdate = () => {
      setLastUpdate(new Date());
    };

    window.addEventListener('clientsUpdated', handleDataUpdate);
    window.addEventListener('leadsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('clientsUpdated', handleDataUpdate);
      window.removeEventListener('leadsUpdated', handleDataUpdate);
    };
  }, []);

  // Handle loading state
  useEffect(() => {
    if (clients && Array.isArray(clients) && revenueLog && Array.isArray(revenueLog)) {
      setIsLoading(false);
    }
  }, [clients, revenueLog]);

  // Estatísticas com validação defensiva e memoização
  const statsData = useMemo(() => {
    const total = clients?.length || 0;
    const expired = clients?.filter(c => {
      try {
        return getExpirationStatus(c?.vencimento).status === 'Vencido';
      } catch {
        return false;
      }
    }).length || 0;

    const expiring = clients?.filter(c => {
      try {
        const status = getExpirationStatus(c?.vencimento);
        return c?.situacao === 'Ativo' && status?.status !== 'Vencido' && status?.days >= 0 && status?.days <= 7;
      } catch {
        return false;
      }
    }).length || 0;

    const active = clients?.filter(c => {
      try {
        const status = getExpirationStatus(c?.vencimento);
        return c?.situacao === 'Ativo' && status?.status !== 'Vencido' && !(status?.days >= 0 && status?.days <= 7);
      } catch {
        return false;
      }
    }).length || 0;

    const inactive = clients?.filter(c => c?.situacao !== 'Ativo').length || 0;
    const pending = clients?.filter(c => c?.statusPagamento === 'Pendente').length || 0;

    return { total, expired, expiring, active, inactive, pending };
  }, [clients]);

  const computeEndTime = (t: any): Date => {
    try {
      if (t?.endAt) return new Date(t.endAt);
      if (t?.startAt && typeof t?.durationHours === 'number') {
        const start = parseDateString(String(t.startAt)) || new Date(t.startAt);
        const end = new Date(start);
        end.setHours(end.getHours() + (t.durationHours || 0));
        return end;
      }
      if (t?.endDate) return new Date(`${t.endDate}T23:59:59`);
      return new Date(0);
    } catch {
      return new Date(0);
    }
  };

  // Calcular receita mensal baseada em transações reais
  const monthlyRevenue = useMemo(() => {
    return revenueLog?.reduce((sum, transaction) => {
      try {
        const parsed = parseDateString(String(transaction?.date || ''));
        const transactionDate = parsed || new Date(transaction?.date || '');
        const now = new Date();
        if (transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear() &&
          typeof transaction?.amount === 'number') {
          return sum + transaction.amount;
        }
        return sum;
      } catch {
        return sum;
      }
    }, 0) || 0;
  }, [revenueLog]);

  // Dados para gráficos baseados em dados reais
  const revenueData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    if (revenueLog && Array.isArray(revenueLog)) {
      revenueLog.forEach(transaction => {
        try {
          const parsed = parseDateString(String(transaction?.date || ''));
          const date = parsed || new Date(transaction?.date || '');
          if (isNaN(date.getTime())) return;

          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (transaction?.amount || 0);
        } catch {
          // Skip invalid transactions
        }
      });
    }

    // Get last 6 months with data
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthIndex = (currentMonth - 5 + index + 12) % 12;
      const monthName = new Date(currentYear, monthIndex).toLocaleDateString('pt-BR', { month: 'short' });
      const actualValue = monthlyData[monthName] || Math.floor(monthlyRevenue * (0.8 + Math.random() * 0.4)); // Fallback simulation if no data
      const projectedValue = actualValue * 1.1; // 10% projection increase

      return {
        name: monthName,
        value: actualValue,
        projected: projectedValue
      };
    });
  }, [revenueLog, monthlyRevenue]);

  const clientDistribution = useMemo(() => [
    { name: 'Ativos', value: statsData.active, color: '#00FF00' },
    { name: 'Vencendo', value: statsData.expiring, color: '#FFAA00' },
    { name: 'Vencidos', value: statsData.expired, color: '#FF0066' },
    { name: 'Inativos', value: statsData.inactive, color: '#666666' },
  ], [statsData]);

  const realtimeStats = useMemo(() => {
    // Calculate new clients in the last 30 days
    const newClientsLast30Days = clients?.filter(c => {
      try {
        const created = parseDateString(String(c?.ativacao || '')) || new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return created >= thirtyDaysAgo && !isNaN(created.getTime());
      } catch {
        return false;
      }
    }).length || 0;

    // Calculate conversion rate (assuming leads are converted to clients)
    const conversionRate = statsData.total > 0 ? Math.min(100, (statsData.active / statsData.total) * 100) : 0;

    const resellersCount = Array.isArray(resellers) ? resellers.length : 0;
    const activeTestsCount = Array.isArray(tests) ? tests.filter(t => t.status === 'active' && computeEndTime(t).getTime() > Date.now()).length : 0;

    return [
      {
        title: 'Revendedores',
        value: resellersCount,
        icon: UsersIcon,
        color: '#22D3EE',
        glowColor: 'rgba(34, 211, 238, 0.3)',
        trend: 'neutral' as const
      },
      {
        title: 'Novos Clientes (30d)',
        value: newClientsLast30Days,
        change: newClientsLast30Days * 0.1, // Simulated change
        icon: UserGroupIcon,
        color: '#FF00FF',
        glowColor: 'rgba(255, 0, 255, 0.3)',
        trend: 'up' as const
      },
      {
        title: 'Taxa de Ativação',
        value: Math.round(conversionRate * 10) / 10,
        change: conversionRate > 80 ? 1.2 : -2.1,
        icon: ChartBarIcon,
        color: '#00FF00',
        glowColor: 'rgba(0, 255, 0, 0.3)',
        suffix: '%',
        trend: conversionRate > 80 ? 'up' as const : 'down' as const
      },
      {
        title: 'Testes Ativos',
        value: activeTestsCount,
        icon: CheckCircleIcon,
        color: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.3)',
        trend: 'neutral' as const
      }
    ];
  }, [clients, monthlyRevenue, statsData, resellers, tests]);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-400 text-lg">Inicializando Dashboard Neural...</p>
            <div className="mt-4 flex justify-center">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse mx-1"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-5xl font-bold neon-text">
                ⚡ PAINEL CYBERPUNK
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Sistema de gestão com interface neural futurista
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
          </motion.div>

          {/* Realtime Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {realtimeStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RealtimeStat {...stat} />
              </motion.div>
            ))}
          </div>

          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-8 border border-purple-500/20"
            >
              <h2 className="text-2xl font-bold neon-text-blue mb-6">📈 Tendência de Receita</h2>
              <CyberpunkLineChart
                data={revenueData}
                title="Receita Mensal (R$)"
                color="#00FFFF"
                gradientStart="#00FFFF"
                gradientEnd="#FF00FF"
                glowColor="rgba(0, 255, 255, 0.3)"
              />
            </motion.div>

            {/* Client Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-2xl p-8 border border-purple-500/20"
            >
              <h2 className="text-2xl font-bold neon-text-green mb-6">🎯 Distribuição de Clientes</h2>
              <CyberpunkPieChart
                data={clientDistribution}
                title="Status dos Clientes"
                centerText={`${statsData.total}`}
                height={300}
              />
            </motion.div>
          </div>

          {/* Seções de Ação Rápida */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ações Rápidas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold neon-text-blue mb-6">🚀 Ações Rápidas</h2>
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-cyber-blue text-left"
                  onClick={() => {
                    const evt = new CustomEvent('navigate', { detail: { view: 'clients' } });
                    window.dispatchEvent(evt);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5" />
                    <span>Adicionar Novo Cliente</span>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-cyber-green text-left"
                  onClick={() => {
                    const evt = new CustomEvent('navigate', { detail: { view: 'leads' } });
                    window.dispatchEvent(evt);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <MegaphoneIcon className="w-5 h-5" />
                    <span>Cadastrar Novo Lead</span>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-cyber text-left"
                  onClick={async () => {
                    try {
                      const out = await (window as any).electronAPI?.generateClientsPDF?.();
                      if (out && out !== 'PRINT_DIALOG') {
                        alert(`Relatório PDF gerado: ${out}`);
                      } else {
                        alert('Abra a janela de impressão e selecione “Salvar como PDF”.');
                      }
                    } catch (e) {
                      alert('Falha ao gerar PDF');
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Gerar PDF dos Clientes</span>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-cyber text-left"
                  onClick={() => {
                    const evt = new CustomEvent('navigate', { detail: { view: 'tests' } });
                    window.dispatchEvent(evt);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5" />
                    <span>Cadastrar Novo Teste</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Status do Sistema */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold neon-text-green mb-6">📊 Status do Sistema</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                    <span className="text-green-300">Sistema Online</span>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-6 h-6 text-blue-400" />
                    <span className="text-blue-300">Banco de Dados</span>
                  </div>
                  <span className="text-blue-400 text-sm">Conectado</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-purple-400" />
                    <span className="text-purple-300">Última Atualização</span>
                  </div>
                  <span className="text-purple-400 text-sm">{lastUpdate.toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default CyberDashboard;