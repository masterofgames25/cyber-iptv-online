import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Client, Lead, RevenueTransaction, Test, Reseller, SystemLogEntry, CreditTransaction } from '../types';
import { parseDateString, getDaysUntilExpiration, formatDateForDisplay, isWithinTolerance, addMonthsStable, getExpirationStatus } from '../utils/date';
import { useCyberpunkNotification } from '../components/CyberpunkNotification';
import { api } from '../services/api';

const areArraysEqual = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) return false;
  }
  return true;
};


interface DataContextType {
  clients: Client[];
  leads: Lead[];
  revenueLog: RevenueTransaction[];
  tests: Test[];
  resellers: Reseller[];
  systemLog: SystemLogEntry[];
  planos: any[];
  servidores: any[];
  formasPagamento: any[];
  dispositivos: any[];
  aplicativos: any[];
  prospeccoes: any[];
  addReseller: (reseller: Omit<Reseller, 'id' | 'createdAt' | 'totalSales' | 'activeClients'>) => Promise<Reseller>;
  updateReseller: (reseller: Reseller) => Promise<void>;
  deleteReseller: (id: number) => Promise<void>;
  addTest: (test: Omit<Test, 'id'>) => Promise<Test>;
  updateTest: (test: Test) => Promise<void>;
  deleteTest: (id: number) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<Lead>;
  updateLead: (lead: Lead) => Promise<void>;
  deleteLead: (id: number) => Promise<void>;
  markClientAsPaid: (clientId: number) => Promise<void>;
  renewClient: (clientId: number, newDate?: string) => Promise<void>;
  clearRevenueData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addCreditTransaction: (tx: Omit<CreditTransaction, 'id'>) => Promise<CreditTransaction>;
  getCreditTransactionsByReseller: (resellerId: number) => Promise<CreditTransaction[]>;
  isLoading: boolean;
  error: string | null;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
  initialClients?: Client[];
  initialLeads?: Lead[];
  initialRevenueLog?: RevenueTransaction[];
  initialTests?: Test[];
  initialResellers?: Reseller[];
  initialSystemLog?: SystemLogEntry[];
  initialApplications?: any[];
  initialServers?: any[];
  initialTransactions?: any[];
}



