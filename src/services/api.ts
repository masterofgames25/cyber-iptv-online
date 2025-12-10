import { supabase } from '../lib/supabase';
import { Client, Lead, RevenueTransaction, Test, Reseller, SystemLogEntry } from '../types';

const isElectron = !!(window as any).electronAPI;

export const api = {
    clients: {
        list: async (): Promise<Client[]> => {
            if (isElectron) return (window as any).electronAPI.database.getClients();
            const { data, error } = await supabase.from('clients').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (client: Omit<Client, 'id'>): Promise<Client> => {
            if (isElectron) return (window as any).electronAPI.database.addClient(client);
            const { data, error } = await supabase.from('clients').insert(client).select().single();
            if (error) throw error;
            return data;
        },
        update: async (client: Client): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.updateClient(client);
            const { error } = await supabase.from('clients').update(client).eq('id', client.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.deleteClient(id);
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
        }
    },
    leads: {
        list: async (): Promise<Lead[]> => {
            if (isElectron) return (window as any).electronAPI.database.getLeads();
            const { data, error } = await supabase.from('leads').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
            if (isElectron) return (window as any).electronAPI.database.addLead(lead);
            const { data, error } = await supabase.from('leads').insert(lead).select().single();
            if (error) throw error;
            return data;
        },
        update: async (lead: Lead): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.updateLead(lead);
            const { error } = await supabase.from('leads').update(lead).eq('id', lead.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.deleteLead(id);
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (error) throw error;
        }
    },
    revenue: {
        list: async (): Promise<RevenueTransaction[]> => {
            if (isElectron) return (window as any).electronAPI.database.getRevenueTransactions();
            const { data, error } = await supabase.from('revenue_transactions').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (transaction: Omit<RevenueTransaction, 'id'>): Promise<RevenueTransaction> => {
            if (isElectron) return (window as any).electronAPI.database.addRevenueTransaction(transaction);
            const { data, error } = await supabase.from('revenue_transactions').insert(transaction).select().single();
            if (error) throw error;
            return data;
        }
    },
    tests: {
        list: async (): Promise<Test[]> => {
            if (isElectron) return (window as any).electronAPI.database.getTests();
            const { data, error } = await supabase.from('tests').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (test: Omit<Test, 'id'>): Promise<Test> => {
            if (isElectron) return (window as any).electronAPI.database.addTest(test);
            const { data, error } = await supabase.from('tests').insert(test).select().single();
            if (error) throw error;
            return data;
        },
        update: async (test: Test): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.updateTest(test);
            const { error } = await supabase.from('tests').update(test).eq('id', test.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.deleteTest(id);
            const { error } = await supabase.from('tests').delete().eq('id', id);
            if (error) throw error;
        }
    },
    resellers: {
        list: async (): Promise<Reseller[]> => {
            if (isElectron) return (window as any).electronAPI.database.getResellers();
            const { data, error } = await supabase.from('resellers').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (reseller: any): Promise<any> => {
            if (isElectron) return (window as any).electronAPI.database.addReseller(reseller);
            const { data, error } = await supabase.from('resellers').insert(reseller).select().single();
            if (error) throw error;
            return data;
        },
        update: async (reseller: any): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.updateReseller(reseller);
            const { error } = await supabase.from('resellers').update(reseller).eq('id', reseller.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.deleteReseller(id);
            const { error } = await supabase.from('resellers').delete().eq('id', id);
            if (error) throw error;
        }
    },
    systemLog: {
        list: async (): Promise<SystemLogEntry[]> => {
            if (isElectron) return (window as any).electronAPI.database.getSystemLog();
            const { data, error } = await supabase.from('system_log').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (entry: Omit<SystemLogEntry, 'id'>): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.addSystemLogEntry(entry);
            await supabase.from('system_log').insert(entry);
        }
    },
    creditTransactions: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getAllCreditTransactions();
            const { data, error } = await supabase.from('credit_transactions').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (transaction: any): Promise<any> => {
            if (isElectron) return (window as any).electronAPI.database.addCreditTransaction(transaction);
            const { data, error } = await supabase.from('credit_transactions').insert(transaction).select().single();
            if (error) throw error;
            return data;
        }
    }
};
