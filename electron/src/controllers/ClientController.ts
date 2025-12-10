import { getDatabase } from '../database/connection';
import { Client } from '../types';

export class ClientController {
    static async getClients(): Promise<Client[]> {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM clients WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC', (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar clientes:', err);
                    reject(err);
                } else {
                    resolve(rows as Client[]);
                }
            });
        });
    }

    static async addClient(client: Omit<Client, 'id'>): Promise<Client> {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO clients (
                    nome, whatsapp, login, senha, plano, valor, ativacao, vencimento, formaPagamento, statusPagamento,
                    servidor, dispositivo, aplicativo, macAddress, chaveDispositivo, prospeccao, situacao, listaM3U, observacoes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                client.nome,
                client.whatsapp || null,
                client.login || null,
                client.senha || null,
                client.plano || null,
                client.valor || 0,
                client.ativacao || null,
                client.vencimento || null,
                client.formaPagamento || null,
                client.statusPagamento || 'Pendente',
                client.servidor || 'BLAZE',
                client.dispositivo || null,
                client.aplicativo || null,
                client.macAddress || null,
                client.chaveDispositivo || null,
                client.prospeccao || null,
                client.situacao || 'Ativo',
                client.listaM3U || null,
                client.observacoes || null
            ];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Erro ao adicionar cliente:', err);
                    reject(err);
                } else {
                    console.log(`[db] Cliente adicionado: id=${this.lastID}, nome=${client.nome}`);
                    // Log system event
                    db.run('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)',
                        [new Date().toISOString(), 'client_added', this.lastID, client.nome, 'Cadastro de novo cliente'],
                        (logErr) => {
                            if (logErr) console.error('Erro ao registrar log de cliente adicionado:', logErr);
                        }
                    );
                    resolve({ id: this.lastID, ...client });
                }
            });
        });
    }

    static async updateClient(client: Client): Promise<Client> {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE clients SET 
                    nome = ?, whatsapp = ?, login = ?, senha = ?, plano = ?, valor = ?, 
                    ativacao = ?, vencimento = ?, formaPagamento = ?, statusPagamento = ?, servidor = ?,
                    dispositivo = ?, aplicativo = ?, macAddress = ?, chaveDispositivo = ?, prospeccao = ?, situacao = ?, listaM3U = ?, observacoes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                client.nome,
                client.whatsapp || null,
                client.login || null,
                client.senha || null,
                client.plano || null,
                client.valor || 0,
                client.ativacao || null,
                client.vencimento || null,
                client.formaPagamento || null,
                client.statusPagamento || 'Pendente',
                client.servidor || 'BLAZE',
                client.dispositivo || null,
                client.aplicativo || null,
                client.macAddress || null,
                client.chaveDispositivo || null,
                client.prospeccao || null,
                client.situacao || 'Ativo',
                client.listaM3U || null,
                client.observacoes || null,
                client.id
            ];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Erro ao atualizar cliente:', err);
                    reject(err);
                } else {
                    resolve(client);
                }
            });
        });
    }

    static async deleteClient(id: number): Promise<boolean> {
        const db = getDatabase();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                db.run('UPDATE clients SET archived = 1, situacao = ?, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['Inativo', id], function (clErr) {
                    if (clErr) {
                        db.run('ROLLBACK');
                        reject(clErr);
                    } else {
                        db.run('INSERT INTO system_log (date, type, clientId, reason) VALUES (?, ?, ?, ?)',
                            [new Date().toISOString(), 'client_archived', id, 'Cliente marcado como arquivado (soft delete)'],
                            (logErr) => {
                                if (logErr) {
                                    console.error('Erro ao registrar log de arquivamento:', logErr);
                                }
                                db.run('COMMIT');
                                resolve(true);
                            }
                        );
                    }
                });
            });
        });
    }
}

// Export wrapper functions to maintain compatibility with existing IPC handlers if they expect functions
// Or better yet, we should update the IPC handlers to use the class directly.
// For now, I will export the functions as wrappers to minimize breakage in main.ts if it imports them directly.
// Checking how they are used is important.
export const getClients = ClientController.getClients;
export const addClient = ClientController.addClient;
export const updateClient = ClientController.updateClient;
export const deleteClient = ClientController.deleteClient;

