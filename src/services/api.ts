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
    },
    planos: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getPlanos();
            const { data, error } = await supabase.from('planos').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (planos: any[]): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.savePlanos(planos);
            // Supabase 'save' for settings usually implies replace all or upsert. 
            // Since the UI passes the full list, we might need a different strategy for Supabase or adapt the UI.
            // For now, let's assume we Upsert them one by one or delete all and insert (risky with IDs).
            // Better strategy: The UI should call add/update/delete individually.
            // But the current UI calls 'savePlanos' with the new full array.
            // Refactoring the UI to use granular updates is better, but 'save' here can conform to the legacy way for now:

            // 1. Get existing IDs
            const { data: existing } = await supabase.from('planos').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));

            // 2. Upsert incoming
            for (const p of planos) {
                const { error } = await supabase.from('planos').upsert(p);
                if (error) throw error;
                existingIds.delete(p.id);
            }

            // 3. Delete removed (those remaining in existingIds)
            if (existingIds.size > 0) {
                await supabase.from('planos').delete().in('id', Array.from(existingIds));
            }
        }
    },
    servidores: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getServidores();
            const { data, error } = await supabase.from('servidores').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.saveServidores(items);
            // Sync logic
            const { data: existing } = await supabase.from('servidores').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));
            for (const item of items) {
                await supabase.from('servidores').upsert(item);
                existingIds.delete(item.id);
            }
            if (existingIds.size > 0) await supabase.from('servidores').delete().in('id', Array.from(existingIds));
        }
    },
    formasPagamento: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getFormasPagamento();
            const { data, error } = await supabase.from('formas_pagamento').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.saveFormasPagamento(items);
            const { data: existing } = await supabase.from('formas_pagamento').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));
            for (const item of items) {
                await supabase.from('formas_pagamento').upsert(item);
                existingIds.delete(item.id);
            }
            if (existingIds.size > 0) await supabase.from('formas_pagamento').delete().in('id', Array.from(existingIds));
        }
    },
    dispositivos: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getDispositivos();
            const { data, error } = await supabase.from('dispositivos').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.saveDispositivos(items);
            const { data: existing } = await supabase.from('dispositivos').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));
            for (const item of items) {
                await supabase.from('dispositivos').upsert(item);
                existingIds.delete(item.id);
            }
            if (existingIds.size > 0) await supabase.from('dispositivos').delete().in('id', Array.from(existingIds));
        }
    },
    aplicativos: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getAplicativos();
            const { data, error } = await supabase.from('aplicativos').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.saveAplicativos(items);
            const { data: existing } = await supabase.from('aplicativos').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));
            for (const item of items) {
                await supabase.from('aplicativos').upsert(item);
                existingIds.delete(item.id);
            }
            if (existingIds.size > 0) await supabase.from('aplicativos').delete().in('id', Array.from(existingIds));
        }
    },
    fontesLead: {
        list: async (): Promise<any[]> => {
            if (isElectron) return (window as any).electronAPI.database.getFontesLead();
            const { data, error } = await supabase.from('fontes_lead').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
            if (isElectron) return (window as any).electronAPI.database.saveFontesLead(items);
            const { data: existing } = await supabase.from('fontes_lead').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));
            for (const item of items) {
                await supabase.from('fontes_lead').upsert(item);
                existingIds.delete(item.id);
            }
            if (existingIds.size > 0) await supabase.from('fontes_lead').delete().in('id', Array.from(existingIds));
        }
    }
};
