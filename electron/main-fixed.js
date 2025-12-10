import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

try {
  app.commandLine.appendSwitch('ignore-gpu-blacklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
} catch { }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3');

let mainWindow;
let db;

const documentsPath = path.join(app.getPath('documents'), 'CyberpunkIPTV');
const dbPath = path.join(documentsPath, 'cyberpunk-iptv.db');

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(documentsPath)) {
      try {
        fs.mkdirSync(documentsPath, { recursive: true });
      } catch (mkdirErr) {
        console.error('Erro ao criar diretório do banco de dados:', mkdirErr);
        reject(mkdirErr);
        return;
      }
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        reject(err);
        return;
      }

      console.log('Banco de dados SQLite conectado com sucesso!');
      console.log('Caminho do banco:', dbPath);

      db.run('PRAGMA journal_mode = WAL', (err1) => {
        if (err1) {
          console.warn('Aviso ao aplicar PRAGMA journal_mode:', err1);
        } else {
          db.run('PRAGMA synchronous = NORMAL', (err2) => {
            if (err2) {
              console.warn('Aviso ao aplicar PRAGMA synchronous:', err2);
            } else {
              db.run('PRAGMA temp_store = MEMORY', (err3) => {
                if (err3) {
                  console.warn('Aviso ao aplicar PRAGMA temp_store:', err3);
                } else {
                  db.run('PRAGMA foreign_keys = ON', (err4) => {
                    if (err4) {
                      console.warn('Aviso ao aplicar PRAGMA foreign_keys:', err4);
                    }
                  });
                }
              });
            }
          });
        }
      });

      const createTablesSQL = `
          CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            whatsapp TEXT,
            login TEXT,
            senha TEXT,
            plano TEXT,
            valor REAL,
            ativacao TEXT,
            vencimento TEXT,
            formaPagamento TEXT,
            statusPagamento TEXT,
            servidor TEXT,
            dispositivo TEXT,
            aplicativo TEXT,
            macAddress TEXT,
            chaveDispositivo TEXT,
            prospeccao TEXT,
            situacao TEXT,
            listaM3U TEXT,
            observacoes TEXT,
            archived INTEGER DEFAULT 0,
            deleted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            whatsapp TEXT,
            observacoes TEXT,
            status TEXT,
            source TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            contador_testes INTEGER DEFAULT 0,
            migratedFromClientId INTEGER,
            migratedAt DATETIME,
            originalExpiration TEXT,
            originalStatusPagamento TEXT,
            migrationReason TEXT,
            originalPlano TEXT,
            originalValor TEXT
          );

          CREATE TABLE IF NOT EXISTS revenue_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            clientName TEXT,
            amount REAL,
            type TEXT,
            date DATETIME,
            description TEXT,
            serverSnapshot TEXT,
            costSnapshot REAL,
            monthsSnapshot INTEGER,
            status TEXT DEFAULT 'committed',
            reversedAt DATETIME,
            refTransactionId INTEGER,
            FOREIGN KEY (clientId) REFERENCES clients(id)
          );

          CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientName TEXT,
            whatsapp TEXT,
            plano TEXT,
            server TEXT,
            durationHours INTEGER,
            startAt DATETIME,
            endAt DATETIME,
            endDate TEXT,
            notes TEXT,
            status TEXT,
            convertedToClient INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS resellers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            whatsapp TEXT,
            servidor TEXT,
            buyPrice REAL,
            sellPrice REAL,
            totalSales REAL DEFAULT 0,
            status TEXT DEFAULT 'Ativo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS system_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            type TEXT,
            clientId INTEGER,
            clientName TEXT,
            leadId INTEGER,
            leadName TEXT,
            testId INTEGER,
            testPhone TEXT,
            reason TEXT,
            originalClient TEXT,
            originalTest TEXT,
            FOREIGN KEY (clientId) REFERENCES clients(id),
            FOREIGN KEY (leadId) REFERENCES leads(id)
          );

          CREATE TABLE IF NOT EXISTS planos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            meses INTEGER NOT NULL,
            preco REAL NOT NULL,
            ativo BOOLEAN DEFAULT 1
          );

          CREATE TABLE IF NOT EXISTS servidores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            custo REAL NOT NULL,
            valorCredito REAL DEFAULT 0,
            ativo BOOLEAN DEFAULT 1
          );

          CREATE TABLE IF NOT EXISTS formas_pagamento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ativo BOOLEAN DEFAULT 1
          );

          CREATE TABLE IF NOT EXISTS dispositivos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ativo BOOLEAN DEFAULT 1
          );

          CREATE TABLE IF NOT EXISTS aplicativos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ativo BOOLEAN DEFAULT 1
          );

          CREATE TABLE IF NOT EXISTS fontes_lead (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            ativo BOOLEAN DEFAULT 1
          );
        `;

      db.exec(createTablesSQL, (err) => {
        if (err) {
          console.error('Erro ao criar tabelas:', err);
          reject(err);
        } else {
          console.log('Banco de dados SQLite inicializado com sucesso!');

          const createIndexesSQL = `
              CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
              CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt);
              CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_transactions(date);
              CREATE INDEX IF NOT EXISTS idx_tests_startAt ON tests(startAt);
              CREATE INDEX IF NOT EXISTS idx_resellers_created_at ON resellers(created_at);
              CREATE INDEX IF NOT EXISTS idx_planos_nome ON planos(nome);
              CREATE INDEX IF NOT EXISTS idx_servidores_nome ON servidores(nome);
              CREATE INDEX IF NOT EXISTS idx_formas_pagamento_nome ON formas_pagamento(nome);
              CREATE INDEX IF NOT EXISTS idx_dispositivos_nome ON dispositivos(nome);
              CREATE INDEX IF NOT EXISTS idx_aplicativos_nome ON aplicativos(nome);
              CREATE INDEX IF NOT EXISTS idx_fontes_lead_nome ON fontes_lead(nome);
            `;

          db.exec(createIndexesSQL, (idxErr) => {
            if (idxErr) {
              console.warn('Aviso ao criar índices:', idxErr);
            }

            const migrateClients = () => new Promise((resolveM) => {
              db.all('PRAGMA table_info(clients)', (piErr, rows) => {
                if (piErr) { resolveM(); return; }
                const existing = new Set(rows.map(r => r.name));
                const addColumn = (col, type) => new Promise(res => { db.run(`ALTER TABLE clients ADD COLUMN ${col} ${type}`, function () { res(); }); });
                const tasks = [];
                if (!existing.has('login')) tasks.push(addColumn('login', 'TEXT'));
                if (!existing.has('senha')) tasks.push(addColumn('senha', 'TEXT'));
                if (!existing.has('plano')) tasks.push(addColumn('plano', 'TEXT'));
                if (!existing.has('valor')) tasks.push(addColumn('valor', 'REAL'));
                if (!existing.has('ativacao')) tasks.push(addColumn('ativacao', 'TEXT'));
                if (!existing.has('vencimento')) tasks.push(addColumn('vencimento', 'TEXT'));
                if (!existing.has('formaPagamento')) tasks.push(addColumn('formaPagamento', 'TEXT'));
                if (!existing.has('statusPagamento')) tasks.push(addColumn('statusPagamento', 'TEXT'));
                if (!existing.has('servidor')) tasks.push(addColumn('servidor', 'TEXT'));
                if (!existing.has('dispositivo')) tasks.push(addColumn('dispositivo', 'TEXT'));
                if (!existing.has('aplicativo')) tasks.push(addColumn('aplicativo', 'TEXT'));
                if (!existing.has('macAddress')) tasks.push(addColumn('macAddress', 'TEXT'));
                if (!existing.has('chaveDispositivo')) tasks.push(addColumn('chaveDispositivo', 'TEXT'));
                if (!existing.has('prospeccao')) tasks.push(addColumn('prospeccao', 'TEXT'));
                if (!existing.has('situacao')) tasks.push(addColumn('situacao', 'TEXT'));
                if (!existing.has('listaM3U')) tasks.push(addColumn('listaM3U', 'TEXT'));
                if (!existing.has('observacoes')) tasks.push(addColumn('observacoes', 'TEXT'));
                if (!existing.has('dataPagamento')) tasks.push(addColumn('dataPagamento', 'TEXT'));
                if (!existing.has('archived')) tasks.push(addColumn('archived', 'INTEGER DEFAULT 0'));
                if (!existing.has('deleted_at')) tasks.push(addColumn('deleted_at', 'DATETIME'));
                Promise.all(tasks).then(() => resolveM());
              });
            });

            const migrateRevenue = () => new Promise((resolveM) => {
              db.all('PRAGMA table_info(revenue_transactions)', (rtErr, rtRows) => {
                if (rtErr) { resolveM(); return; }
                const existingRT = new Set(rtRows.map(r => r.name));
                const tasksRT = [];
                if (!existingRT.has('status')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN status TEXT DEFAULT \'committed\'', function () { res(); })));
                if (!existingRT.has('reversedAt')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN reversedAt DATETIME', function () { res(); })));
                if (!existingRT.has('refTransactionId')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN refTransactionId INTEGER', function () { res(); })));
                if (!existingRT.has('serverSnapshot')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN serverSnapshot TEXT', function () { res(); })));
                if (!existingRT.has('costSnapshot')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN costSnapshot REAL DEFAULT 0', function () { res(); })));
                if (!existingRT.has('monthsSnapshot')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN monthsSnapshot INTEGER DEFAULT 1', function () { res(); })));
                Promise.all(tasksRT).then(() => resolveM());
              });
            });

            const migrateResellers = () => new Promise((resolveM) => {
              db.all('PRAGMA table_info(resellers)', (piErr2, rows2) => {
                if (piErr2) { resolveM(); return; }
                const existing2 = new Set(rows2.map(r => r.name));
                const tasks2 = [];
                if (!existing2.has('servidor')) tasks2.push(new Promise(res => db.run('ALTER TABLE resellers ADD COLUMN servidor TEXT', function () { res(); })));
                Promise.all(tasks2).then(() => resolveM());
              });
            });

            const migrateLeads = () => new Promise((resolveM) => {
              db.all('PRAGMA table_info(leads)', (leErr, leRows) => {
                if (leErr) { resolveM(); return; }
                const existingLeads = new Set(leRows.map(r => r.name));
                const tasksLeads = [];
                if (!existingLeads.has('fromMigration')) tasksLeads.push(new Promise(res => db.run('ALTER TABLE leads ADD COLUMN fromMigration INTEGER DEFAULT 0', function () { res(); })));
                Promise.all(tasksLeads).then(() => resolveM());
              });
            });

            const migrateServidores = () => new Promise((resolveM) => {
              db.all('PRAGMA table_info(servidores)', (piErr3, rows3) => {
                if (piErr3) { resolveM(); return; }
                const existing3 = new Set(rows3.map(r => r.name));
                const tasks3 = [];
                if (!existing3.has('valorCredito')) tasks3.push(new Promise(res => db.run('ALTER TABLE servidores ADD COLUMN valorCredito REAL DEFAULT 0', function () { res(); })));
                Promise.all(tasks3).then(() => resolveM());
              });
            });

            const seedDefaults = () => new Promise((resolveSeed) => {
              db.get('SELECT COUNT(1) as c FROM planos', (e1, r1) => {
                const seedPlanos = (cb) => {
                  const defaults = [
                    { nome: 'MENSAL', meses: 1, preco: 30, ativo: 1 },
                    { nome: 'TRIMESTRAL', meses: 3, preco: 90, ativo: 1 },
                    { nome: 'SEMESTRAL', meses: 6, preco: 180, ativo: 1 },
                    { nome: 'ANUAL', meses: 12, preco: 360, ativo: 1 }
                  ];
                  const stmt = db.prepare('INSERT INTO planos (nome, meses, preco, ativo) VALUES (?, ?, ?, ?)');
                  let i = 0;
                  defaults.forEach(p => stmt.run(p.nome, p.meses, p.preco, p.ativo, () => { i++; if (i === defaults.length) { stmt.finalize(); cb(); } }));
                };
                const next1 = () => db.get('SELECT COUNT(1) as c FROM servidores', (e2, r2) => {
                  const seedServidores = (cb) => {
                    const defaults = [
                      { nome: 'BLAZE', custo: 4.0, valorCredito: 4.0, ativo: 1 },
                      { nome: 'NEWTVS', custo: 6.5, valorCredito: 6.5, ativo: 1 },
                      { nome: 'MEGGA', custo: 4.0, valorCredito: 4.0, ativo: 1 },
                      { nome: 'P2PNEWTVS', custo: 6.5, valorCredito: 6.5, ativo: 1 }
                    ];
                    const stmt = db.prepare('INSERT INTO servidores (nome, custo, valorCredito, ativo) VALUES (?, ?, ?, ?)');
                    let i = 0;
                    defaults.forEach(s => stmt.run(s.nome, s.custo, s.valorCredito, s.ativo, () => { i++; if (i === defaults.length) { stmt.finalize(); cb(); } }));
                  };
                  const next2 = () => db.get('SELECT COUNT(1) as c FROM formas_pagamento', (e3, r3) => {
                    const seedFormas = (cb) => {
                      const defaults = [
                        { nome: 'PIX', ativo: 1 },
                        { nome: 'Dinheiro', ativo: 1 },
                        { nome: 'Mercado Pago', ativo: 1 },
                        { nome: 'Cartão de Crédito', ativo: 1 }
                      ];
                      const stmt = db.prepare('INSERT INTO formas_pagamento (nome, ativo) VALUES (?, ?)');
                      let i = 0;
                      defaults.forEach(f => stmt.run(f.nome, f.ativo, () => { i++; if (i === defaults.length) { stmt.finalize(); cb(); } }));
                    };
                    const next3 = () => db.get('SELECT COUNT(1) as c FROM dispositivos', (e4, r4) => {
                      const seedDispositivos = (cb) => {
                        const defaults = [
                          { nome: 'TV Box', ativo: 1 },
                          { nome: 'Celular', ativo: 1 },
                          { nome: 'Computador', ativo: 1 },
                          { nome: 'Smart TV LG', ativo: 1 },
                          { nome: 'Smart TV Samsung', ativo: 1 },
                          { nome: 'Smart TV Philco', ativo: 1 },
                          { nome: 'Smart TV Multilazer', ativo: 1 },
                          { nome: 'Smart TV TLC', ativo: 1 }
                        ];
                        const stmt = db.prepare('INSERT INTO dispositivos (nome, ativo) VALUES (?, ?)');
                        let i = 0;
                        defaults.forEach(d => stmt.run(d.nome, d.ativo, () => { i++; if (i === defaults.length) { stmt.finalize(); cb(); } }));
                      };
                      const next4 = () => db.get('SELECT COUNT(1) as c FROM aplicativos', (e5, r5) => {
                        const seedAplicativos = (cb) => {
                          const defaults = [
                            { nome: 'IPTV Smarters', ativo: 1 },
                            { nome: 'XCIPTV', ativo: 1 },
                            { nome: 'IBO BLAZE', ativo: 1 },
                            { nome: 'LAZER PLAYER', ativo: 1 },
                            { nome: 'NEW TVS', ativo: 1 },
                            { nome: 'PRIME IPTV', ativo: 1 },
                            { nome: 'XCLOUD', ativo: 1 },
                            { nome: 'BLAZE MAX', ativo: 1 },
                            { nome: 'IBO PRO PLAYER', ativo: 1 },
                            { nome: 'IBO PLAYER', ativo: 1 },
                            { nome: 'MEGGA', ativo: 1 },
                            { nome: 'FUNPLAY', ativo: 1 },
                            { nome: 'PLAYSIM', ativo: 1 }
                          ];
                          const stmt = db.prepare('INSERT INTO aplicativos (nome, ativo) VALUES (?, ?)');
                          let i = 0;
                          defaults.forEach(a => stmt.run(a.nome, a.ativo, () => { i++; if (i === defaults.length) { stmt.finalize(); cb(); } }));
                        };
                        const next5 = () => db.get('SELECT COUNT(1) as c FROM fontes_lead', (e6, r6) => {
                          const seedFontes = (cb) => {
                            const defaults = [
                              { nome: 'Redes Sociais', ativo: 1 },
                              { nome: 'Indicação', ativo: 1 },
                              { nome: 'WhatsApp', ativo: 1 },
                              { nome: 'YouTube', ativo: 1 },
                              { nome: 'Outros', ativo: 1 },
                              { nome: 'Direto', ativo: 1 }
                            ];
                            const stmt = db.prepare('INSERT INTO fontes_lead (nome, ativo) VALUES (?, ?)');
                            let i = 0;
                            defaults.forEach(f => stmt.run(f.nome, f.ativo, () => { i++; if (i === defaults.length) { stmt.finalize(); cb(); } }));
                          };
                          const finish = () => resolveSeed();
                          if (!e6 && r6 && r6.c === 0) seedFontes(finish); else finish();
                        });
                        if (!e5 && r5 && r5.c === 0) seedAplicativos(next5); else next5();
                      });
                      if (!e4 && r4 && r4.c === 0) seedDispositivos(next4); else next4();
                    });
                    if (!e3 && r3 && r3.c === 0) seedFormas(next3); else next3();
                  });
                  if (!e2 && r2 && r2.c === 0) seedServidores(next2); else next2();
                });
                if (!e1 && r1 && r1.c === 0) seedPlanos(next1); else next1();
              });
            });

            migrateClients()
              .then(migrateRevenue)
              .then(migrateResellers)
              .then(migrateServidores)
              .then(migrateLeads)
              .then(seedDefaults)
              .then(() => resolve());
          });
        }
      });
    });
  });
}

