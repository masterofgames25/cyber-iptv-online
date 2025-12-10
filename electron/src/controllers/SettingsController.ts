import { getDatabase } from '../database/connection';

const getTable = (table: string): Promise<any[]> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table} ORDER BY nome`, (err, rows) => {
            if (err) {
                console.error(`Erro ao buscar ${table}:`, err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const saveTable = (table: string, items: any[], columns: string[]): Promise<boolean> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run(`DELETE FROM ${table}`, (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }

                const placeholders = columns.map(() => '?').join(', ');
                const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
                let completed = 0;
                const total = items.length;

                if (total === 0) {
                    db.run('COMMIT');
                    resolve(true);
                    return;
                }

                items.forEach(item => {
                    const values = columns.map(col => {
                        if (col === 'ativo') return item.ativo ? 1 : 0;
                        return item[col];
                    });

                    stmt.run(...values, (err: Error | null) => {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        completed++;
                        if (completed === total) {
                            stmt.finalize();
                            db.run('COMMIT');
                            resolve(true);
                        }
                    });
                });
            });
        });
    });
};

export const getPlanos = () => getTable('planos');
export const savePlanos = (planos: any[]) => saveTable('planos', planos, ['nome', 'meses', 'preco', 'ativo']);

export const getServidores = () => getTable('servidores');
export const saveServidores = (servidores: any[]) => saveTable('servidores', servidores, ['nome', 'custo', 'valorCredito', 'ativo']);

export const getFormasPagamento = () => getTable('formas_pagamento');
export const saveFormasPagamento = (formas: any[]) => saveTable('formas_pagamento', formas, ['nome', 'ativo']);

export const getDispositivos = () => getTable('dispositivos');
export const saveDispositivos = (dispositivos: any[]) => saveTable('dispositivos', dispositivos, ['nome', 'ativo']);

export const getAplicativos = () => getTable('aplicativos');
export const saveAplicativos = (aplicativos: any[]) => saveTable('aplicativos', aplicativos, ['nome', 'ativo']);

export const getFontesLead = () => getTable('fontes_lead');
export const saveFontesLead = (fontes: any[]) => saveTable('fontes_lead', fontes, ['nome', 'ativo']);
