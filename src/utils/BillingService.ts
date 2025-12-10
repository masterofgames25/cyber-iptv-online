import { Client } from '../types';
import { parseDateString, getDaysUntilExpiration } from './date';

export interface ClientBillingStatus {
    base: Client;
    daysUntilExp: number;
    isExpiring: boolean;
    isExpired: boolean;
    isPending: boolean;
    active: boolean;
}

export interface BillingStats {
    totalPending: number;
    expiredCount: number;
    expiringCount: number;
    totalCount: number;
}

export class BillingService {
    static computeClientStatus(client: Client): ClientBillingStatus {
        const d = parseDateString(client.vencimento);
        const days = d ? getDaysUntilExpiration(client.vencimento) : Infinity;
        const isExpiring = days <= 7 && days >= 0;
        const isExpired = days < 0;
        const isPending = client.statusPagamento === 'Pendente';
        const active = client.situacao === 'Ativo';

        return {
            base: client,
            daysUntilExp: days,
            isExpiring,
            isExpired,
            isPending,
            active
        };
    }

    static filterClients(
        clients: Client[],
        searchTerm: string,
        statusFilter: 'all' | 'pending' | 'expiring' | 'expired' | 'due_pending'
    ): Client[] {
        const term = searchTerm.toLowerCase();

        return clients
            .map(c => this.computeClientStatus(c))
            .filter(({ base, isExpiring, isPending, active }) => {
                const matchesSearch = base.nome.toLowerCase().includes(term) || base.whatsapp.includes(searchTerm.replace(/\D/g, ''));
                if (!matchesSearch) return false;
                if (!active) return false;

                switch (statusFilter) {
                    case 'expired':
                        return getDaysUntilExpiration(base.vencimento) < 0;
                    case 'expiring':
                        return getDaysUntilExpiration(base.vencimento) <= 7 && getDaysUntilExpiration(base.vencimento) >= 0;
                    case 'pending':
                        return base.statusPagamento === 'Pendente';
                    case 'due_pending':
                        return isExpiring || isPending;
                    default:
                        return isExpiring || isPending || getDaysUntilExpiration(base.vencimento) < 0;
                }
            })
            .sort((a, b) => {
                const ad = a.daysUntilExp;
                const bd = b.daysUntilExp;
                const av = isFinite(ad) ? ad : 99999;
                const bv = isFinite(bd) ? bd : 99999;
                return av - bv;
            })
            .map(({ base }) => base);
    }

    static calculateStats(filteredClients: Client[]): BillingStats {
        const totalPending = filteredClients.reduce((sum, client) => {
            const valor = parseFloat(client.valor.toString()) || 0;
            return sum + valor;
        }, 0);

        const expiredCount = filteredClients.filter(client => {
            const expirationDate = parseDateString(client.vencimento);
            if (!expirationDate) return false;
            return getDaysUntilExpiration(client.vencimento) < 0;
        }).length;

        const expiringCount = filteredClients.filter(client => {
            const expirationDate = parseDateString(client.vencimento);
            if (!expirationDate) return false;
            const daysUntilExp = getDaysUntilExpiration(client.vencimento);
            return daysUntilExp <= 7 && daysUntilExp >= 0;
        }).length;

        return {
            totalPending,
            expiredCount,
            expiringCount,
            totalCount: filteredClients.length
        };
    }

    static getExpirationStatus(client: Client) {
        const expirationDate = parseDateString(client.vencimento);
        if (!expirationDate) return { status: 'error', text: 'Data inválida', color: 'text-red-400' };

        const daysUntilExp = getDaysUntilExpiration(client.vencimento);

        if (daysUntilExp < 0) {
            return {
                status: 'expired',
                text: `Venceu há ${Math.abs(daysUntilExp)} dias`,
                color: 'text-red-400',
                bgColor: 'bg-red-900/20',
                borderColor: 'border-red-500/30'
            };
        } else if (daysUntilExp === 0) {
            return {
                status: 'due_today',
                text: 'Vence hoje',
                color: 'text-orange-300',
                bgColor: 'bg-orange-900/30',
                borderColor: 'border-orange-500/50'
            };
        } else if (daysUntilExp <= 3) {
            return {
                status: 'critical',
                text: `Vence em ${daysUntilExp} dias`,
                color: 'text-orange-400',
                bgColor: 'bg-orange-900/20',
                borderColor: 'border-orange-500/30'
            };
        } else if (daysUntilExp <= 7) {
            return {
                status: 'warning',
                text: `Vence em ${daysUntilExp} dias`,
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-900/20',
                borderColor: 'border-yellow-500/30'
            };
        } else {
            return {
                status: 'ok',
                text: `Vence em ${daysUntilExp} dias`,
                color: 'text-green-400',
                bgColor: 'bg-green-900/20',
                borderColor: 'border-green-500/30'
            };
        }
    }
}
