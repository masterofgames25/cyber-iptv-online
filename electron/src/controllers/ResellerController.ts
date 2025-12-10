import { getDatabase } from '../database/connection';
import { Reseller } from '../types';

export const getResellers = (): Promise<Reseller[]> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM resellers ORDER BY created_at DESC', (err, rows) => {
            if (err) {
                console.error('Erro ao buscar revendedores:', err);
                reject(err);
            } else {
                resolve(rows as Reseller[]);
            }
        });
    });
};

export const addReseller = (reseller: Omit<Reseller, 'id'>): Promise<Reseller> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO resellers (name, whatsapp, servidor, buyPrice, sellPrice, totalSales, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            reseller.name,
            reseller.whatsapp || null,
            reseller.servidor || null,
            reseller.buyPrice || 0,
            reseller.sellPrice || 0,
            reseller.totalSales || 0,
            reseller.status || 'Ativo'
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro ao adicionar revendedor:', err);
                reject(err);
            } else {
                resolve({ id: this.lastID, ...reseller } as Reseller);
            }
        });
    });
};

export const updateReseller = (reseller: Reseller): Promise<Reseller> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE resellers SET 
        name = ?, whatsapp = ?, servidor = ?, buyPrice = ?, sellPrice = ?, totalSales = ?, status = ?
      WHERE id = ?
    `;

        const params = [
            reseller.name,
            reseller.whatsapp || null,
            reseller.servidor || null,
            reseller.buyPrice || 0,
            reseller.sellPrice || 0,
            reseller.totalSales || 0,
            reseller.status || 'Ativo',
            reseller.id
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro ao atualizar revendedor:', err);
                reject(err);
            } else {
                resolve(reseller);
            }
        });
    });
};

export const deleteReseller = (id: number): Promise<boolean> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        // First, delete all credit transactions associated with this reseller
        db.run('DELETE FROM credit_transactions WHERE reseller_id = ?', [id], (txErr) => {
            if (txErr) {
                console.error('Erro ao deletar transações de crédito do revendedor:', txErr);
                reject(txErr);
                return;
            }

            // Then delete the reseller
            db.run('DELETE FROM resellers WHERE id = ?', [id], function (err) {
                if (err) {
                    console.error('Erro ao deletar revendedor:', err);
                    reject(err);
                } else {
                    console.log(`Revendedor ${id} deletado com sucesso`);
                    resolve(true);
                }
            });
        });
    });
};
