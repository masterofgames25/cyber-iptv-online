import { supabase } from '../lib/supabase';
import { Client, Lead, RevenueTransaction, Test, Reseller, SystemLogEntry } from '../types';

export const api = {
    clients: {
        list: async (): Promise<Client[]> => {
            const { data, error } = await supabase.from('clients').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (client: Omit<Client, 'id'>): Promise<Client> => {
            const { data, error } = await supabase.from('clients').insert(client).select().single();
            if (error) throw error;
            return data;
        },
        update: async (client: Client): Promise<void> => {
            const { error } = await supabase.from('clients').update(client).eq('id', client.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
        }
    },
    leads: {
        list: async (): Promise<Lead[]> => {
            const { data, error } = await supabase.from('leads').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
            const { data, error } = await supabase.from('leads').insert(lead).select().single();
            if (error) throw error;
            return data;
        },
        update: async (lead: Lead): Promise<void> => {
            const { error } = await supabase.from('leads').update(lead).eq('id', lead.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('leads').delete().eq('id', id);
            if (error) throw error;
        }
    },
    revenue: {
        list: async (): Promise<RevenueTransaction[]> => {
            const { data, error } = await supabase.from('revenue_transactions').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (transaction: Omit<RevenueTransaction, 'id'>): Promise<RevenueTransaction> => {
            const { data, error } = await supabase.from('revenue_transactions').insert(transaction).select().single();
            if (error) throw error;
            return data;
        }
    },
    tests: {
        list: async (): Promise<Test[]> => {
            const { data, error } = await supabase.from('tests').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (test: Omit<Test, 'id'>): Promise<Test> => {
            const { data, error } = await supabase.from('tests').insert(test).select().single();
            if (error) throw error;
            return data;
        },
        update: async (test: Test): Promise<void> => {
            const { error } = await supabase.from('tests').update(test).eq('id', test.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('tests').delete().eq('id', id);
            if (error) throw error;
        }
    },
    resellers: {
        list: async (): Promise<Reseller[]> => {
            const { data, error } = await supabase.from('resellers').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (reseller: any): Promise<any> => {
            const { data, error } = await supabase.from('resellers').insert(reseller).select().single();
            if (error) throw error;
            return data;
        },
        update: async (reseller: any): Promise<void> => {
            const { error } = await supabase.from('resellers').update(reseller).eq('id', reseller.id);
            if (error) throw error;
        },
        delete: async (id: number): Promise<void> => {
            const { error } = await supabase.from('resellers').delete().eq('id', id);
            if (error) throw error;
        }
    },
    systemLog: {
        list: async (): Promise<SystemLogEntry[]> => {
            const { data, error } = await supabase.from('system_log').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (entry: Omit<SystemLogEntry, 'id'>): Promise<void> => {
            await supabase.from('system_log').insert(entry);
        }
    },
    creditTransactions: {
        list: async (): Promise<any[]> => {
            const { data, error } = await supabase.from('credit_transactions').select('*');
            if (error) throw error;
            return data || [];
        },
        add: async (transaction: any): Promise<any> => {
            const { data, error } = await supabase.from('credit_transactions').insert(transaction).select().single();
            if (error) throw error;
            return data;
        },
        getByReseller: async (resellerId: number): Promise<any[]> => {
            const { data, error } = await supabase.from('credit_transactions').select('*').eq('reseller_id', resellerId);
            if (error) throw error;
            return data || [];
        }
    },
    planos: {
        list: async (): Promise<any[]> => {
            const { data, error } = await supabase.from('planos').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (planos: any[]): Promise<void> => {
            // Get existing IDs
            const { data: existing } = await supabase.from('planos').select('id');
            const existingIds = new Set((existing || []).map(x => x.id));

            // Upsert incoming
            for (const p of planos) {
                const { error } = await supabase.from('planos').upsert(p);
                if (error) throw error;
                existingIds.delete(p.id);
            }

            // Delete removed
            if (existingIds.size > 0) {
                await supabase.from('planos').delete().in('id', Array.from(existingIds));
            }
        }
    },
    servidores: {
        list: async (): Promise<any[]> => {
            const { data, error } = await supabase.from('servidores').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
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
            const { data, error } = await supabase.from('formas_pagamento').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
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
            const { data, error } = await supabase.from('dispositivos').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
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
            const { data, error } = await supabase.from('aplicativos').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
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
            const { data, error } = await supabase.from('fontes_lead').select('*');
            if (error) throw error;
            return data || [];
        },
        save: async (items: any[]): Promise<void> => {
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
