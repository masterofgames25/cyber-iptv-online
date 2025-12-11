// Script APENAS para RESELLERS
const Database = require('better-sqlite3');
const fs = require('fs');

const USER_ID = 'cc51e332-4566-44fe-8301-23c44e21eb9e';
const db = new Database('cyberpunk-iptv.db');

const escape = (s) => String(s || '').replace(/'/g, "''");

// Colunas Supabase: user_id, sellPrice, totalSales, created_at, id, buyPrice, name, whatsapp, servidor, status

let sql = `-- APENAS RESELLERS\n\n`;
sql += `ALTER TABLE resellers DISABLE ROW LEVEL SECURITY;\n`;
sql += `DELETE FROM resellers WHERE id > 0;\n\n`;

const resellers = db.prepare('SELECT * FROM resellers').all();
console.log(`Found ${resellers.length} resellers`);

for (const r of resellers) {
    // Mapear colunas SQLite -> Supabase
    // SQLite: id, nome, whatsapp, observacoes, status, credits, creditCost, createdAt
    // Supabase: id, name, whatsapp, servidor, status, buyPrice, sellPrice, totalSales, created_at, user_id
    // Ensure created_at is a valid Value or default to NOW()
    const createdAt = r.createdAt ? `'${escape(r.createdAt)}'` : 'NOW()';
    const name = r.nome ? `'${escape(r.nome)}'` : `'Revendedor Sem Nome'`; /* Ensure name is not empty if required, though specific error was timestamp */

    sql += `INSERT INTO resellers (name, whatsapp, servidor, status, "buyPrice", "sellPrice", "totalSales", created_at, user_id) VALUES (${name}, '${escape(r.whatsapp)}', '${escape(r.servidor || 'BLAZE')}', '${escape(r.status || 'Ativo')}', ${r.creditCost || 0}, ${r.credits || 0}, 0, ${createdAt}, '${USER_ID}');\n`;
}

sql += `\nALTER TABLE resellers ENABLE ROW LEVEL SECURITY;\n`;
sql += `SELECT COUNT(*) as total_resellers FROM resellers;\n`;

fs.writeFileSync('resellers_only.sql', sql);
console.log('✅ Created: resellers_only.sql');

db.close();
