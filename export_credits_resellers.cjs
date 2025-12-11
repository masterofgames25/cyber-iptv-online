// Script para migrar CREDIT TRANSACTIONS e corrigir RESELLERS
const Database = require('better-sqlite3');
const fs = require('fs');

const USER_ID = 'cc51e332-4566-44fe-8301-23c44e21eb9e';
const db = new Database('cyberpunk-iptv.db');

const escape = (s) => String(s || '').replace(/'/g, "''");

let sql = `-- MIGRATION: CREDIT TRANSACTIONS + RESELLERS FIX (CamelCase)\n\n`;

// 1. Prepare tables
sql += `ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE resellers DISABLE ROW LEVEL SECURITY;\n`;
sql += `DELETE FROM credit_transactions WHERE id > 0;\n`;
sql += `DELETE FROM resellers WHERE id > 0;\n\n`;

// 2. Load Data
const credits = db.prepare('SELECT * FROM credit_transactions').all();
const resellers = db.prepare('SELECT * FROM resellers').all();

console.log(`Found ${credits.length} credit_transactions`);
console.log(`Found ${resellers.length} resellers`);

// 3. Calculate metrics per reseller
const resellerStats = {};
resellers.forEach(r => {
    // SQLite column is 'name' (verified in step 602)
    const resName = r.name;
    if (resName) {
        resellerStats[resName] = { totalSales: 0, creditsBought: 0 };
    }
});

// Process transactions
for (const c of credits) {
    // SQLite column is 'party_name' (verified in step 602)
    const name = c.party_name;

    // Logic: type='sale' means Admin SOLD to Reseller (Reseller Bought) -> sum to totalSales
    if (c.type === 'sale' || c.type === 'purchase') {
        if (name && resellerStats[name]) {
            resellerStats[name].totalSales += (c.total || 0);
            resellerStats[name].creditsBought += (c.quantity || 0);
        }
    }
}

// 4. Generate INSERT for Credit Transactions
// Supabase columns: resellerId, type, quantity, unitPrice, total, date, operatorName, partyName, server, user_id
sql += `-- CREDIT TRANSACTIONS\n`;
for (const c of credits) {
    // SQLite: id, reseller_id, type, quantity, unit_price, total, date, operator_name, party_name, server
    sql += `INSERT INTO credit_transactions (type, quantity, "unitPrice", total, date, "operatorName", "partyName", server, user_id) VALUES ('${escape(c.type)}', ${c.quantity || 0}, ${c.unit_price || 0}, ${c.total || 0}, '${escape(c.date)}', '${escape(c.operator_name)}', '${escape(c.party_name)}', '${escape(c.server)}', '${USER_ID}');\n`;
}

// 5. Generate INSERT for Resellers with calculated totalSales
// Supabase columns: name, whatsapp, servidor, status, buyPrice, sellPrice, totalSales, created_at, user_id
sql += `\n-- RESELLERS\n`;
for (const r of resellers) {
    const resName = r.name;
    const stats = (resName && resellerStats[resName]) ? resellerStats[resName] : { totalSales: 0 };

    const createdAt = r.createdAt ? `'${escape(r.createdAt)}'` : 'NOW()';
    const nameStr = resName ? `'${escape(resName)}'` : `'Revendedor Sem Nome'`;

    // Note: Assuming creditCost -> buyPrice, credits -> sellPrice mappings are correct as per user intent
    sql += `INSERT INTO resellers (name, whatsapp, servidor, status, "buyPrice", "sellPrice", "totalSales", created_at, user_id) VALUES (${nameStr}, '${escape(r.whatsapp)}', '${escape(r.servidor || 'BLAZE')}', '${escape(r.status || 'Ativo')}', ${r.creditCost || 0}, ${r.credits || 0}, ${stats.totalSales || 0}, ${createdAt}, '${USER_ID}');\n`;
}

sql += `\nALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;\n`;
sql += `SELECT COUNT(*) as total_credits FROM credit_transactions;\n`;
sql += `SELECT COUNT(*) as total_resellers FROM resellers;\n`;

fs.writeFileSync('credits_resellers_migration.sql', sql);
console.log('✅ Created: credits_resellers_migration.sql');

db.close();
