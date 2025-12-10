import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import * as ClientController from '../controllers/ClientController';
import * as LeadController from '../controllers/LeadController';
import { RevenueController } from '../controllers/RevenueController';
import * as TestController from '../controllers/TestController';
import * as ResellerController from '../controllers/ResellerController';
import * as CreditController from '../controllers/CreditController';
import * as SystemLogController from '../controllers/SystemLogController';
import * as SettingsController from '../controllers/SettingsController';
import { getDatabase } from '../database/connection';

export const setupIpcHandlers = () => {
  // Clients
  ipcMain.handle('db-get-clients', () => ClientController.getClients());
  ipcMain.handle('db-add-client', (event, client) => ClientController.addClient(client));
  ipcMain.handle('db-update-client', (event, client) => ClientController.updateClient(client));
  ipcMain.handle('db-delete-client', (event, id) => ClientController.deleteClient(id));

  // Leads
  ipcMain.handle('db-get-leads', () => LeadController.getLeads());
  ipcMain.handle('db-add-lead', (event, lead) => LeadController.addLead(lead));
  ipcMain.handle('db-update-lead', (event, lead) => LeadController.updateLead(lead));
  ipcMain.handle('db-delete-lead', (event, id) => LeadController.deleteLead(id));

  // Revenue
  ipcMain.handle('db-get-revenue-transactions', () => RevenueController.getRevenueTransactions());
  ipcMain.handle('db-add-revenue-transaction', (event, transaction) => RevenueController.addRevenueTransaction(transaction));
  ipcMain.handle('db-confirm-payment', (event, payload) => RevenueController.confirmPayment(payload));
  ipcMain.handle('db-revert-revenue-transaction', (event, payload) => RevenueController.revertRevenueTransaction(payload));
  ipcMain.handle('db-clear-revenue-transactions', () => RevenueController.clearRevenueTransactions());

  // Tests
  ipcMain.handle('db-get-tests', () => TestController.getTests());
  ipcMain.handle('db-add-test', (event, test) => TestController.addTest(test));
  ipcMain.handle('db-update-test', (event, test) => TestController.updateTest(test));
  ipcMain.handle('db-delete-test', (event, id) => TestController.deleteTest(id));

  // Resellers
  ipcMain.handle('db-get-resellers', () => ResellerController.getResellers());
  ipcMain.handle('db-add-reseller', (event, reseller) => ResellerController.addReseller(reseller));
  ipcMain.handle('db-update-reseller', (event, reseller) => ResellerController.updateReseller(reseller));
  ipcMain.handle('db-delete-reseller', (event, id) => ResellerController.deleteReseller(id));

  // Credit Transactions
  ipcMain.handle('db-add-credit-transaction', (event, tx) => CreditController.addCreditTransaction(tx));
  ipcMain.handle('db-get-credit-transactions-by-reseller', (event, resellerId) => CreditController.getCreditTransactionsByReseller(resellerId));
  ipcMain.handle('db-get-all-credit-transactions', () => CreditController.getAllCreditTransactions());

  // System Log
  ipcMain.handle('db-get-system-log', () => SystemLogController.getSystemLog());
  ipcMain.handle('db-add-system-log', (event, logEntry) => SystemLogController.addSystemLogEntry(logEntry));
  ipcMain.handle('db-clear-all-data', () => SystemLogController.clearAllData());

  // Settings
  ipcMain.handle('db-get-planos', () => SettingsController.getPlanos());
  ipcMain.handle('db-save-planos', (event, planos) => SettingsController.savePlanos(planos));
  ipcMain.handle('db-get-servidores', () => SettingsController.getServidores());
  ipcMain.handle('db-save-servidores', (event, servidores) => SettingsController.saveServidores(servidores));
  ipcMain.handle('db-get-formas-pagamento', () => SettingsController.getFormasPagamento());
  ipcMain.handle('db-save-formas-pagamento', (event, formas) => SettingsController.saveFormasPagamento(formas));
  ipcMain.handle('db-get-dispositivos', () => SettingsController.getDispositivos());
  ipcMain.handle('db-save-dispositivos', (event, dispositivos) => SettingsController.saveDispositivos(dispositivos));
  ipcMain.handle('db-get-aplicativos', () => SettingsController.getAplicativos());
  ipcMain.handle('db-save-aplicativos', (event, aplicativos) => SettingsController.saveAplicativos(aplicativos));
  ipcMain.handle('db-get-fontes-lead', () => SettingsController.getFontesLead());
  ipcMain.handle('db-save-fontes-lead', (event, fontes) => SettingsController.saveFontesLead(fontes));

  // PDF Generation
  ipcMain.handle('generate-clients-pdf', async () => {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      try {
        db.all('SELECT * FROM clients ORDER BY nome', async (err: any, rows: any[]) => {
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
};
