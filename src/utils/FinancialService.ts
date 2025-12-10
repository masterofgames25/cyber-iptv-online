import { Client, RevenueTransaction } from '../types';
import { parseDateString, getDaysUntilExpiration } from './date';

export interface FinancialMetrics {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    monthlyRevenue: number;
    avgTicket: number;
    totalTransactions: number;
}

export interface ServerCost {
    server: string;
    clients: number;
    monthlyCost: number;
}

export class FinancialService {
    static calculateServerCosts(clients: Client[], costMap: Record<string, number>): ServerCost[] {
        if (!clients || !Array.isArray(clients)) return [];

        const activeClients = clients.filter(c => c.situacao === 'Ativo');
        const serverCounts = activeClients.reduce((acc, client) => {
            const server = client.servidor || 'Desconhecido';
            acc[server] = (acc[server] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(serverCounts).map(([server, count]) => ({
            server,
            clients: count,
            monthlyCost: count * (costMap[server] ?? 0)
        }));
    }

    static filterRevenue(
        revenueLog: RevenueTransaction[],
        clients: Client[],
        period: 'all' | 'month' | 'week',
        type: 'all' | 'subscription' | 'renewal' | 'other'
    ): RevenueTransaction[] {
        if (!revenueLog || !Array.isArray(revenueLog)) return [];

        let filtered = revenueLog;

        if (type !== 'all') {
            filtered = filtered.filter(item => item.type === type);
        }

        if (period !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            if (period === 'month') {
                filterDate.setMonth(now.getMonth() - 1);
            } else if (period === 'week') {
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
        // This logic was in the original component, preserving it but it seems specific to a view
        // Ideally this should be a separate filter or parameter, but keeping it for consistency with original behavior
        filtered = filtered.filter(item => {
            if (item.type !== 'renewal') return true;
            const client = clients.find(c => c.id === item.clientId);
            if (!client) return false;
            const days = getDaysUntilExpiration(client.vencimento);
            return days >= 0 && days <= 7;
        });

        return filtered;
    }

    static calculateMetrics(revenueLog: RevenueTransaction[], clients: Client[]): FinancialMetrics {
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

        const committedRevenue = revenueLog.filter((item: any) => item?.status !== 'reverted');
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
    }

    static getRevenueByType(revenueLog: RevenueTransaction[], period: 'all' | 'month' | 'week') {
        if (!revenueLog || !Array.isArray(revenueLog)) {
            return [
                { type: 'subscription', label: 'Novas Assinaturas', amount: 0, color: '#00FFFF' },
                { type: 'renewal', label: 'Renovações', amount: 0, color: '#FF00FF' },
                { type: 'other', label: 'Outros', amount: 0, color: '#00FF00' }
            ];
        }

        let source = revenueLog.filter((item: any) => item?.status !== 'reverted');

        if (period !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            if (period === 'month') filterDate.setMonth(now.getMonth() - 1);
            if (period === 'week') filterDate.setDate(now.getDate() - 7);

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
    }

    static getMonthlyTrend(revenueLog: RevenueTransaction[]) {
        if (!revenueLog || !Array.isArray(revenueLog)) return [];

        const monthlyData: Record<string, number> = {};

        revenueLog.forEach(item => {
            try {
                const parsed = parseDateString(String(item?.date || ''));
                const date = parsed || new Date(item?.date || '');
                if (isNaN(date.getTime())) return;

                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
    }
}
