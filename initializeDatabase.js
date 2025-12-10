// Função para inicializar o banco de dados
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Criar diretório se não existir
    if (!fs.existsSync(documentsPath)) {
      try {
        fs.mkdirSync(documentsPath, { recursive: true });
      } catch (mkdirErr) {
        console.error('Erro ao criar diretório do banco de dados:', mkdirErr);
        reject(mkdirErr);
        return;
      }
    }

    // Conectar ao banco de dados
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        reject(err);
        return;
      }

      console.log('Banco de dados SQLite conectado com sucesso!');
      console.log('Caminho do banco:', dbPath);

      // PRAGMAs de performance
      db.run('PRAGMA journal_mode = WAL', (err1) => {
        if (err1) {
          console.warn('Aviso ao aplicar PRAGMA journal_mode:', err1);
        }
        db.run('PRAGMA synchronous = NORMAL', (err2) => {
          if (err2) {
            console.warn('Aviso ao aplicar PRAGMA synchronous:', err2);
          }
          db.run('PRAGMA temp_store = MEMORY', (err3) => {
            if (err3) {
              console.warn('Aviso ao aplicar PRAGMA temp_store:', err3);
            }
            db.run('PRAGMA foreign_keys = ON', (err4) => {
              if (err4) {
                console.warn('Aviso ao aplicar PRAGMA foreign_keys:', err4);
              }
              
              // Continuar com a inicialização após os PRAGMAs
              createTablesAndMigrate(resolve, reject);
            });
          });
        });
      });
    });
  });
}

function createTablesAndMigrate(resolve, reject) {
  // Criar tabelas
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
      fromMigration INTEGER DEFAULT 0,
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

      // Índices para melhorar consultas/ordenacoes
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

        // Contador de migrações pendentes
        let migrationsCompleted = 0;
        const totalMigrations = 3; // clients, revenue_transactions, resellers

        const checkMigrationsComplete = () => {
          migrationsCompleted++;
          if (migrationsCompleted === totalMigrations) {
            resolve(); // Resolver quando todas as migrações estiverem completas
          }
        };

        // Migração da tabela clients
        db.all('PRAGMA table_info(clients)', (piErr, rows) => {
          if (piErr) {
            console.warn('Não foi possível verificar colunas da tabela clients:', piErr);
            checkMigrationsComplete();
            return;
          }

          const existing = new Set(rows.map(r => r.name));
          const needed = [
            'login','senha','plano','valor','ativacao','vencimento','formaPagamento','statusPagamento',
            'servidor','dispositivo','aplicativo','macAddress','chaveDispositivo','prospeccao','situacao','listaM3U','observacoes','dataPagamento'
          ];

          const addColumn = (col, type) => new Promise(res => {
            db.run(`ALTER TABLE clients ADD COLUMN ${col} ${type}`, function() { res(); });
          });

          const tasks = [];
          if (!existing.has('login')) tasks.push(addColumn('login','TEXT'));
          if (!existing.has('senha')) tasks.push(addColumn('senha','TEXT'));
          if (!existing.has('plano')) tasks.push(addColumn('plano','TEXT'));
          if (!existing.has('valor')) tasks.push(addColumn('valor','REAL'));
          if (!existing.has('ativacao')) tasks.push(addColumn('ativacao','TEXT'));
          if (!existing.has('vencimento')) tasks.push(addColumn('vencimento','TEXT'));
          if (!existing.has('formaPagamento')) tasks.push(addColumn('formaPagamento','TEXT'));
          if (!existing.has('statusPagamento')) tasks.push(addColumn('statusPagamento','TEXT'));
          if (!existing.has('servidor')) tasks.push(addColumn('servidor','TEXT'));
          if (!existing.has('dispositivo')) tasks.push(addColumn('dispositivo','TEXT'));
          if (!existing.has('aplicativo')) tasks.push(addColumn('aplicativo','TEXT'));
          if (!existing.has('macAddress')) tasks.push(addColumn('macAddress','TEXT'));
          if (!existing.has('chaveDispositivo')) tasks.push(addColumn('chaveDispositivo','TEXT'));
          if (!existing.has('prospeccao')) tasks.push(addColumn('prospeccao','TEXT'));
          if (!existing.has('situacao')) tasks.push(addColumn('situacao','TEXT'));
          if (!existing.has('listaM3U')) tasks.push(addColumn('listaM3U','TEXT'));
          if (!existing.has('observacoes')) tasks.push(addColumn('observacoes','TEXT'));
          if (!existing.has('dataPagamento')) tasks.push(addColumn('dataPagamento','TEXT'));

          Promise.all(tasks).then(() => checkMigrationsComplete());
        });

        // Migration for revenue_transactions new columns
        db.all('PRAGMA table_info(revenue_transactions)', (rtErr, rtRows) => {
          if (rtErr) {
            console.warn('Não foi possível verificar colunas de revenue_transactions:', rtErr);
            checkMigrationsComplete();
          } else {
            const existingRT = new Set(rtRows.map(r => r.name));
            const tasksRT = [];

            if (!existingRT.has('status')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN status TEXT DEFAULT "committed"', function() { res(); })));
            if (!existingRT.has('reversedAt')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN reversedAt DATETIME', function() { res(); })));
            if (!existingRT.has('refTransactionId')) tasksRT.push(new Promise(res => db.run('ALTER TABLE revenue_transactions ADD COLUMN refTransactionId INTEGER', function() { res(); })));

            Promise.all(tasksRT).then(() => checkMigrationsComplete());
          }
        });

        // Ensure new columns exist on resellers table (migration)
        db.all('PRAGMA table_info(resellers)', (piErr2, rows2) => {
          if (piErr2) {
            console.warn('Não foi possível verificar colunas da tabela resellers:', piErr2);
            checkMigrationsComplete();
          } else {
            const existing2 = new Set(rows2.map(r => r.name));
            const tasks2 = [];

            if (!existing2.has('servidor')) tasks2.push(new Promise(res => db.run('ALTER TABLE resellers ADD COLUMN servidor TEXT', function() { res(); })));

            Promise.all(tasks2).then(() => checkMigrationsComplete());
          }
        });
      });
    }
  });
}