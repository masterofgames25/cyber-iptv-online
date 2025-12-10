import sqlite3 from 'sqlite3';

export const runMigrations = (db: sqlite3.Database): Promise<void> => {
    return new Promise((resolve, reject) => {
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

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reseller_id INTEGER,
        type TEXT,
        quantity INTEGER,
        unit_price REAL,
        total REAL,
        date DATETIME,
        description TEXT,
        operator_name TEXT,
        party_name TEXT,
        server TEXT,
        FOREIGN KEY (reseller_id) REFERENCES resellers(id)
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
                console.log('Tabelas verificadas/criadas com sucesso!');

                const createIndexesSQL = `
          CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
          CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt);
          CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_transactions(date);
          CREATE INDEX IF NOT EXISTS idx_tests_startAt ON tests(startAt);
          CREATE INDEX IF NOT EXISTS idx_resellers_created_at ON resellers(created_at);
          CREATE INDEX IF NOT EXISTS idx_credit_tx_reseller ON credit_transactions(reseller_id);
          CREATE INDEX IF NOT EXISTS idx_credit_tx_date ON credit_transactions(date);
          CREATE INDEX IF NOT EXISTS idx_planos_nome ON planos(nome);
          CREATE INDEX IF NOT EXISTS idx_servidores_nome ON servidores(nome);
          CREATE INDEX IF NOT EXISTS idx_formas_pagamento_nome ON formas_pagamento(nome);
          CREATE INDEX IF NOT EXISTS idx_dispositivos_nome ON dispositivos(nome);
          CREATE INDEX IF NOT EXISTS idx_aplicativos_nome ON aplicativos(nome);
          CREATE INDEX IF NOT EXISTS idx_fontes_lead_nome ON fontes_lead(nome);
        `;

                db.exec(createIndexesSQL, (idxErr) => {
                    if (idxErr) console.warn('Aviso ao criar índices:', idxErr);

                    // Migrations
                    const migrateClients = () => new Promise<void>((resolveM) => {
                        db.all('PRAGMA table_info(clients)', (piErr, rows: any[]) => {
                            if (piErr) { resolveM(); return; }
                            const existing = new Set(rows.map(r => r.name));
                            const addColumn = (col: string, type: string) => new Promise<void>(res => {
                                db.run(`ALTER TABLE clients ADD COLUMN ${col} ${type}`, function () { res(); });
                            });
                            const tasks: Promise<void>[] = [];
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

                    const migrateRevenue = () => new Promise<void>((resolveM) => {
                        db.all('PRAGMA table_info(revenue_transactions)', (rtErr, rtRows: any[]) => {
                            if (rtErr) { resolveM(); return; }
                            const existingRT = new Set(rtRows.map(r => r.name));
                            const tasksRT: Promise<void>[] = [];
                            if (!existingRT.has('status')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN status TEXT DEFAULT \'committed\'', function () { res(); })));
                            if (!existingRT.has('reversedAt')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN reversedAt DATETIME', function () { res(); })));
                            if (!existingRT.has('refTransactionId')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN refTransactionId INTEGER', function () { res(); })));
                            if (!existingRT.has('serverSnapshot')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN serverSnapshot TEXT', function () { res(); })));
                            if (!existingRT.has('costSnapshot')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN costSnapshot REAL DEFAULT 0', function () { res(); })));
                            if (!existingRT.has('monthsSnapshot')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN monthsSnapshot INTEGER DEFAULT 1', function () { res(); })));
                            Promise.all(tasksRT).then(() => resolveM());
                        });
                    });

                    const migrateResellers = () => new Promise<void>((resolveM) => {
                        db.all('PRAGMA table_info(resellers)', (piErr2, rows2: any[]) => {
                            if (piErr2) { resolveM(); return; }
                            const existing2 = new Set(rows2.map(r => r.name));
                            const tasks2: Promise<void>[] = [];
                            if (!existing2.has('servidor')) tasks2.push(new Promise(res => db.run('ALTER TABLE resellers ADD COLUMN servidor TEXT', function () { res(); })));
                            Promise.all(tasks2).then(() => resolveM());
                        });
                    });

                    const migrateLeads = () => new Promise<void>((resolveM) => {
                        db.all('PRAGMA table_info(leads)', (leErr, leRows: any[]) => {
                            if (leErr) { resolveM(); return; }
                            const existingLeads = new Set(leRows.map(r => r.name));
                            const tasksLeads: Promise<void>[] = [];
                            if (!existingLeads.has('fromMigration')) tasksLeads.push(new Promise(res => db.run('ALTER TABLE leads ADD COLUMN fromMigration INTEGER DEFAULT 0', function () { res(); })));
                            Promise.all(tasksLeads).then(() => resolveM());
                        });
                    });

                    const migrateServidores = () => new Promise<void>((resolveM) => {
                        db.all('PRAGMA table_info(servidores)', (piErr3, rows3: any[]) => {
                            if (piErr3) { resolveM(); return; }
                            const existing3 = new Set(rows3.map(r => r.name));
                            const tasks3: Promise<void>[] = [];
                            if (!existing3.has('valorCredito')) tasks3.push(new Promise(res => db.run('ALTER TABLE servidores ADD COLUMN valorCredito REAL DEFAULT 0', function () { res(); })));
                            Promise.all(tasks3).then(() => resolveM());
                        });
                    });

                    const seedDefaults = () => new Promise<void>((resolveSeed) => {
                        db.get('SELECT COUNT(1) as c FROM planos', (e1, r1: any) => {
                            const seedPlanos = (cb: () => void) => {
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
                            const next1 = () => db.get('SELECT COUNT(1) as c FROM servidores', (e2, r2: any) => {
                                const seedServidores = (cb: () => void) => {
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
                                const next2 = () => db.get('SELECT COUNT(1) as c FROM formas_pagamento', (e3, r3: any) => {
                                    const seedFormas = (cb: () => void) => {
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
                                    const next3 = () => db.get('SELECT COUNT(1) as c FROM dispositivos', (e4, r4: any) => {
                                        const seedDispositivos = (cb: () => void) => {
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
                                        const next4 = () => db.get('SELECT COUNT(1) as c FROM aplicativos', (e5, r5: any) => {
                                            const seedAplicativos = (cb: () => void) => {
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
                                            const next5 = () => db.get('SELECT COUNT(1) as c FROM fontes_lead', (e6, r6: any) => {
                                                const seedFontes = (cb: () => void) => {
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
};
