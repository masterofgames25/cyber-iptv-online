const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  database: {
    getClients: () => ipcRenderer.invoke('db-get-clients'),
    addClient: (client) => ipcRenderer.invoke('db-add-client', client),
    updateClient: (client) => ipcRenderer.invoke('db-update-client', client),
    deleteClient: (id) => ipcRenderer.invoke('db-delete-client', id),

    getLeads: () => ipcRenderer.invoke('db-get-leads'),
    addLead: (lead) => ipcRenderer.invoke('db-add-lead', lead),
    updateLead: (lead) => ipcRenderer.invoke('db-update-lead', lead),
    deleteLead: (id) => ipcRenderer.invoke('db-delete-lead', id),

    getRevenueTransactions: () => ipcRenderer.invoke('db-get-revenue-transactions'),
    addRevenueTransaction: (transaction) => ipcRenderer.invoke('db-add-revenue-transaction', transaction),
    clearRevenueTransactions: () => ipcRenderer.invoke('db-clear-revenue-transactions'),
    confirmPayment: (payload) => ipcRenderer.invoke('db-confirm-payment', payload),
    revertRevenueTransaction: (payload) => ipcRenderer.invoke('db-revert-revenue-transaction', payload),

    getTests: () => ipcRenderer.invoke('db-get-tests'),
    addTest: (test) => ipcRenderer.invoke('db-add-test', test),
    updateTest: (test) => ipcRenderer.invoke('db-update-test', test),
    deleteTest: (id) => ipcRenderer.invoke('db-delete-test', id),

    getResellers: () => ipcRenderer.invoke('db-get-resellers'),
    addReseller: (reseller) => ipcRenderer.invoke('db-add-reseller', reseller),
    updateReseller: (reseller) => ipcRenderer.invoke('db-update-reseller', reseller),
    deleteReseller: (id) => ipcRenderer.invoke('db-delete-reseller', id),

    getSystemLog: () => ipcRenderer.invoke('db-get-system-log'),
    addSystemLogEntry: (logEntry) => ipcRenderer.invoke('db-add-system-log', logEntry),

    clearAllData: () => ipcRenderer.invoke('db-clear-all-data'),

    getPlanos: () => ipcRenderer.invoke('db-get-planos'),
    savePlanos: (planos) => ipcRenderer.invoke('db-save-planos', planos),
    getServidores: () => ipcRenderer.invoke('db-get-servidores'),
    saveServidores: (servidores) => ipcRenderer.invoke('db-save-servidores', servidores),
    getFormasPagamento: () => ipcRenderer.invoke('db-get-formas-pagamento'),
    saveFormasPagamento: (formas) => ipcRenderer.invoke('db-save-formas-pagamento', formas),
    getDispositivos: () => ipcRenderer.invoke('db-get-dispositivos'),
    saveDispositivos: (dispositivos) => ipcRenderer.invoke('db-save-dispositivos', dispositivos),
    getAplicativos: () => ipcRenderer.invoke('db-get-aplicativos'),
    saveAplicativos: (aplicativos) => ipcRenderer.invoke('db-save-aplicativos', aplicativos),
    getFontesLead: () => ipcRenderer.invoke('db-get-fontes-lead'),
    saveFontesLead: (fontes) => ipcRenderer.invoke('db-save-fontes-lead', fontes)
  },

  generateClientsPDF: () => ipcRenderer.invoke('generate-clients-pdf'),

  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  onDatabaseChange: (callback) => {
    ipcRenderer.on('db-changed', callback);
    return () => ipcRenderer.removeListener('db-changed', callback);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script carregado com sucesso!');