function setupIpcHandlers() {
  ipcMain.handle('db-get-clients', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM clients WHERE (archived IS NULL OR archived = 0) ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar clientes:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-client', async (event, client) => {
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
          db.run('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)', [new Date().toISOString(), 'client_added', this.lastID, client.nome, 'Cadastro de novo cliente'], (logErr) => {
            if (logErr) console.error('Erro ao registrar log de cliente adicionado:', logErr);
          });
          resolve({ id: this.lastID, ...client });
        }
      });
    });
  });

  ipcMain.handle('db-update-client', async (event, client) => {
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
  });

  ipcMain.handle('db-delete-client', async (event, id) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('UPDATE clients SET archived = 1, situacao = ?, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['Inativo', id], function (clErr) {
          if (clErr) {
            db.run('ROLLBACK');
            reject(clErr);
          } else {
            db.run('INSERT INTO system_log (date, type, clientId, reason) VALUES (?, ?, ?, ?)', [new Date().toISOString(), 'client_archived', id, 'Cliente marcado como arquivado (soft delete)'], (logErr) => {
              if (logErr) {
                console.error('Erro ao registrar log de arquivamento:', logErr);
              }
              db.run('COMMIT');
              resolve(true);
            });
          }
        });
      });
    });
  });

  ipcMain.handle('db-get-leads', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM leads ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar leads:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-lead', async (event, lead) => {
    return new Promise((resolve, reject) => {
      try {
        const normalize = (v) => String(v || '').replace(/\D+/g, '');
        const incomingPhone = normalize(lead.whatsapp || '');
        db.all('SELECT id, whatsapp FROM leads', (selErr, rows) => {
          if (selErr) {
            console.error('Erro ao verificar duplicidade de lead:', selErr);
            reject(selErr);
            return;
          }
          const dup = rows.find(r => incomingPhone && normalize(r.whatsapp || '') === incomingPhone);
          if (dup) {
            db.get('SELECT * FROM leads WHERE id = ?', [dup.id], (getErr, row) => {
              if (getErr) {
                reject(getErr);
              } else {
                resolve(row);
              }
            });
            return;
          }

          const sql = `
            INSERT INTO leads (nome, whatsapp, observacoes, status, source, category, contador_testes, fromMigration, migratedFromClientId, migratedAt, originalExpiration, originalStatusPagamento, migrationReason, originalPlano, originalValor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params = [
            lead.nome,
            lead.whatsapp || null,
            lead.observacoes || null,
            lead.status || 'Novo',
            lead.source || 'Manual',
            lead.category || 'new',
            lead.contador_testes || 0,
            lead.fromMigration ? 1 : 0,
            lead.migratedFromClientId || null,
            lead.migratedAt || null,
            lead.originalExpiration || null,
            lead.originalStatusPagamento || null,
            lead.migrationReason || null,
            lead.originalPlano || null,
            lead.originalValor || null
          ];
          db.run(sql, params, function (err) {
            if (err) {
              console.error('Erro ao adicionar lead:', err);
              reject(err);
            } else {
              resolve({ id: this.lastID, ...lead });
            }
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  });

  ipcMain.handle('db-update-lead', async (event, lead) => {
    return new Promise((resolve, reject) => {
      try {
        const normalize = (v) => String(v || '').replace(/\D+/g, '');
        const incomingPhone = normalize(lead.whatsapp || '');
        db.all('SELECT id, whatsapp FROM leads', (selErr, rows) => {
          if (selErr) {
            reject(selErr);
            return;
          }
          const dup = rows.find(r => r.id !== lead.id && incomingPhone && normalize(r.whatsapp || '') === incomingPhone);
          if (dup) {
            reject(new Error('WhatsApp já cadastrado em outro lead'));
            return;
          }
          const sql = `
            UPDATE leads SET 
              nome = ?, whatsapp = ?, observacoes = ?, status = ?, source = ?, 
              category = ?, contador_testes = ?, fromMigration = ?, migratedFromClientId = ?, migratedAt = ?, originalExpiration = ?, originalStatusPagamento = ?, migrationReason = ?, originalPlano = ?, originalValor = ?
            WHERE id = ?
          `;
          const params = [
            lead.nome,
            lead.whatsapp || null,
            lead.observacoes || null,
            lead.status || 'Novo',
            lead.source || 'Manual',
            lead.category || 'new',
            lead.contador_testes || 0,
            lead.fromMigration ? 1 : 0,
            lead.migratedFromClientId || null,
            lead.migratedAt || null,
            lead.originalExpiration || null,
            lead.originalStatusPagamento || null,
            lead.migrationReason || null,
            lead.originalPlano || null,
            lead.originalValor || null,
            lead.id
          ];
          db.run(sql, params, function (err) {
            if (err) {
              console.error('Erro ao atualizar lead:', err);
              reject(err);
            } else {
              resolve(lead);
            }
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  });

  ipcMain.handle('db-delete-lead', async (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM leads WHERE id = ?', [id], function (err) {
        if (err) {
          console.error('Erro ao deletar lead:', err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });

  ipcMain.handle('db-get-revenue-transactions', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM revenue_transactions ORDER BY date DESC', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar transações:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-revenue-transaction', async (event, transaction) => {
    return new Promise((resolve, reject) => {
      const hasStatus = transaction && typeof transaction.status === 'string';
      db.get('SELECT * FROM clients WHERE id = ?', [transaction.clientId], (selErr, clientRow) => {
        if (selErr) { reject(selErr); return; }

        const clientServer = clientRow ? (clientRow.servidor || '') : '';
        const clientPlan = clientRow ? (clientRow.plano || '') : '';

        // Case-insensitive lookup for server cost
        db.get('SELECT custo FROM servidores WHERE TRIM(UPPER(nome)) = TRIM(UPPER(?))', [clientServer], (srvErr, srvRow) => {
          if (srvErr) console.error('Erro ao buscar custo do servidor:', srvErr);
          if (!srvRow) console.warn(`[db] Aviso: Servidor '${clientServer}' não encontrado ou sem custo definido. Custo será 0.`);

          const baseCost = srvErr ? 0 : Number((srvRow && srvRow.custo) || 0);

          // Case-insensitive lookup for plan months
          db.get('SELECT meses FROM planos WHERE TRIM(UPPER(nome)) = TRIM(UPPER(?))', [clientPlan], (plErr, plRow) => {
            if (plErr) console.error('Erro ao buscar meses do plano:', plErr);
            if (!plRow) console.warn(`[db] Aviso: Plano '${clientPlan}' não encontrado. Meses será 1.`);

            const months = plErr ? 1 : Number((plRow && plRow.meses) || 1) || 1;
            const costSnapshot = baseCost * months;

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

            db.run(sql, params, function (err) {
              if (err) {
                console.error('Erro ao adicionar transação:', err);
                reject(err);
              } else {
                console.log(`[db] Transação inserida: id=${this.lastID}, clientId=${transaction.clientId}, tipo=${transaction.type}, valor=${transaction.amount}, custo=${costSnapshot} (Server: ${clientServer} [${baseCost}], Plan: ${clientPlan} [${months}m])`);
                db.run('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)', [new Date().toISOString(), 'revenue_added', transaction.clientId || null, transaction.clientName || null, `Transação ${transaction.type} criada`], (logErr) => {
                  if (logErr) console.error('Erro ao registrar log de transação:', logErr);
                });
                resolve({ id: this.lastID, ...transaction, serverSnapshot: clientServer, costSnapshot, monthsSnapshot: months });
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-confirm-payment', async (event, payload) => {
    const { clientId, paymentDate } = payload || {};
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.get('SELECT * FROM clients WHERE id = ?', [clientId], (selErr, clientRow) => {
          if (selErr || !clientRow) {
            db.run('ROLLBACK');
            reject(selErr || new Error('Cliente não encontrado'));
            return;
          }
          const updateSql = 'UPDATE clients SET statusPagamento = ?, updated_at = CURRENT_TIMESTAMP, dataPagamento = ? WHERE id = ?';
          db.run(updateSql, ['Pago', paymentDate || new Date().toISOString().split('T')[0], clientId], (updErr) => {
            if (updErr) {
              db.run('ROLLBACK');
              reject(updErr);
              return;
            }
            db.get('SELECT id FROM revenue_transactions WHERE clientId = ? AND type = ? AND status = ? ORDER BY date DESC LIMIT 1', [clientRow.id, 'renewal', 'pending'], (rtSelErr, pendingRow) => {
              if (rtSelErr) {
                db.run('ROLLBACK');
                reject(rtSelErr);
                return;
              }
              const nowDate = paymentDate || new Date().toISOString();
              const commitPending = pendingRow ? 'UPDATE revenue_transactions SET status = ?, date = ?, description = ? WHERE id = ?' : 'INSERT INTO revenue_transactions (clientId, clientName, amount, type, date, description, serverSnapshot, costSnapshot, monthsSnapshot, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
              if (pendingRow) {
                db.run(commitPending, ['committed', nowDate, 'Pagamento confirmado - Renovação', pendingRow.id], (updRtErr) => {
                  if (updRtErr) {
                    db.run('ROLLBACK');
                    reject(updRtErr);
                    return;
                  }
                  const logSql = 'INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)';
                  db.run(logSql, [new Date().toISOString(), 'payment_confirmed', clientRow.id, clientRow.nome, 'Confirmação de pagamento'], (logErr) => {
                    if (logErr) {
                      db.run('ROLLBACK');
                      reject(logErr);
                    } else {
                      db.run('COMMIT');
                      resolve(true);
                    }
                  });
                });
              } else {
                const desc = 'Pagamento confirmado - Renovação';
                db.get('SELECT custo FROM servidores WHERE nome = ?', [clientRow.servidor || null], (srvErr, srvRow) => {
                  const baseCost = srvErr ? 0 : Number((srvRow && srvRow.custo) || 0);
                  db.get('SELECT meses FROM planos WHERE nome = ?', [clientRow.plano || ''], (plErr, plRow) => {
                    const months = plErr ? 1 : Number((plRow && plRow.meses) || 1) || 1;
                    const costSnapshot = baseCost * months;
                    db.run(commitPending, [clientRow.id, clientRow.nome, clientRow.valor || 0, 'renewal', nowDate, desc, clientRow.servidor || null, costSnapshot, months, 'committed'], function (revErr) {
                      if (revErr) {
                        db.run('ROLLBACK');
                        reject(revErr);
                        return;
                      }
                      const logSql = 'INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)';
                      db.run(logSql, [new Date().toISOString(), 'payment_confirmed', clientRow.id, clientRow.nome, 'Confirmação de pagamento'], (logErr) => {
                        if (logErr) {
                          db.run('ROLLBACK');
                          reject(logErr);
                        } else {
                          db.run('COMMIT');
                          resolve(true);
                        }
                      });
                    });
                  });
                });
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-revert-revenue-transaction', async (event, { transactionId, reason }) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const now = new Date().toISOString();
        db.run('UPDATE revenue_transactions SET status = ?, reversedAt = ? WHERE id = ?', ['reverted', now, transactionId], (updErr) => {
          if (updErr) {
            db.run('ROLLBACK');
            reject(updErr);
            return;
          }
          db.get('SELECT * FROM revenue_transactions WHERE id = ?', [transactionId], (selErr, row) => {
            if (selErr || !row) {
              db.run('ROLLBACK');
              reject(selErr || new Error('Transação não encontrada'));
              return;
            }
            db.run('INSERT INTO system_log (date, type, clientId, clientName, reason) VALUES (?, ?, ?, ?, ?)', [now, 'transaction_reverted', row.clientId, row.clientName, reason || 'Reversão de transação'], (logErr) => {
              if (logErr) {
                db.run('ROLLBACK');
                reject(logErr);
              } else {
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('generate-clients-pdf', async () => {
    return new Promise((resolve, reject) => {
      try {
        db.all('SELECT * FROM clients ORDER BY nome', async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório de Clientes</title>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            body { font-family: Arial, sans-serif; padding: 8px; }
            h1 { margin-bottom: 8px; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; box-sizing: border-box; }
            th, td { border: 1px solid #ccc; padding: 4px; font-size: 9px; vertical-align: top; box-sizing: border-box; }
            th { background: #f0f0f0; }
            th, td { word-break: break-word; overflow-wrap: anywhere; white-space: normal; }
            thead th:nth-child(1) { width: 14%; }
            thead th:nth-child(2) { width: 12%; }
            thead th:nth-child(3) { width: 10%; }
            thead th:nth-child(4) { width: 10%; }
            thead th:nth-child(5) { width: 12%; }
            thead th:nth-child(6) { width: 12%; }
            thead th:nth-child(7) { width: 12%; }
            thead th:nth-child(8) { width: 18%; }
            thead th:nth-child(9) { width: 8%; }
            thead th:nth-child(10) { width: 5%; }
            thead th:nth-child(11) { width: 6%; }
            thead th:nth-child(12) { width: 6%; }
            thead th:nth-child(13) { width: 6%; }
            thead th:nth-child(14) { width: 7%; }
            thead th:nth-child(15) { width: 5%; }
            thead th:nth-child(16) { width: 4%; }
            .muted { color: #666; }
          </style>
          </head><body>
          <h1>Relatório de Clientes</h1>
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>WhatsApp</th><th>Login</th><th>Senha</th><th>Plano/Valor</th><th>Ativ./Venc.</th><th>Pagamento</th><th>Conexão</th><th>Situação</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `<tr>
                <td>${r.nome || ''}</td>
                <td>${r.whatsapp || ''}</td>
                <td>${r.login || ''}</td>
                <td>${(r.senha ?? '').toString().trim() || 'Não informado'}</td>
                <td>
                  ${r.plano || ''}
                  <div class="muted">R$ ${typeof r.valor === 'number' ? r.valor.toFixed(2) : (r.valor || '')}</div>
                </td>
                <td>
                  ${r.ativacao || ''}
                  <div class="muted">${r.vencimento || ''}</div>
                </td>
                <td>
                  ${r.formaPagamento || ''}
                  <div class="muted">${r.statusPagamento || ''}</div>
                </td>
                <td>
                  <div><strong>Serv.:</strong> ${r.servidor || ''}</div>
                  <div><strong>Disp.:</strong> ${r.dispositivo || ''}</div>
                  <div><strong>Aplic.:</strong> ${r.aplicativo || ''}</div>
                  <div><strong>MAC:</strong> ${r.macAddress || ''}</div>
                  <div><strong>Chave:</strong> ${(r.chaveDispositivo ?? '').toString().trim() || 'Não informado'}</div>
                </td>
                <td>${r.situacao || ''}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          </body></html>`;

          const win = new BrowserWindow({ show: false });
          win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
          win.webContents.on('did-finish-load', async () => {
            try {
              const hasPrintToPDF = typeof win.webContents.printToPDF === 'function';
              if (hasPrintToPDF) {
                const pdfData = await win.webContents.printToPDF({
                  marginsType: 0,
                  printBackground: true,
                  pageSize: 'A4',
                  landscape: true
                });
                const outDir = path.join(app.getPath('documents'), 'CyberpunkIPTV');
                try { if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true }); } catch { }
                const outPath = path.join(outDir, `Relatorio_Clientes_${Date.now()}.pdf`);
                fs.writeFileSync(outPath, pdfData);
                try { win.destroy(); } catch { }
                resolve(outPath);
              } else {
                try { win.show(); } catch { }
                setTimeout(() => {
                  win.webContents.print({ silent: false, printBackground: true }, (success) => {
                    try { win.destroy(); } catch { }
                    if (success) resolve('PRINT_DIALOG'); else reject(new Error('Falha ao imprimir'));
                  });
                }, 200);
              }
            } catch (e) {
              try { win.destroy(); } catch { }
              reject(e);
            }
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  });

  ipcMain.handle('db-clear-revenue-transactions', async () => {
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
  });

  ipcMain.handle('db-get-tests', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM tests ORDER BY startAt DESC', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar testes:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-test', async (event, test) => {
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
          resolve({ id: this.lastID, ...test });
        }
      });
    });
  });

  ipcMain.handle('db-update-test', async (event, test) => {
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
  });

  ipcMain.handle('db-delete-test', async (event, id) => {
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
  });

  ipcMain.handle('db-get-resellers', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM resellers ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar revendedores:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-reseller', async (event, reseller) => {
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
          resolve({ id: this.lastID, ...reseller });
        }
      });
    });
  });

  ipcMain.handle('db-update-reseller', async (event, reseller) => {
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
  });

  ipcMain.handle('db-delete-reseller', async (event, id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM resellers WHERE id = ?', [id], function (err) {
        if (err) {
          console.error('Erro ao deletar revendedor:', err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  });

  ipcMain.handle('db-get-system-log', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM system_log ORDER BY date DESC LIMIT 100', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar log do sistema:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-add-system-log', async (event, logEntry) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO system_log (date, type, clientId, clientName, leadId, leadName, testId, testPhone, reason, originalClient, originalTest)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        logEntry.date || new Date().toISOString(),
        logEntry.type || 'system',
        logEntry.clientId || null,
        logEntry.clientName || null,
        logEntry.leadId || null,
        logEntry.leadName || null,
        logEntry.testId || null,
        logEntry.testPhone || null,
        logEntry.reason || null,
        logEntry.originalClient || null,
        logEntry.originalTest || null
      ];

      db.run(sql, params, function (err) {
        if (err) {
          console.error('Erro ao adicionar log do sistema:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, ...logEntry });
        }
      });
    });
  });

  ipcMain.handle('db-clear-all-data', async () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM revenue_transactions', (rtErr) => {
          if (rtErr) {
            db.run('ROLLBACK');
            reject(rtErr);
            return;
          }
          db.run('DELETE FROM system_log', (slErr) => {
            if (slErr) {
              db.run('ROLLBACK');
              reject(slErr);
              return;
            }
            db.run('DELETE FROM tests', (tErr) => {
              if (tErr) {
                db.run('ROLLBACK');
                reject(tErr);
                return;
              }
              db.run('DELETE FROM resellers', (rErr) => {
                if (rErr) {
                  db.run('ROLLBACK');
                  reject(rErr);
                  return;
                }
                db.run('DELETE FROM leads', (lErr) => {
                  if (lErr) {
                    db.run('ROLLBACK');
                    reject(lErr);
                    return;
                  }
                  db.run('DELETE FROM clients', (cErr) => {
                    if (cErr) {
                      db.run('ROLLBACK');
                      reject(cErr);
                    } else {
                      db.run('COMMIT');
                      resolve(true);
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-get-planos', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM planos ORDER BY nome', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar planos:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-save-planos', async (event, planos) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM planos', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const stmt = db.prepare('INSERT INTO planos (nome, meses, preco, ativo) VALUES (?, ?, ?, ?)');
          let completed = 0;
          const total = planos.length;

          if (total === 0) {
            db.run('COMMIT');
            resolve(true);
            return;
          }

          planos.forEach(plano => {
            stmt.run(plano.nome, plano.meses, plano.preco, plano.ativo ? 1 : 0, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                stmt.finalize();
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-get-servidores', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM servidores ORDER BY nome', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar servidores:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-save-servidores', async (event, servidores) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM servidores', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const stmt = db.prepare('INSERT INTO servidores (nome, custo, valorCredito, ativo) VALUES (?, ?, ?, ?)');
          let completed = 0;
          const total = servidores.length;

          if (total === 0) {
            db.run('COMMIT');
            resolve(true);
            return;
          }

          servidores.forEach(servidor => {
            stmt.run(servidor.nome, servidor.custo, servidor.valorCredito ?? 0, servidor.ativo ? 1 : 0, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                stmt.finalize();
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-get-formas-pagamento', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM formas_pagamento ORDER BY nome', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar formas de pagamento:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-save-formas-pagamento', async (event, formas) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM formas_pagamento', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const stmt = db.prepare('INSERT INTO formas_pagamento (nome, ativo) VALUES (?, ?)');
          let completed = 0;
          const total = formas.length;

          if (total === 0) {
            db.run('COMMIT');
            resolve(true);
            return;
          }

          formas.forEach(forma => {
            stmt.run(forma.nome, forma.ativo ? 1 : 0, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                stmt.finalize();
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-get-dispositivos', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM dispositivos ORDER BY nome', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar dispositivos:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-save-dispositivos', async (event, dispositivos) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM dispositivos', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const stmt = db.prepare('INSERT INTO dispositivos (nome, ativo) VALUES (?, ?)');
          let completed = 0;
          const total = dispositivos.length;

          if (total === 0) {
            db.run('COMMIT');
            resolve(true);
            return;
          }

          dispositivos.forEach(dispositivo => {
            stmt.run(dispositivo.nome, dispositivo.ativo ? 1 : 0, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                stmt.finalize();
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-get-aplicativos', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM aplicativos ORDER BY nome', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar aplicativos:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-save-aplicativos', async (event, aplicativos) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM aplicativos', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const stmt = db.prepare('INSERT INTO aplicativos (nome, ativo) VALUES (?, ?)');
          let completed = 0;
          const total = aplicativos.length;

          if (total === 0) {
            db.run('COMMIT');
            resolve(true);
            return;
          }

          aplicativos.forEach(aplicativo => {
            stmt.run(aplicativo.nome, aplicativo.ativo ? 1 : 0, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                stmt.finalize();
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });

  ipcMain.handle('db-get-fontes-lead', async () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM fontes_lead ORDER BY nome', (err, rows) => {
        if (err) {
          console.error('Erro ao buscar fontes de lead:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.handle('db-save-fontes-lead', async (event, fontes) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run('DELETE FROM fontes_lead', (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const stmt = db.prepare('INSERT INTO fontes_lead (nome, ativo) VALUES (?, ?)');
          let completed = 0;
          const total = fontes.length;

          if (total === 0) {
            db.run('COMMIT');
            resolve(true);
            return;
          }

          fontes.forEach(fonte => {
            stmt.run(fonte.nome, fonte.ativo ? 1 : 0, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                stmt.finalize();
                db.run('COMMIT');
                resolve(true);
              }
            });
          });
        });
      });
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0a',
    show: true
  });

  try {
    const ses = session.defaultSession;
    ses.clearCache();
    ses.clearStorageData({ storages: ['appcache', 'serviceworkers', 'caches'] });
  } catch { }

  const isDev = !app.isPackaged;
  if (isDev) {
    const devPort = 5175;
    mainWindow.loadURL(`http://localhost:${devPort}/`);
    mainWindow.webContents.openDevTools();
    mainWindow.webContents.on('did-finish-load', () => {
      try { mainWindow.show(); } catch { }
    });
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      console.error('Falha ao carregar renderer:', { errorCode, errorDescription, validatedURL });
      setTimeout(() => {
        try {
          mainWindow.loadURL(`http://localhost:${devPort}/`);
        } catch {
          try { mainWindow.webContents.reloadIgnoringCache(); } catch { }
        }
      }, 1000);
    });
    mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
      const lvl = ['LOG', 'WARN', 'ERROR'][level] || 'LOG';
      console.log(`[renderer:${lvl}] ${message} (${sourceId}:${line})`);
    });
  } else {
    const prodIndex = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(prodIndex);
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('Falha ao carregar renderer (prod):', { errorCode, errorDescription });
      try { mainWindow.webContents.reloadIgnoringCache(); } catch { }
      try { mainWindow.loadFile(prodIndex); } catch { }
    });
  }

  mainWindow.once('ready-to-show', () => {
    try {
      mainWindow.show();
      mainWindow.maximize();
    } catch { }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    setupIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});