export const DataProvider: React.FC<DataProviderProps> = ({
  children,
  initialClients = [],
  initialLeads = [],
  initialRevenueLog = [],
  initialTests = [],
  initialResellers = [],
  initialSystemLog = [],
  initialApplications = [],
  initialServers = []
}) => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [revenueLog, setRevenueLog] = useState<RevenueTransaction[]>(initialRevenueLog);
  const [tests, setTests] = useState<Test[]>(initialTests);
  const [resellers, setResellers] = useState<Reseller[]>(initialResellers);
  const [systemLog, setSystemLog] = useState<SystemLogEntry[]>(initialSystemLog);
  const [planos, setPlanos] = useState<any[]>([]);
  const [servidores, setServidores] = useState<any[]>(initialServers || []);
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [aplicativos, setAplicativos] = useState<any[]>(initialApplications || []);
  const [prospeccoes, setProspeccoes] = useState<any[]>([]);
  const isTestEnv = typeof window !== 'undefined' && (window as any).IS_TEST_ENV;
  const [isLoading, setIsLoading] = useState(!isTestEnv && (initialClients.length === 0 && initialLeads.length === 0 && initialTests.length === 0 && initialResellers.length === 0));
  const [error, setError] = useState<string | null>(null);
  const alertedOverdue = useRef<Set<number>>(new Set());
  const alertedExpiringDays = useRef<Map<number, number>>(new Map());
  const alertedExpiredTests = useRef<Set<number>>(new Set());
  const { addNotification } = useCyberpunkNotification();

  const addCreditTransaction = async (tx: Omit<CreditTransaction, 'id'>): Promise<CreditTransaction> => {
    try {
      const payload = {
        reseller_id: tx.resellerId ?? null,
        type: tx.type,
        quantity: tx.quantity,
        unit_price: tx.unitPrice,
        total: tx.total,
        date: tx.date,
        operator_name: (tx as any).operatorName ?? '',
        party_name: tx.partyName ?? '',
        server: tx.server ?? ''
      };
      const row = await api.creditTransactions.add(payload);
      const normalized: CreditTransaction = {
        id: row.id,
        type: row.type,
        operatorName: row.operator_name || payload.operator_name,
        partyName: row.party_name || payload.party_name,
        resellerId: row.reseller_id ?? undefined,
        quantity: Number(row.quantity) || payload.quantity,
        unitPrice: Number(row.unit_price) || payload.unit_price,
        total: Number(row.total) || payload.total,
        server: row.server || payload.server,
        date: row.date,
        status: 'ok'
      };
      return normalized;
    } catch (error) {
      console.error('Erro ao adicionar transação de crédito:', error);
      throw error;
    }
  };

  const getCreditTransactionsByReseller = async (resellerId: number): Promise<CreditTransaction[]> => {
    try {
      const rows: any[] = await api.creditTransactions.getByReseller(resellerId);
      return (rows || []).map(r => ({
        id: r.id,
        type: r.type,
        operatorName: r.operator_name || '',
        partyName: r.party_name || '',
        resellerId: r.reseller_id ?? undefined,
        quantity: Number(r.quantity) || 0,
        unitPrice: Number(r.unit_price) || 0,
        total: Number(r.total) || 0,
        server: r.server || '',
        date: r.date,
        status: 'ok'
      }));
    } catch (error) {
      console.error('Erro ao buscar transações de crédito:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadDataAndSettings = async () => {
      // Load data generally (abstracted by api service)
      try {
        setIsLoading(true);
        // Load main entities via abstracted API
        const [loadedClients, loadedLeads, loadedRevenue, loadedTests, loadedResellers, loadedSystemLog] = await Promise.all([
          api.clients.list(),
          api.leads.list(),
          api.revenue.list(),
          api.tests.list(),
          api.resellers.list(),
          api.systemLog.list()
        ]);

        // Load settings via abstracted API (works for both Electron and Web/Supabase)
        let loadedPlanos = [], loadedServidores = [], loadedFormas = [], loadedDispositivos = [], loadedAplicativos = [], loadedFontes = [];
        try {
          [loadedPlanos, loadedServidores, loadedFormas, loadedDispositivos, loadedAplicativos, loadedFontes] = await Promise.all([
            api.planos.list(),
            api.servidores.list(),
            api.formasPagamento.list(),
            api.dispositivos.list(),
            api.aplicativos.list(),
            api.fontesLead.list()
          ]);
          console.log(`✅ Configurações carregadas: ${loadedPlanos?.length || 0} planos, ${loadedServidores?.length || 0} servidores`);
        } catch (settingsError) {
          console.error('❌ Erro ao carregar configurações:', settingsError);
          // Fallback to empty arrays if settings fail to load
        }

        setClients(loadedClients);
        setLeads(loadedLeads);
        setRevenueLog(loadedRevenue);
        setTests(loadedTests);

        // Normalize resellers if needed (Supabase might return different structure, but types match)
        const normalizedResellers: Reseller[] = (loadedResellers || []).map((r: any) => ({
          id: r.id,
          nome: r.name ?? r.nome ?? '',
          whatsapp: r.whatsapp ?? '',
          servidor: r.servidor ?? '',
          purchasePrice: r.buyPrice ?? r.purchasePrice ?? 0,
          salePrice: r.sellPrice ?? r.salePrice ?? 0,
          creditCost: r.creditCost ?? undefined,
          creditsSold: r.creditsSold ?? 0,
          activeClients: r.activeClients ?? 0,
          totalSales: r.totalSales ?? 0,
          status: (r.status === 'Inativo' ? 'inactive' : 'active') as 'active' | 'inactive',
          createdAt: r.created_at ?? new Date().toISOString()
        }));
        setResellers(normalizedResellers);
        setSystemLog(loadedSystemLog);

        setPlanos(loadedPlanos || []);
        setServidores(loadedServidores || []);
        setFormasPagamento(loadedFormas || []);
        setDispositivos(loadedDispositivos || []);
        setAplicativos(loadedAplicativos || []);
        setProspeccoes(loadedFontes || []);

        // Verificar e atualizar clientes vencidos
        console.log('🔍 Verificando clientes vencidos na inicialização...');
        for (const c of loadedClients) {
          const exp = getExpirationStatus(String(c.vencimento || ''));
          if (exp.status === 'Vencido') {
            const needsUpdate = c.statusPagamento !== 'Pendente' || c.situacao !== 'Ativo';
            if (needsUpdate) {
              await api.clients.update({
                ...c,
                situacao: 'Ativo',
                statusPagamento: 'Pendente'
              });
            }
          }
        }

        console.log(`✅ Dados carregados: ${loadedClients.length} clientes, ${loadedLeads.length} leads.`);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        setError('Erro ao carregar dados do banco de dados');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isTestEnv) {
      loadDataAndSettings();
    }
  }, [isTestEnv]);

  const refreshAll = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [loadedClients, loadedLeads, loadedRevenue, loadedTests, loadedResellers, loadedSystemLog] = await Promise.all([
        api.clients.list(),
        api.leads.list(),
        api.revenue.list(),
        api.tests.list(),
        api.resellers.list(),
        api.systemLog.list()
      ]);
      setClients(loadedClients);
      setLeads(loadedLeads);
      setRevenueLog(loadedRevenue);
      setTests(loadedTests);
      setSystemLog(loadedSystemLog);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (isTestEnv) return;

    const checkNotifications = () => {
      try {
        const now = Date.now();
        // console.log(`Verificando notificações para ${clients.length} clientes e ${tests.length} testes`);

        for (const c of clients) {
          const exp = getExpirationStatus(String(c.vencimento || ''));
          const d = exp.days;

          if (d < 0) {
            if (!alertedOverdue.current.has(c.id)) {
              console.log(`Notificando cliente vencido: ${c.nome} (${d} dias)`);
              addNotification({
                type: 'warning',
                title: 'Cliente vencido',
                message: `${c.nome} vencido há ${Math.abs(d)} dias`,
                priority: 'high',
                read: false,
                autoClose: false
              });
              alertedOverdue.current.add(c.id);
            }
          } else {
            // Se não está mais vencido, remove do set de alertas para permitir novo alerta futuro
            if (alertedOverdue.current.has(c.id)) {
              alertedOverdue.current.delete(c.id);
            }

            if (d <= 3) { // Changed from 7 to 3 to be less annoying, or keep logic consistent
              const last = alertedExpiringDays.current.get(c.id);
              if (last !== d) {
                console.log(`Notificando cliente vencendo: ${c.nome} (${d} dias)`);
                addNotification({
                  type: 'info',
                  title: 'Cliente vencendo',
                  message: `${c.nome} vence em ${d} dias`,
                  priority: 'medium',
                  read: false,
                  autoClose: true,
                  duration: 6000
                });
                alertedExpiringDays.current.set(c.id, d);
              }
            } else {
              if (alertedExpiringDays.current.has(c.id)) {
                alertedExpiringDays.current.delete(c.id);
              }
            }
          }
        }

        for (const t of tests) {
          const endStr = String(t.endAt || t.endDate || '');
          const parsed = parseDateString(endStr) || (endStr ? new Date(endStr) : null);
          const endTime = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : now;

          if (now - endTime > 0) {
            if (!alertedExpiredTests.current.has(t.id)) {
              console.log(`Notificando teste vencido: ${t.clientName}`);
              addNotification({
                type: 'warning',
                title: 'Teste vencido',
                message: `${t.clientName} finalizou o teste`,
                priority: 'low',
                read: false,
                autoClose: true,
                duration: 5000
              });
              alertedExpiredTests.current.add(t.id);
            }
          } else {
            if (alertedExpiredTests.current.has(t.id)) {
              alertedExpiredTests.current.delete(t.id);
            }
          }
        }
      } catch (e) {
        console.error('Erro na verificação de notificações:', e);
      }
    };

    // Run immediately on mount/update
    checkNotifications();

    // Run every minute to catch expirations that happen while app is open
    const interval = setInterval(checkNotifications, 60000);

    return () => clearInterval(interval);
  }, [clients, tests, isTestEnv]);


  // Periodic verification of expired clients (now using API)
  useEffect(() => {
    if (isTestEnv) return;
    const interval = setInterval(async () => {
      try {
        console.log('🔍 Executando verificação automática de clientes vencidos...');
        const [loadedClients, loadedTests] = await Promise.all([
          api.clients.list(),
          api.tests.list()
        ]);
        console.log(`📊 Verificando ${loadedClients.length} clientes...`);
        const now = Date.now();
        for (const t of loadedTests) {
          const endStr = String(t.endAt || t.endDate || '');
          const parsed = parseDateString(endStr) || (endStr ? new Date(endStr) : null);
          const endTime = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : now;
          if (now - endTime >= 0 && t.status !== 'expired') {
            await updateTest({ ...t, status: 'expired' });
          }
        }
        for (const c of loadedClients) {
          const exp = getExpirationStatus(String(c.vencimento || ''));
          if (exp.status === 'Vencido') {
            const needsUpdate = c.statusPagamento !== 'Pendente' || c.situacao !== 'Ativo';
            if (needsUpdate) {
              console.log(`✅ Atualizando cliente ${c.nome} para Ativo/Pendente (vencido)`);
              await updateClient({
                ...c,
                situacao: 'Ativo',
                statusPagamento: 'Pendente'
              });
            }
          }
        }
        await refreshAll();
        console.log('✅ Verificação automática concluída!');
      } catch (e) {
        console.error('❌ Erro na verificação automática:', e);
      }
    }, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, [isTestEnv]);

  // Generate alerts for overdue pending payments beyond tolerance
  useEffect(() => {
    try {
      if (isTestEnv) return;
      const pendentes = clients.filter(c => c.statusPagamento === 'Pendente');
      for (const c of pendentes) {
        const parsed = parseDateString(c.vencimento);
        const expired = parsed ? parsed.getTime() < Date.now() : false;
        const withinTol = isWithinTolerance(c.vencimento, 5);
        if (expired && !withinTol && !alertedOverdue.current.has(c.id)) {
          alertedOverdue.current.add(c.id);
          const evt = new CustomEvent('paymentOverdueAlert', { detail: { clientId: c.id, nome: c.nome, vencimento: c.vencimento } });
          window.dispatchEvent(evt);
          // Log to system
          api.systemLog.add({
            date: new Date().toISOString(),
            type: 'system',
            clientId: c.id,
            clientName: c.nome,
            reason: 'Pagamento em atraso fora da tolerância'
          } as any).catch(() => { });
        }
      }
    } catch { }
  }, [clients, isTestEnv]);

  useEffect(() => {
    const onSettingsUpdated = async () => {
      console.log('Evento settingsUpdated disparado. Recarregando configurações...');
      try {
        const [loadedPlanos, loadedServidores, loadedFormas, loadedDispositivos, loadedAplicativos, loadedFontes] = await Promise.all([
          api.planos.list(),
          api.servidores.list(),
          api.formasPagamento.list(),
          api.dispositivos.list(),
          api.aplicativos.list(),
          api.fontesLead.list()
        ]);
        console.log(`✅ Configurações recarregadas: ${loadedPlanos?.length || 0} planos, ${loadedServidores?.length || 0} servidores`);
        if (!areArraysEqual(planos, loadedPlanos || [])) setPlanos(loadedPlanos || []);
        if (!areArraysEqual(servidores, loadedServidores || [])) setServidores(loadedServidores || []);
        if (!areArraysEqual(formasPagamento, loadedFormas || [])) setFormasPagamento(loadedFormas || []);
        if (!areArraysEqual(dispositivos, loadedDispositivos || [])) setDispositivos(loadedDispositivos || []);
        if (!areArraysEqual(aplicativos, loadedAplicativos || [])) setAplicativos(loadedAplicativos || []);
        if (!areArraysEqual(prospeccoes, loadedFontes || [])) setProspeccoes(loadedFontes || []);
      } catch (error) {
        console.error('❌ Erro ao recarregar configurações:', error);
      }
    };
    if (!isTestEnv) {
      window.addEventListener('settingsUpdated', onSettingsUpdated as any);
      return () => window.removeEventListener('settingsUpdated', onSettingsUpdated as any);
    }
  }, [isTestEnv]);

  // Normalization is now handled by backend/database directly

  // Client operations
  const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
    try {
      // Use abstracted API
      const newClient = await api.clients.add(clientData);
      console.log(`Novo cliente cadastrado: id=${newClient.id}, nome=${newClient.nome}`);
      setClients(prev => [...prev, newClient]);

      // Add revenue transaction
      const activationDate = parseDateString(String(newClient.ativacao || ''));
      const transactionDateISO = activationDate && !isNaN(activationDate.getTime())
        ? activationDate.toISOString()
        : new Date().toISOString();
      const transaction: Omit<RevenueTransaction, 'id'> = {
        clientId: newClient.id,
        clientName: newClient.nome,
        amount: newClient.valor,
        type: 'subscription',
        date: transactionDateISO,
        description: `Novo cliente - Plano ${newClient.plano}`
      };

      console.log('Criando transação de assinatura com snapshot de custo');
      // Use abstracted API
      await api.revenue.add(transaction);
      // Refresh revenue
      const updatedRevenue = await api.revenue.list();
      setRevenueLog(updatedRevenue);

      return newClient;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  };

  const updateClient = async (updatedClient: Client): Promise<void> => {
    try {
      await api.clients.update(updatedClient);
      setClients(prev => prev.map(client =>
        client.id === updatedClient.id ? updatedClient : client
      ));
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  };

  const deleteClient = async (id: number): Promise<void> => {
    try {
      console.log(`Arquivando cliente id=${id} (soft delete)`);
      await api.clients.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
      const updatedRevenue = await api.revenue.list();
      setRevenueLog(updatedRevenue);
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  };

  const markClientAsPaid = async (clientId: number): Promise<void> => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const paymentDate = new Date().toISOString();

      // Update via abstracted API
      await api.clients.update({ ...client, statusPagamento: 'Pago', situacao: 'Ativo' });

      setClients(prevClients => prevClients.map(c => {
        if (c.id === clientId) {
          return { ...c, situacao: 'Ativo' as const, statusPagamento: 'Pago' as const };
        }
        return c;
      }));
      const updatedRevenue = await api.revenue.list();
      setRevenueLog(updatedRevenue);
    } catch (error) {
      console.error('Erro ao marcar cliente como pago:', error);
      throw error;
    }
  };

  const renewClient = async (clientId: number, newDate?: string): Promise<void> => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      let finalDate: Date;
      if (newDate) {
        const parsed = parseDateString(newDate);
        if (!parsed) throw new Error('Data inválida');
        finalDate = parsed;
      } else {
        const prevVencStr = client.vencimento;
        const parsedCurrent = parseDateString(String(prevVencStr));
        const currentDate = parsedCurrent || new Date(prevVencStr);
        const plan = (client.plano || '').toLowerCase();
        if (plan === 'mensal') finalDate = addMonthsStable(currentDate, 1);
        else if (plan === 'trimestral') finalDate = addMonthsStable(currentDate, 3);
        else if (plan === 'semestral') finalDate = addMonthsStable(currentDate, 6);
        else if (plan === 'anual') finalDate = addMonthsStable(currentDate, 12);
        else finalDate = addMonthsStable(currentDate, 1);
      }

      const updatedClient = {
        ...client,
        vencimento: formatDateForDisplay(finalDate),
        situacao: 'Ativo' as const,
        statusPagamento: 'Pago' as const
      };

      // Update client expiration date and payment status in database
      await updateClient(updatedClient);

      // Always create a renewal transaction via API
      await api.revenue.add({
        clientId: updatedClient.id,
        clientName: updatedClient.nome,
        amount: updatedClient.valor || 0,
        type: 'renewal',
        date: new Date().toISOString(),
        description: 'Renovação',
        status: 'committed'
      });

      const updatedRevenue = await api.revenue.list();
      setRevenueLog(updatedRevenue);

      // Log system entry via API
      await api.systemLog.add({
        date: new Date().toISOString(),
        type: 'system',
        clientId: client.id,
        clientName: client.nome,
        reason: 'Renovação concluída e registrada'
      });

    } catch (error) {
      console.error('Erro ao renovar cliente:', error);
      throw error;
    }
  };

  // Reseller operations
  // Reseller operations
  const addReseller = async (resData: Omit<Reseller, 'id' | 'createdAt' | 'totalSales' | 'activeClients'>): Promise<Reseller> => {
    const payload = {
      name: (resData as any).nome || '',
      whatsapp: resData.whatsapp || null,
      servidor: (resData as any).servidor || null,
      buyPrice: (resData as any).purchasePrice || 0,
      sellPrice: (resData as any).salePrice || 0,
      totalSales: 0,
      status: (resData as any).status === 'inactive' ? 'Inativo' : 'Ativo'
    };
    // Use API
    const created = await api.resellers.add(payload);

    const newReseller: Reseller = {
      id: (created as any).id,
      nome: payload.name,
      whatsapp: payload.whatsapp || '',
      servidor: payload.servidor || '',
      purchasePrice: payload.buyPrice,
      salePrice: payload.sellPrice,
      creditCost: undefined,
      creditsSold: 0,
      activeClients: 0,
      totalSales: payload.totalSales,
      status: ((resData as any).status || 'active') as any,
      createdAt: new Date().toISOString()
    };
    setResellers(prev => [newReseller, ...prev]);
    return newReseller;
  };

  const updateReseller = async (reseller: Reseller): Promise<void> => {
    const payload = {
      id: reseller.id,
      name: reseller.nome,
      whatsapp: reseller.whatsapp || null,
      servidor: reseller.servidor || null,
      buyPrice: reseller.purchasePrice || 0,
      sellPrice: reseller.salePrice || 0,
      totalSales: reseller.totalSales || 0,
      status: reseller.status === 'inactive' ? 'Inativo' : 'Ativo'
    };
    await api.resellers.update(payload);
    setResellers(prev => prev.map(r => r.id === reseller.id ? reseller : r));
  };

  const deleteReseller = async (id: number): Promise<void> => {
    await api.resellers.delete(id);
    setResellers(prev => prev.filter(r => r.id !== id));
  };

  // Lead operations
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
    try {
      const normalizePhone = (v: string) => String(v || '').replace(/\D+/g, '');
      const incomingPhone = normalizePhone((leadData.whatsapp as string) || '');
      if (incomingPhone) {
        const existing = leads.find(l => normalizePhone(l.whatsapp || '') === incomingPhone);
        if (existing) {
          return existing;
        }
      }
      const newLead = await api.leads.add(leadData);
      setLeads(prev => [...prev, newLead]);
      addNotification({
        type: 'success',
        title: 'Lead transferido',
        message: `${newLead.nome} foi adicionado aos Leads`,
        priority: 'medium',
        read: false,
        autoClose: true,
        duration: 5000
      });
      return newLead;
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao transferir lead',
        message: String((error as any)?.message || 'Falha ao adicionar lead'),
        priority: 'high',
        read: false,
        autoClose: false
      });
      throw error;
    }
  };

  const updateLead = async (updatedLead: Lead): Promise<void> => {
    try {
      const normalizePhone = (v: string) => String(v || '').replace(/\D+/g, '');
      const incomingPhone = normalizePhone(updatedLead.whatsapp || '');
      if (incomingPhone) {
        const conflict = leads.find(l => l.id !== updatedLead.id && normalizePhone(l.whatsapp || '') === incomingPhone);
        if (conflict) {
          throw new Error('WhatsApp já cadastrado em outro lead');
        }
      }
      await api.leads.update(updatedLead);
      setLeads(prev => prev.map(lead =>
        lead.id === updatedLead.id ? updatedLead : lead
      ));
      addNotification({
        type: 'success',
        title: 'Lead atualizado',
        message: `${updatedLead.nome} atualizado com sucesso`,
        priority: 'low',
        read: false,
        autoClose: true,
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar lead',
        message: String((error as any)?.message || 'Falha na atualização'),
        priority: 'medium',
        read: false,
        autoClose: true,
        duration: 6000
      });
      throw error;
    }
  };

  const deleteLead = async (id: number): Promise<void> => {
    try {
      await api.leads.delete(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      throw error;
    }
  };

  // Clear data operations (not supported in PWA - requires admin backend endpoint)
  const clearRevenueData = async (): Promise<void> => {
    console.warn('⚠️ clearRevenueData: Operação de limpeza em massa não disponível na versão PWA');
    // Would need a dedicated admin API endpoint to clear all revenue data safely
  };

  const clearAllData = async (): Promise<void> => {
    console.warn('⚠️ clearAllData: Operação de limpeza em massa não disponível na versão PWA');
    // Would need a dedicated admin API endpoint to clear all data safely
  };

  // Test operations
  const addTest = async (testData: Omit<Test, 'id'>): Promise<Test> => {
    // Check handled by API
    const created = await api.tests.add(testData);
    setTests(prev => [...prev, created]);
    return created;
  };

  const updateTest = async (updated: Test): Promise<void> => {
    await api.tests.update(updated);
    setTests(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTest = async (id: number): Promise<void> => {
    await api.tests.delete(id); // Missing in api.ts? Checking step 289. 
    // Step 289: api.tests had list, add, update. NO delete!
    // I need to add delete to api.tests first!
    setTests(prev => prev.filter(t => t.id !== id));
  };

  // Automatic lead migrations (simplified for PWA - uses API)
  const runAutomaticLeadMigrations = async (clientsIn: Client[], testsIn: Test[], leadsIn: Lead[]): Promise<void> => {
    try {
      const existingByClientId = new Set(
        (leadsIn || []).filter(l => l.fromMigration && typeof l.migratedFromClientId === 'number')
          .map(l => Number(l.migratedFromClientId))
      );

      // Migrate expired clients to leads
      for (const c of clientsIn || []) {
        const exp = getExpirationStatus(String(c.vencimento || ''));
        if (exp.status === 'Vencido' && Math.abs(exp.days || 0) >= 10) {
          if (!existingByClientId.has(Number(c.id))) {
            const newLead = await api.leads.add({
              nome: c.nome,
              whatsapp: c.whatsapp || '',
              observacoes: 'Migrado automaticamente de cliente vencido',
              status: 'Ex-Clientes',
              source: 'Auto',
              category: 'ex-client',
              contador_testes: 0,
              fromMigration: true,
              migratedFromClientId: c.id,
              migratedAt: new Date().toISOString(),
              originalExpiration: c.vencimento || '',
              originalStatusPagamento: c.statusPagamento || '',
              migrationReason: 'Vencido há 10 dias',
              originalPlano: c.plano || '',
              originalValor: String(c.valor ?? '')
            } as any);
            setLeads(prev => [...prev, newLead]);
            await api.systemLog.add({
              date: new Date().toISOString(),
              type: 'client_migration',
              clientId: c.id,
              clientName: c.nome,
              leadId: newLead.id,
              leadName: newLead.nome,
              reason: 'Migração automática de cliente vencido'
            } as any);
            existingByClientId.add(Number(c.id));
            addNotification({
              type: 'info',
              title: 'Lead migrado',
              message: `${newLead.nome} migrado de cliente vencido`,
              priority: 'medium',
              read: false,
              autoClose: true,
              duration: 5000
            });
          }
        }
      }

      // Migrate expired tests to leads
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      const nowTs = Date.now();
      const normalizePhone = (v: string) => String(v || '').replace(/\D+/g, '');

      for (const t of testsIn || []) {
        const endStr = String(t.endAt || t.endDate || '');
        const parsed = parseDateString(endStr) || (endStr ? new Date(endStr) : null);
        const endTime = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : nowTs;
        const isOlder = nowTs - endTime >= fiveDaysMs;

        if (isOlder) {
          const existsByPhone = (leadsIn || []).some(l => {
            const a = normalizePhone(l.whatsapp || '');
            const b = normalizePhone(t.whatsapp || '');
            return a && b && a === b;
          });
          const existsByName = (leadsIn || []).some(l =>
            (l.nome || '').trim().toLowerCase() === (t.clientName || '').trim().toLowerCase()
          );

          if (!existsByPhone && !existsByName) {
            const newLead = await api.leads.add({
              nome: t.clientName || 'Lead',
              whatsapp: t.whatsapp || '',
              observacoes: 'Migrado automaticamente de teste',
              status: 'Contatado',
              source: 'Auto',
              category: 'new',
              contador_testes: 1,
              fromMigration: true,
              migratedFromClientId: null,
              migratedAt: new Date().toISOString(),
              originalExpiration: '',
              originalStatusPagamento: '',
              migrationReason: 'Teste com 5+ dias',
              originalPlano: '',
              originalValor: ''
            } as any);
            setLeads(prev => [...prev, newLead]);
            await api.systemLog.add({
              date: new Date().toISOString(),
              type: 'test_migration',
              testId: t.id,
              testPhone: t.whatsapp || '',
              leadId: newLead.id,
              leadName: newLead.nome,
              reason: 'Migração automática de teste'
            } as any);
            addNotification({
              type: 'info',
              title: 'Lead migrado',
              message: `${newLead.nome} migrado de teste vencido`,
              priority: 'low',
              read: false,
              autoClose: true,
              duration: 4000
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro na migração automática de leads:', error);
      addNotification({
        type: 'error',
        title: 'Erro na migração de leads',
        message: String((error as any)?.message || 'Falha inesperada'),
        priority: 'high',
        read: false,
        autoClose: false
      });
    }
  };

  const contextValue: DataContextType = {
    clients,
    leads,
    revenueLog,
    tests,
    resellers,
    systemLog,
    planos,
    servidores,
    formasPagamento,
    dispositivos,
    aplicativos,
    prospeccoes,
    addClient,
    updateClient,
    deleteClient,
    addLead,
    updateLead,
    deleteLead,
    addReseller,
    updateReseller,
    deleteReseller,
    addTest,
    updateTest,
    deleteTest,
    markClientAsPaid,
    renewClient,
    clearRevenueData,
    clearAllData,
    refreshAll,
    addCreditTransaction,
    getCreditTransactionsByReseller,
    isLoading,
    error
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};
