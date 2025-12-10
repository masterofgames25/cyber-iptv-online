
/**
 * Migration Script: SQLite to Supabase
 * 
 * Usage:
 * 1. Install dependencies: npm install sqlite3 @supabase/supabase-js dotenv
 * 2. Configure .env with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (Service Role is needed for writing without RLS restrictions)
 * 3. Run: node scripts/migrate_to_supabase.js
 */

import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// IMPORTANT: Use SERVICE ROLE KEY for migration to bypass RLS policies
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Default path for Cyberpunk IPTV database on Windows
const DEFAULT_DB_PATH = path.join(os.homedir(), 'Documents', 'CyberpunkIPTV', 'cyberpunk-iptv.db');
const SYSTEM_DB_PATH = process.argv[2] || DEFAULT_DB_PATH;

// Check project root as fallback
const LOCAL_DB_PATH = path.join(__dirname, '..', 'cyberpunk-iptv.db');

let DB_PATH = SYSTEM_DB_PATH;
if (!fs.existsSync(DB_PATH) && fs.existsSync(LOCAL_DB_PATH)) {
    console.log(`⚠️ Default DB not found, using local file: ${LOCAL_DB_PATH}`);
    DB_PATH = LOCAL_DB_PATH;
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(`❌ Could not connect to SQLite database at ${DB_PATH}`, err);
        process.exit(1);
    }
    console.log(`✅ Connected to SQLite database: ${DB_PATH}`);
});

const migrateTable = async (tableName, transformFn = (row) => row) => {
    return new Promise((resolve, reject) => {
        console.log(`\n📦 Migrating table: ${tableName}...`);

        db.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
            if (err) {
                console.error(`Error reading ${tableName}:`, err);
                return reject(err);
            }

            if (rows.length === 0) {
                console.log(`No data found in ${tableName}.`);
                return resolve();
            }

            console.log(`Found ${rows.length} records. Uploading to Supabase...`);

            // Transform rows if necessary (e.g., date formats, boolean conversions)
            const transformedRows = rows.map(transformFn);

            // Insert in chunks of 100 to avoid request limits
            const chunkSize = 100;
            for (let i = 0; i < transformedRows.length; i += chunkSize) {
                const chunk = transformedRows.slice(i, i + chunkSize);

                const { error } = await supabase.from(tableName).upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });

                if (error) {
                    console.error(`❌ Error uploading chunk ${i / chunkSize + 1} for ${tableName}:`, error);
                    // Don't stop, try next chunk? Or fail hard? Let's log and continue for now.
                } else {
                    process.stdout.write('.');
                }
            }
            console.log(`\n✅ ${tableName} migration complete.`);
            resolve();
        });
    });
};

const runMigration = async () => {
    try {
        // 1. Clients
        await migrateTable('clients', (row) => ({
            ...row,
            // Map SQLite integer boolean to boolean if needed, though Postgres handles 1/0 often fine.
            // Ensure dates are valid ISO strings if relevant
        }));

        // 2. Leads
        await migrateTable('leads');

        // 3. Resellers
        await migrateTable('resellers');

        // 4. Revenue Transactions
        await migrateTable('revenue_transactions');

        // 5. Tests
        await migrateTable('tests');

        // 6. System Logs (Optional)
        await migrateTable('system_log');

        console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
