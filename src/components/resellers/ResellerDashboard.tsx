import React from 'react';
import { Reseller, CreditTransaction } from '../../types';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ResellerDashboardProps {
  resellers: Reseller[];
  allTransactions: CreditTransaction[];
  expenses: Array<{ id: number; description: string; amount: number; date: string }>;
}

const ResellerDashboard: React.FC<ResellerDashboardProps> = ({ resellers, allTransactions, expenses }) => {
  const activeResellers = resellers.filter(r => r.status === 'active').length;
  const bestPerformer = resellers.reduce((best, r) => r.totalSales > (best?.totalSales || 0) ? r : best, null as Reseller | null);

  // Use allTransactions for dashboard metrics to include global purchases
  const totalPurchaseCost = allTransactions.filter(t => t.type === 'purchase').reduce((s, t) => s + t.total, 0);
  const totalSalesValue = allTransactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.total, 0);
  const totalManualExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalPurchaseCost + totalManualExpenses;
  const totalProfit = totalSalesValue - totalExpenses;
  const percentGain = totalExpenses > 0 ? (totalProfit / totalExpenses) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <UserGroupIcon className="w-8 h-8 text-purple-400" />
          <span className="text-2xl font-bold text-white">{resellers.length}</span>
        </div>
        <h3 className="text-gray-400">Total Revendedores</h3>
        <p className="text-sm text-green-400">{activeResellers} ativos</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <ChartBarIcon className="w-8 h-8 text-green-400" />
          <span className="text-2xl font-bold text-white">{bestPerformer?.nome || 'Nenhum'}</span>
        </div>
        <h3 className="text-gray-400">Melhor Desempenho</h3>
        <p className="text-sm text-green-400">R$ {bestPerformer?.totalSales.toFixed(2) || '0.00'}</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <CurrencyDollarIcon className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold text-white">R$ {totalSalesValue.toFixed(2)}</span>
        </div>
        <h3 className="text-gray-400">Vendas Totais</h3>
        <p className="text-sm text-cyan-400">{allTransactions.filter(t => t.type === 'sale').length} transações</p>
      </div>

      <div className="glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <CheckCircleIcon className="w-8 h-8 text-green-400" />
          <span className="text-2xl font-bold text-white">{percentGain.toFixed(1)}%</span>
        </div>
        <h3 className="text-gray-400">Lucro (%)</h3>
        <p className="text-sm text-green-400">R$ {totalProfit.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ResellerDashboard;
