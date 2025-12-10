import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// API exposta ao renderer process
const electronAPI: any = {
  database: {
    // Clientes
    getClients: () => ipcRenderer.invoke('db-get-clients'),
    addClient: (client: any) => ipcRenderer.invoke('db-add-client', client),
    updateClient: (client: any) => ipcRenderer.invoke('db-update-client', client),
    deleteClient: (id: any) => ipcRenderer.invoke('db-delete-client', id),

    // Leads
    getLeads: () => ipcRenderer.invoke('db-get-leads'),
    addLead: (lead: any) => ipcRenderer.invoke('db-add-lead', lead),
    updateLead: (lead: any) => ipcRenderer.invoke('db-update-lead', lead),
    deleteLead: (id: any) => ipcRenderer.invoke('db-delete-lead', id),

    // Transações de Receita
    getRevenueTransactions: () => ipcRenderer.invoke('db-get-revenue-transactions'),
    addRevenueTransaction: (transaction: any) => ipcRenderer.invoke('db-add-revenue-transaction', transaction),
    confirmPayment: (payload: any) => ipcRenderer.invoke('db-confirm-payment', payload),
    revertRevenueTransaction: (payload: any) => ipcRenderer.invoke('db-revert-revenue-transaction', payload),
    clearRevenueTransactions: () => ipcRenderer.invoke('db-clear-revenue-transactions'),

    // Testes
    getTests: () => ipcRenderer.invoke('db-get-tests'),
    addTest: (test: any) => ipcRenderer.invoke('db-add-test', test),
    updateTest: (test: any) => ipcRenderer.invoke('db-update-test', test),
    deleteTest: (id: any) => ipcRenderer.invoke('db-delete-test', id),

    // Revendedores
    getResellers: () => ipcRenderer.invoke('db-get-resellers'),
    addReseller: (reseller: any) => ipcRenderer.invoke('db-add-reseller', reseller),
    updateReseller: (reseller: any) => ipcRenderer.invoke('db-update-reseller', reseller),
    deleteReseller: (id: any) => ipcRenderer.invoke('db-delete-reseller', id),

    // Créditos
    addCreditTransaction: (tx: any) => ipcRenderer.invoke('db-add-credit-transaction', tx),
    getCreditTransactionsByReseller: (resellerId: number) => ipcRenderer.invoke('db-get-credit-transactions-by-reseller', resellerId),
    getAllCreditTransactions: () => ipcRenderer.invoke('db-get-all-credit-transactions'),

    // Sistema Log
    getSystemLog: () => ipcRenderer.invoke('db-get-system-log'),
    addSystemLogEntry: (logEntry: any) => ipcRenderer.invoke('db-add-system-log', logEntry),

    // Utilidades
    clearAllData: () => ipcRenderer.invoke('db-clear-all-data'),

    // System Settings
    getPlanos: () => ipcRenderer.invoke('db-get-planos'),
    savePlanos: (planos: any) => ipcRenderer.invoke('db-save-planos', planos),
    getServidores: () => ipcRenderer.invoke('db-get-servidores'),
    saveServidores: (servidores: any) => ipcRenderer.invoke('db-save-servidores', servidores),
    getFormasPagamento: () => ipcRenderer.invoke('db-get-formas-pagamento'),
    saveFormasPagamento: (formas: any) => ipcRenderer.invoke('db-save-formas-pagamento', formas),
    getDispositivos: () => ipcRenderer.invoke('db-get-dispositivos'),
    saveDispositivos: (dispositivos: any) => ipcRenderer.invoke('db-save-dispositivos', dispositivos),
    getAplicativos: () => ipcRenderer.invoke('db-get-aplicativos'),
    saveAplicativos: (aplicativos: any) => ipcRenderer.invoke('db-save-aplicativos', aplicativos),
    getFontesLead: () => ipcRenderer.invoke('db-get-fontes-lead'),
    saveFontesLead: (fontes: any) => ipcRenderer.invoke('db-save-fontes-lead', fontes)
    // Migration function removed - SQLite system only
  },

  // Info do app
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Listener para mudanças no banco de dados
  onDatabaseChange: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on('db-changed', callback);
    return () => ipcRenderer.removeListener('db-changed', callback);
  }
};

// Utilidade: geração de PDF de clientes
// Mantém paridade com preload.cjs
electronAPI.generateClientsPDF = () => ipcRenderer.invoke('generate-clients-pdf');

// Expor a API ao contexto do navegador
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script carregado com sucesso!');
