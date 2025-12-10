const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

// Database path
const dbPath = path.join(os.homedir(), 'OneDrive', 'Documentos', 'CyberpunkIPTV', 'cyberpunk-iptv.db');

console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('ERROR: Database file not found at', dbPath);
    console.log('Please run the Electron app at least once to create the database.');
    process.exit(1);
}

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }

    console.log('\nConnected to database successfully!');
    console.log('\nExecuting SQL fix...\n');

    // SQL to fix the table
    const sql = `
        DROP TABLE IF EXISTS credit_transactions;
        
        CREATE TABLE credit_transactions (
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
        
        CREATE INDEX IF NOT EXISTS idx_credit_tx_reseller ON credit_transactions(reseller_id);
        CREATE INDEX IF NOT EXISTS idx_credit_tx_date ON credit_transactions(date);
    `;

    db.exec(sql, (err) => {
        if (err) {
            console.error('Error executing SQL:', err);
            process.exit(1);
        }

        console.log('✓ Table credit_transactions recreated successfully!');
        console.log('\nYou can now restart the Electron app and try creating transactions.');

        db.close((closeErr) => {
            if (closeErr) {
                console.error('Error closing database:', closeErr);
            }
        });
    });
});
