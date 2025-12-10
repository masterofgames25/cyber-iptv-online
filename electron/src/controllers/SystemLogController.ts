import { getDatabase } from '../database/connection';
import { SystemLogEntry } from '../types';

export const getSystemLog = (): Promise<SystemLogEntry[]> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM system_log ORDER BY date DESC LIMIT 100', (err, rows) => {
            if (err) {
                console.error('Erro ao buscar log do sistema:', err);
                reject(err);
            } else {
                resolve(rows as SystemLogEntry[]);
            }
        });
    });
};

export const addSystemLogEntry = (logEntry: Omit<SystemLogEntry, 'id'>): Promise<SystemLogEntry> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO system_log (date, type, clientId, clientName, leadId, leadName, testId, testPhone, reason, originalClient, originalTest)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            logEntry.date || new Date().toISOString(),
            logEntry.type || 'system',
            logEntry.clientId || null,
            logEntry.clientName || null,
            logEntry.leadId || null,
            logEntry.leadName || null,
            logEntry.testId || null,
            logEntry.testPhone || null,
            logEntry.reason || null,
            logEntry.originalClient || null,
            logEntry.originalTest || null
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro ao adicionar log do sistema:', err);
                reject(err);
            } else {
                resolve({ id: this.lastID, ...logEntry } as SystemLogEntry);
            }
        });
    });
};

export const clearAllData = (): Promise<boolean> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run('DELETE FROM revenue_transactions', (rtErr) => {
                if (rtErr) {
                    db.run('ROLLBACK');
                    reject(rtErr);
                    return;
                }
                db.run('DELETE FROM system_log', (slErr) => {
                    if (slErr) {
                        db.run('ROLLBACK');
                        reject(slErr);
                        return;
                    }
                    db.run('DELETE FROM tests', (tErr) => {
                        if (tErr) {
                            db.run('ROLLBACK');
                            reject(tErr);
                            return;
                        }
                        db.run('DELETE FROM resellers', (rErr) => {
                            if (rErr) {
                                db.run('ROLLBACK');
                                reject(rErr);
                                return;
                            }
                            db.run('DELETE FROM leads', (lErr) => {
                                if (lErr) {
                                    db.run('ROLLBACK');
                                    reject(lErr);
                                    return;
                                }
                                db.run('DELETE FROM clients', (cErr) => {
                                    if (cErr) {
                                        db.run('ROLLBACK');
                                        reject(cErr);
                                    } else {
                                        db.run('COMMIT');
                                        resolve(true);
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
