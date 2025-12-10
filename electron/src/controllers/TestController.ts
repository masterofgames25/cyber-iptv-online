import { getDatabase } from '../database/connection';
import { Test } from '../types';

export const getTests = (): Promise<Test[]> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM tests ORDER BY startAt DESC', (err, rows) => {
            if (err) {
                console.error('Erro ao buscar testes:', err);
                reject(err);
            } else {
                resolve(rows as Test[]);
            }
        });
    });
};

export const addTest = (test: Omit<Test, 'id'>): Promise<Test> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO tests (clientName, whatsapp, plano, server, durationHours, startAt, endAt, endDate, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            test.clientName || null,
            test.whatsapp || null,
            test.plano || null,
            test.server || 'BLAZE',
            test.durationHours || 0,
            test.startAt || null,
            test.endAt || null,
            test.endDate || null,
            test.notes || null,
            test.status || 'active'
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro ao adicionar teste:', err);
                reject(err);
            } else {
                resolve({ id: this.lastID, ...test } as Test);
            }
        });
    });
};

export const updateTest = (test: Test): Promise<Test> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE tests SET 
        clientName = ?, whatsapp = ?, plano = ?, server = ?, durationHours = ?,
        startAt = ?, endAt = ?, endDate = ?, notes = ?, status = ?
      WHERE id = ?
    `;

        const params = [
            test.clientName || null,
            test.whatsapp || null,
            test.plano || null,
            test.server || 'BLAZE',
            test.durationHours || 0,
            test.startAt || null,
            test.endAt || null,
            test.endDate || null,
            test.notes || null,
            test.status || 'active',
            test.id
        ];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro ao atualizar teste:', err);
                reject(err);
            } else {
                resolve(test);
            }
        });
    });
};

export const deleteTest = (id: number): Promise<boolean> => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM tests WHERE id = ?', [id], function (err) {
            if (err) {
                console.error('Erro ao deletar teste:', err);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};
