import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useData } from '../context/DataContext';
import { useSystemData } from '../utils/systemData';
import { getExpirationStatus, parseDateString } from '../utils/date';
import { Client } from '../types';

export const useClientsLogic = () => {
    const { clients, addClient, updateClient, deleteClient, revenueLog, renewClient, markClientAsPaid } = useData();
    const { getServers, getApplications, getDevices } = useSystemData();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Ativo' | 'Inativo'>('all');
    const [filterExpiration, setFilterExpiration] = useState<'all' | 'expired' | 'expiring'>('all');
    const [selectedServers, setSelectedServers] = useState<string[]>([]);
    const [selectedApps, setSelectedApps] = useState<string[]>([]);
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'Pago' | 'Pendente'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Lists for filters
    const uniqueStrings = (arr: string[]) => Array.from(new Set((arr || []).filter(Boolean)));
    const [serversList, setServersList] = useState<string[]>(() => uniqueStrings(getServers()));
    const [appsList, setAppsList] = useState<string[]>(() => uniqueStrings(getApplications()));
    const [devicesList, setDevicesList] = useState<string[]>(() => uniqueStrings(getDevices()));

    useEffect(() => {
        const onSettingsUpdate = () => {
            setServersList(uniqueStrings(getServers()));
            setAppsList(uniqueStrings(getApplications()));
            setDevicesList(uniqueStrings(getDevices()));
        };
        window.addEventListener('settingsUpdated', onSettingsUpdate as any);
        return () => window.removeEventListener('settingsUpdated', onSettingsUpdate as any);
    }, []);

    // Sync selected filters with available lists
    useEffect(() => {
        setSelectedServers(prev => prev.filter(s => serversList.includes(s)));
    }, [serversList]);

    useEffect(() => {
        setSelectedApps(prev => prev.filter(a => appsList.includes(a)));
    }, [appsList]);

    useEffect(() => {
        setSelectedDevices(prev => prev.filter(d => devicesList.includes(d)));
    }, [devicesList]);

    const deferredSearchTerm = useDeferredValue(searchTerm);

    const expStatusMap = useMemo(() => {
        const map: Record<number, ReturnType<typeof getExpirationStatus>> = {};
        for (const c of clients) {
            map[c.id] = getExpirationStatus(c.vencimento);
        }
        return map;
    }, [clients]);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = client.nome.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
                client.whatsapp.includes(deferredSearchTerm) ||
                client.login.toLowerCase().includes(deferredSearchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || client.situacao === filterStatus;

            const expStatus = expStatusMap[client.id] || getExpirationStatus(client.vencimento);
            const matchesExpiration = filterExpiration === 'all' ||
                (filterExpiration === 'expired' && expStatus.status === 'Vencido') ||
                (filterExpiration === 'expiring' && expStatus.days >= 0 && expStatus.days <= 7);

            const matchesServers = selectedServers.length === 0 || selectedServers.includes(client.servidor);
            const matchesApps = selectedApps.length === 0 || selectedApps.includes(client.aplicativo);
            const matchesDevices = selectedDevices.length === 0 || selectedDevices.includes(client.dispositivo);
            const matchesPayment = paymentFilter === 'all' || client.statusPagamento === paymentFilter;

            return matchesSearch && matchesStatus && matchesExpiration && matchesServers && matchesApps && matchesDevices && matchesPayment;
        });
    }, [clients, deferredSearchTerm, filterStatus, filterExpiration, selectedServers, selectedApps, selectedDevices, paymentFilter, expStatusMap]);

    const uniqueFilteredClients = useMemo(() => {
        const seen = new Set<number>();
        const out: Client[] = [];
        for (const c of filteredClients) {
            if (seen.has(c.id)) continue;
            seen.add(c.id);
            out.push(c);
        }
        return out;
    }, [filteredClients]);

    const paginatedClients = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const sorted = [...uniqueFilteredClients].sort((a, b) => {
            const ea = expStatusMap[a.id] || getExpirationStatus(a.vencimento);
            const eb = expStatusMap[b.id] || getExpirationStatus(b.vencimento);
            const da = Number.isFinite(ea.days) ? ea.days : Number.POSITIVE_INFINITY;
            const db = Number.isFinite(eb.days) ? eb.days : Number.POSITIVE_INFINITY;
            if (da !== db) return da - db;
            const pa = a.statusPagamento === 'Pendente' ? 0 : 1;
            const pb = b.statusPagamento === 'Pendente' ? 0 : 1;
            return pa - pb;
        });
        return sorted.slice(startIndex, startIndex + itemsPerPage);
    }, [uniqueFilteredClients, currentPage, expStatusMap]);

    const totalPages = Math.ceil(uniqueFilteredClients.length / itemsPerPage) || 1;

    // Statistics
    const stats = useMemo(() => {
        return {
            active: clients.filter(c => c.situacao === 'Ativo').length,
            expired: clients.filter(c => getExpirationStatus(c.vencimento).status === 'Vencido').length,
            expiring: clients.filter(c => {
                const s = getExpirationStatus(c.vencimento);
                return s.days <= 7 && s.days >= 0;
            }).length,
            revenue: (revenueLog || []).filter(item => {
                try {
                    const parsed = parseDateString(String(item.date));
                    const d = parsed || new Date(item.date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                } catch {
                    return false;
                }
            }).reduce((sum, item) => sum + (item.amount || 0), 0)
        };
    }, [clients, revenueLog]);

    return {
        clients,
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
        renewClient: (id: number, newDate?: string) => renewClient(id, newDate),
        markClientAsPaid: (id: number) => markClientAsPaid(id)
    };
};
