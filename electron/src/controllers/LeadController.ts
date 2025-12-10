import { getDatabase } from '../database/connection';
import { Lead } from '../types';

export const getLeads = (): Promise<Lead[]> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM leads ORDER BY createdAt DESC', (err, rows) => {
            if (err) {
                console.error('Erro ao buscar leads:', err);
                reject(err);
            } else {
                resolve(rows as Lead[]);
            }
        });
    });
};

export const addLead = (lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        try {
            const normalize = (v: string) => String(v || '').replace(/\D+/g, '');
            const incomingPhone = normalize(lead.whatsapp || '');

            db.all('SELECT id, whatsapp FROM leads', (selErr, rows: any[]) => {
                if (selErr) {
                    console.error('Erro ao verificar duplicidade de lead:', selErr);
                    reject(selErr);
                    return;
                }
                const dup = rows.find(r => incomingPhone && normalize(r.whatsapp || '') === incomingPhone);
                if (dup) {
                    db.get('SELECT * FROM leads WHERE id = ?', [dup.id], (getErr, row) => {
                        if (getErr) {
                            reject(getErr);
                        } else {
                            resolve(row as Lead);
                        }
                    });
                    return;
                }

                const sql = `
          INSERT INTO leads (nome, whatsapp, observacoes, status, source, category, contador_testes, fromMigration, migratedFromClientId, migratedAt, originalExpiration, originalStatusPagamento, migrationReason, originalPlano, originalValor)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
                const params = [
                    lead.nome,
                    lead.whatsapp || null,
                    lead.observacoes || null,
                    lead.status || 'Novo',
                    lead.source || 'Manual',
                    lead.category || 'new',
                    lead.contador_testes || 0,
                    lead.fromMigration ? 1 : 0,
                    lead.migratedFromClientId || null,
                    lead.migratedAt || null,
                    lead.originalExpiration || null,
                    lead.originalStatusPagamento || null,
                    lead.migrationReason || null,
                    lead.originalPlano || null,
                    lead.originalValor || null
                ];
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error('Erro ao adicionar lead:', err);
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...lead } as Lead);
                    }
                });
            });
        } catch (e) {
            reject(e);
        }
    });
};

export const updateLead = (lead: Lead): Promise<Lead> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        try {
            const normalize = (v: string) => String(v || '').replace(/\D+/g, '');
            const incomingPhone = normalize(lead.whatsapp || '');

            db.all('SELECT id, whatsapp FROM leads', (selErr, rows: any[]) => {
                if (selErr) {
                    reject(selErr);
                    return;
                }
                const dup = rows.find(r => r.id !== lead.id && incomingPhone && normalize(r.whatsapp || '') === incomingPhone);
                if (dup) {
                    reject(new Error('WhatsApp já cadastrado em outro lead'));
                    return;
                }
                const sql = `
          UPDATE leads SET 
            nome = ?, whatsapp = ?, observacoes = ?, status = ?, source = ?, 
            category = ?, contador_testes = ?, fromMigration = ?, migratedFromClientId = ?, migratedAt = ?, originalExpiration = ?, originalStatusPagamento = ?, migrationReason = ?, originalPlano = ?, originalValor = ?
          WHERE id = ?
        `;
                const params = [
                    lead.nome,
                    lead.whatsapp || null,
                    lead.observacoes || null,
                    lead.status || 'Novo',
                    lead.source || 'Manual',
                    lead.category || 'new',
                    lead.contador_testes || 0,
                    lead.fromMigration ? 1 : 0,
                    lead.migratedFromClientId || null,
                    lead.migratedAt || null,
                    lead.originalExpiration || null,
                    lead.originalStatusPagamento || null,
                    lead.migrationReason || null,
                    lead.originalPlano || null,
                    lead.originalValor || null,
                    lead.id
                ];
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error('Erro ao atualizar lead:', err);
                        reject(err);
                    } else {
                        resolve(lead);
                    }
                });
            });
        } catch (e) {
            reject(e);
        }
    });
};

export const deleteLead = (id: number): Promise<boolean> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // First delete related system logs
            db.run('DELETE FROM system_log WHERE leadId = ?', [id], (err) => {
                if (err) {
                    console.error('Erro ao deletar logs do lead:', err);
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }

                // Then delete the lead
                db.run('DELETE FROM leads WHERE id = ?', [id], function (err) {
                    if (err) {
                        console.error('Erro ao deletar lead:', err);
                        db.run('ROLLBACK');
                        reject(err);
                    } else {
                        db.run('COMMIT');
                        resolve(true);
                    }
                });
            });
        });
    });
};
