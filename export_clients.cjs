// Script para migrar clientes do SQLite para Supabase
const Database = require('better-sqlite3');
const fs = require('fs');

const USER_ID = 'cc51e332-4566-44fe-8301-23c44e21eb9e';
const db = new Database('cyberpunk-iptv.db');

// Get all clients
const clients = db.prepare('SELECT * FROM clients').all();
console.log(`Found ${clients.length} clients`);

// Generate INSERT statements
let sql = `-- Migration script: ${clients.length} clients\n`;
sql += `-- User ID: ${USER_ID}\n\n`;

for (const c of clients) {
    const values = {
        nome: c.nome || '',
        whatsapp: c.whatsapp || '',
        login: c.login || '',
        senha: c.senha || '',
        plano: c.plano || '',
        valor: c.valor || 0,
        ativacao: c.ativacao || '',
        vencimento: c.vencimento || '',
        formaPagamento: c.formaPagamento || '',
        statusPagamento: c.statusPagamento || 'Pendente',
        servidor: c.servidor || '',
        dispositivo: c.dispositivo || '',
        aplicativo: c.aplicativo || '',
        macAddress: c.macAddress || '',
        chaveDispositivo: c.chaveDispositivo || '',
        prospeccao: c.prospeccao || '',
        situacao: c.situacao || 'Ativo',
        observacoes: c.observacoes || '',
        user_id: USER_ID
    };

    const escape = (s) => String(s || '').replace(/'/g, "''");

    sql += `INSERT INTO clients (nome, whatsapp, login, senha, plano, valor, ativacao, vencimento, "formaPagamento", "statusPagamento", servidor, dispositivo, aplicativo, "macAddress", "chaveDispositivo", prospeccao, situacao, observacoes, user_id) VALUES ('${escape(values.nome)}', '${escape(values.whatsapp)}', '${escape(values.login)}', '${escape(values.senha)}', '${escape(values.plano)}', ${values.valor}, '${escape(values.ativacao)}', '${escape(values.vencimento)}', '${escape(values.formaPagamento)}', '${escape(values.statusPagamento)}', '${escape(values.servidor)}', '${escape(values.dispositivo)}', '${escape(values.aplicativo)}', '${escape(values.macAddress)}', '${escape(values.chaveDispositivo)}', '${escape(values.prospeccao)}', '${escape(values.situacao)}', '${escape(values.observacoes)}', '${values.user_id}');\n`;
}

fs.writeFileSync('supabase_clients_migration.sql', sql);
console.log('SQL file created: supabase_clients_migration.sql');

db.close();
