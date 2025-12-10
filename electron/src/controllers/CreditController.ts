import { getDatabase } from '../database/connection';

export interface CreditTransactionRow {
  id: number;
  reseller_id: number | null;
  type: 'purchase' | 'sale';
  quantity: number;
  unit_price: number;
  total: number;
  date: string;
  description?: string;
  operator_name?: string;
  party_name?: string;
  server?: string;
}

export const addCreditTransaction = (payload: {
  resellerId?: number;
  type: 'purchase' | 'sale';
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  description?: string;
  operatorName?: string;
  partyName?: string;
  server?: string;
}): Promise<CreditTransactionRow> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO credit_transactions (reseller_id, type, quantity, unit_price, total, date, description, operator_name, party_name, server)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      payload.resellerId ?? null,
      payload.type,
      payload.quantity,
      payload.unitPrice,
      payload.total,
      payload.date,
      payload.description || null,
      payload.operatorName || null,
      payload.partyName || null,
      payload.server || null
    ];
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          reseller_id: payload.resellerId ?? null,
          type: payload.type,
          quantity: payload.quantity,
          unit_price: payload.unitPrice,
          total: payload.total,
          date: payload.date,
          description: payload.description,
          operator_name: payload.operatorName,
          party_name: payload.partyName,
          server: payload.server
        });
      }
    });
  });
};

export const getCreditTransactionsByReseller = (resellerId: number): Promise<CreditTransactionRow[]> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM credit_transactions WHERE reseller_id = ? ORDER BY date DESC', [resellerId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as CreditTransactionRow[]);
      }
    });
  });
};

export const getAllCreditTransactions = (): Promise<CreditTransactionRow[]> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM credit_transactions ORDER BY date DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as CreditTransactionRow[]);
      }
    });
  });
};

