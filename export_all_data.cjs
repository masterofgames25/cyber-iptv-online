// Script COMPLETO - Gera SQL com RLS desabilitado
const Database = require('better-sqlite3');
const fs = require('fs');

const USER_ID = 'cc51e332-4566-44fe-8301-23c44e21eb9e';
const db = new Database('cyberpunk-iptv.db');

const escape = (s) => String(s || '').replace(/'/g, "''");

let sql = `-- ===========================================\n`;
sql += `-- MIGRATION COMPLETA COM RLS DESABILITADO\n`;
sql += `-- Execute TODO este script no Supabase SQL Editor\n`;
sql += `-- ===========================================\n\n`;

// ============ DESABILITAR RLS ============
sql += `-- PASSO 1: Desabilitar RLS em todas as tabelas\n`;
sql += `ALTER TABLE revenue_transactions DISABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE leads DISABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE tests DISABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE resellers DISABLE ROW LEVEL SECURITY;\n\n`;

// ============ LIMPAR DADOS EXISTENTES (OPCIONAL) ============
sql += `-- PASSO 2: Limpar dados antigos (se houver)\n`;
sql += `DELETE FROM revenue_transactions WHERE id > 0;\n`;
sql += `DELETE FROM leads WHERE id > 0;\n`;
sql += `DELETE FROM tests WHERE id > 0;\n`;
sql += `DELETE FROM resellers WHERE id > 0;\n\n`;

// ============ REVENUE TRANSACTIONS ============
const revenues = db.prepare('SELECT * FROM revenue_transactions').all();
console.log(`Found ${revenues.length} revenue_transactions`);

sql += `-- PASSO 3: Inserir REVENUE TRANSACTIONS (${revenues.length})\n`;
for (const r of revenues) {
    sql += `INSERT INTO revenue_transactions (type, amount, date, "clientId", "clientName", "serverSnapshot", "costSnapshot", "monthsSnapshot", status, description, user_id) VALUES ('${escape(r.type)}', ${r.amount || 0}, '${escape(r.date)}', ${r.clientId || 0}, '${escape(r.clientName)}', '${escape(r.serverSnapshot || '')}', ${r.costSnapshot || 0}, ${r.monthsSnapshot || 1}, '${escape(r.status || 'committed')}', '${escape(r.description)}', '${USER_ID}');\n`;
}

// ============ LEADS ============
const leads = db.prepare('SELECT * FROM leads').all();
console.log(`Found ${leads.length} leads`);

sql += `\n-- PASSO 4: Inserir LEADS (${leads.length})\n`;
for (const l of leads) {
    sql += `INSERT INTO leads (nome, whatsapp, observacoes, status, source, category, contador_testes, "createdAt", user_id) VALUES ('${escape(l.nome)}', '${escape(l.whatsapp)}', '${escape(l.observacoes)}', '${escape(l.status)}', '${escape(l.source)}', '${escape(l.category)}', ${l.contador_testes || 0}, '${escape(l.createdAt)}', '${USER_ID}');\n`;
}

// ============ TESTS ============
const tests = db.prepare('SELECT * FROM tests').all();
console.log(`Found ${tests.length} tests`);

sql += `\n-- PASSO 5: Inserir TESTS (${tests.length})\n`;
for (const t of tests) {
    sql += `INSERT INTO tests ("clientName", whatsapp, server, status, notes, "startAt", "endAt", "durationHours", user_id) VALUES ('${escape(t.clientName)}', '${escape(t.whatsapp)}', '${escape(t.server)}', '${escape(t.status)}', '${escape(t.notes)}', '${escape(t.startAt)}', '${escape(t.endAt)}', ${t.durationHours || 24}, '${USER_ID}');\n`;
}

// ============ RESELLERS ============
const resellers = db.prepare('SELECT * FROM resellers').all();
console.log(`Found ${resellers.length} resellers`);

sql += `\n-- PASSO 6: Inserir RESELLERS (${resellers.length})\n`;
for (const r of resellers) {
    sql += `INSERT INTO resellers (nome, whatsapp, observacoes, status, credits, "creditCost", "createdAt", user_id) VALUES ('${escape(r.nome)}', '${escape(r.whatsapp)}', '${escape(r.observacoes)}', '${escape(r.status)}', ${r.credits || 0}, ${r.creditCost || 0}, '${escape(r.createdAt)}', '${USER_ID}');\n`;
}

// ============ REABILITAR RLS ============
sql += `\n-- PASSO 7: Reabilitar RLS em todas as tabelas\n`;
sql += `ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE leads ENABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE tests ENABLE ROW LEVEL SECURITY;\n`;
sql += `ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;\n\n`;

// ============ VERIFICAR ============
sql += `-- PASSO 8: Verificar dados\n`;
sql += `SELECT 'revenue_transactions' as tabela, COUNT(*) as total FROM revenue_transactions\n`;
sql += `UNION ALL SELECT 'leads', COUNT(*) FROM leads\n`;
sql += `UNION ALL SELECT 'tests', COUNT(*) FROM tests\n`;
sql += `UNION ALL SELECT 'resellers', COUNT(*) FROM resellers;\n`;

fs.writeFileSync('supabase_migration_final.sql', sql);
console.log('\n✅ SQL file created: supabase_migration_final.sql');
console.log(`Total: ${revenues.length + leads.length + tests.length + resellers.length} records`);

db.close();
