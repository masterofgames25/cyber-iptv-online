import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { app } from 'electron';

let db: sqlite3.Database | null = null;

export const getDatabase = (): sqlite3.Database => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};

export const initializeDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const documentsPath = path.join(app.getPath('documents'), 'CyberpunkIPTV');
        const dbPath = path.join(documentsPath, 'cyberpunk-iptv.db');

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

            db?.run('PRAGMA journal_mode = WAL', (err1) => {
                if (err1) console.warn('Aviso ao aplicar PRAGMA journal_mode:', err1);

                db?.run('PRAGMA synchronous = NORMAL', (err2) => {
                    if (err2) console.warn('Aviso ao aplicar PRAGMA synchronous:', err2);

                    db?.run('PRAGMA temp_store = MEMORY', (err3) => {
                        if (err3) console.warn('Aviso ao aplicar PRAGMA temp_store:', err3);

                        db?.run('PRAGMA foreign_keys = ON', (err4) => {
                            if (err4) console.warn('Aviso ao aplicar PRAGMA foreign_keys:', err4);
                            resolve();
                        });
                    });
                });
            });
        });
    });
};
