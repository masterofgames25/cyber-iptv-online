import { getDatabase } from '../database/connection';
import { RevenueTransaction } from '../types';

export class RevenueController {
    static async getRevenueTransactions(): Promise<RevenueTransaction[]> {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM revenue_transactions ORDER BY date DESC', (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar transações:', err);
                    reject(err);
                } else {
                    resolve(rows as RevenueTransaction[]);
                }
            });
        });
    }

    static async addRevenueTransaction(transaction: Omit<RevenueTransaction, 'id'>): Promise<RevenueTransaction> {
        const db = getDatabase();
        
        // Helper to get client
        const getClient = (id: number): Promise<any> => {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };

        // Helper to get server cost
        const getServerCost = (serverName: string): Promise<number> => {
            return new Promise((resolve) => {
                db.get('SELECT custo FROM servidores WHERE TRIM(UPPER(nome)) = TRIM(UPPER(?))', [serverName], (err, row: any) => {
                    if (err) console.error('Erro ao buscar custo do servidor:', err);
                    resolve(err ? 0 : Number((row && row.custo) || 0));
                });
            });
        };

        // Helper to get plan months
        const getPlanMonths = (planName: string): Promise<number> => {
            return new Promise((resolve) => {
                db.get('SELECT meses FROM planos WHERE TRIM(UPPER(nome)) = TRIM(UPPER(?))', [planName], (err, row: any) => {
                    if (err) console.error('Erro ao buscar meses do plano:', err);
                    resolve(err ? 1 : Number((row && row.meses) || 1) || 1);
                });
            });
        };

        try {
            const clientRow = await getClient(transaction.clientId);
            const clientServer = clientRow ? (clientRow.servidor || '') : '';
            const clientPlan = clientRow ? (clientRow.plano || '') : '';

            const baseCost = await getServerCost(clientServer);
            const months = await getPlanMonths(clientPlan);
            const costSnapshot = baseCost * months;

            const hasStatus = transaction && typeof transaction.status === 'string';
            
            const sql = hasStatus
                ? 'INSERT INTO revenue_transactions (clientId, clientName, amount, type, date, description, serverSnapshot, costSnapshot, monthsSnapshot, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                : 'INSERT INTO revenue_transactions (clientId, clientName, amount, type, date, description, serverSnapshot, costSnapshot, monthsSnapshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

            const baseParams = [
                transaction.clientId || null,
                transaction.clientName || null,
                transaction.amount || 0,
                transaction.type || 'other',
                transaction.date || new Date().toISOString(),
                transaction.description || null,
                clientServer,
                costSnapshot,
                months
            ];

            const params = hasStatus ? [...baseParams, transaction.status] : baseParams;

            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error('Erro ao adicionar transação:', err);
                        reject(err);
                    } else {
                        console.log(`[db] Transação inserida: id=${this.lastID}, clientId=${transaction.clientId}, tipo=${transaction.type}, valor=${transaction.amount}, custo=${costSnapshot}`);
                        
                        // Log system event
                        db.run('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)',
                            [new Date().toISOString(), 'revenue_added', transaction.clientId || null, transaction.clientName || null, `Transação ${transaction.type} criada`],
                            (logErr) => {
                                if (logErr) console.error('Erro ao registrar log de transação:', logErr);
                            }
                        );

                        resolve({ 
                            id: this.lastID, 
                            ...transaction, 
                            serverSnapshot: clientServer, 
                            costSnapshot, 
                            monthsSnapshot: months 
                        } as RevenueTransaction);
                    }
                });
            });
        } catch (error) {
            console.error('Erro em addRevenueTransaction:', error);
            throw error;
        }
    }

    static async confirmPayment(payload: { clientId: number; paymentDate?: string }): Promise<boolean> {
        const { clientId, paymentDate } = payload || {};
        const db = getDatabase();

        const runQuery = (sql: string, params: any[] = []): Promise<void> => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        const getQuery = (sql: string, params: any[] = []): Promise<any> => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };

        return new Promise((resolve, reject) => {
            db.serialize(async () => {
                try {
                    await runQuery('BEGIN TRANSACTION');

                    const clientRow = await getQuery('SELECT * FROM clients WHERE id = ?', [clientId]);
                    if (!clientRow) {
                        throw new Error('Cliente não encontrado');
                    }

                    const updateSql = 'UPDATE clients SET statusPagamento = ?, updated_at = CURRENT_TIMESTAMP, dataPagamento = ? WHERE id = ?';
                    await runQuery(updateSql, ['Pago', paymentDate || new Date().toISOString().split('T')[0], clientId]);

                    // Check for pending renewal
                    const pendingRow = await getQuery('SELECT id FROM revenue_transactions WHERE clientId = ? AND type = ? AND status = ? ORDER BY date DESC LIMIT 1', [clientRow.id, 'renewal', 'pending']);

                    if (pendingRow) {
                        // Commit pending renewal
                        const nowDate = paymentDate || new Date().toISOString();
                        await runQuery('UPDATE revenue_transactions SET status = ?, date = ?, description = ? WHERE id = ?', 
                            ['committed', nowDate, 'Pagamento confirmado - Renovação', pendingRow.id]);
                        
                        await runQuery('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)',
                            [new Date().toISOString(), 'payment_confirmed', clientRow.id, clientRow.nome, 'Confirmação de pagamento com renovação']);
                    } else {
                        // Just log
                        await runQuery('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)',
                            [new Date().toISOString(), 'payment_confirmed', clientRow.id, clientRow.nome, 'Confirmação de pagamento']);
                    }

                    await runQuery('COMMIT');
                    resolve(true);

                } catch (error) {
                    await runQuery('ROLLBACK');
                    reject(error);
                }
            });
        });
    }

    static async revertRevenueTransaction(payload: { transactionId: number; reason?: string }): Promise<boolean> {
        const { transactionId, reason } = payload;
        const db = getDatabase();

        const runQuery = (sql: string, params: any[] = []): Promise<void> => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        const getQuery = (sql: string, params: any[] = []): Promise<any> => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        };

        return new Promise((resolve, reject) => {
            db.serialize(async () => {
                try {
                    await runQuery('BEGIN TRANSACTION');
                    
                    const now = new Date().toISOString();
                    await runQuery('UPDATE revenue_transactions SET status = ?, reversedAt = ? WHERE id = ?', ['reverted', now, transactionId]);

                    const row = await getQuery('SELECT * FROM revenue_transactions WHERE id = ?', [transactionId]);
                    if (!row) throw new Error('Transação não encontrada');

                    await runQuery('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)',
                        [now, 'transaction_reverted', row.clientId, row.clientName, reason || 'Reversão de transação']);

                    await runQuery('COMMIT');
                    resolve(true);
                } catch (error) {
                    await runQuery('ROLLBACK');
                    reject(error);
                }
            });
        });
    }

    static async clearRevenueTransactions(): Promise<boolean> {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM revenue_transactions', function (err) {
                if (err) {
                    console.error('Erro ao limpar transações:', err);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
}
