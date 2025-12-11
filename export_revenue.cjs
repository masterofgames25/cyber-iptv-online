// Script APENAS para REVENUE TRANSACTIONS
const Database = require('better-sqlite3');
const fs = require('fs');

const USER_ID = 'cc51e332-4566-44fe-8301-23c44e21eb9e';
const db = new Database('cyberpunk-iptv.db');

const escape = (s) => String(s || '').replace(/'/g, "''");

let sql = `-- APENAS REVENUE TRANSACTIONS\n\n`;
sql += `ALTER TABLE revenue_transactions DISABLE ROW LEVEL SECURITY;\n`;
sql += `DELETE FROM revenue_transactions WHERE id > 0;\n\n`;

const revenues = db.prepare('SELECT * FROM revenue_transactions').all();
console.log(`Found ${revenues.length} revenue_transactions`);

for (const r of revenues) {
    sql += `INSERT INTO revenue_transactions (type, amount, date, "clientId", "clientName", "serverSnapshot", "costSnapshot", "monthsSnapshot", status, description, user_id) VALUES ('${escape(r.type)}', ${r.amount || 0}, '${escape(r.date)}', ${r.clientId || 0}, '${escape(r.clientName)}', '${escape(r.serverSnapshot || '')}', ${r.costSnapshot || 0}, ${r.monthsSnapshot || 1}, '${escape(r.status || 'committed')}', '${escape(r.description)}', '${USER_ID}');\n`;
}

sql += `\nALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;\n`;
sql += `SELECT COUNT(*) as total_receitas FROM revenue_transactions;\n`;

fs.writeFileSync('revenue_only.sql', sql);
console.log('✅ Created: revenue_only.sql');

db.close();
