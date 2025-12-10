import { app } from 'electron';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

console.log('Testando SQLite com Electron...');

const documentsPath = path.join('C:\\Users\\harli\\OneDrive\\Documentos', 'CyberpunkIPTV');
const dbPath = path.join(documentsPath, 'test.db');

try {
  // Criar diretório se não existir
  if (!fs.existsSync(documentsPath)) {
    fs.mkdirSync(documentsPath, { recursive: true });
    console.log('Diretório criado:', documentsPath);
  }

  // Testar conexão com SQLite
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao conectar ao SQLite:', err);
      app.quit();
      return;
    }
    
    console.log('SQLite conectado com sucesso!');
    console.log('Caminho do banco:', dbPath);
    
    // Testar criação de tabela
    db.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)', (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err);
      } else {
        console.log('Tabela criada com sucesso!');
      }
      
      // Fechar conexão
      db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco:', err);
        } else {
          console.log('Banco de dados fechado com sucesso!');
        }
        app.quit();
      });
    });
  });

} catch (error) {
  console.error('Erro geral:', error);
  app.quit();
}