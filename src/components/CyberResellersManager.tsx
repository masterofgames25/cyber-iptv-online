import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Reseller, CreditTransaction } from '../types';
import { useData } from '../context/DataContext';
import { api } from '../services/api';
import { useSystemData } from '../utils/systemData';
import ResellerDashboard from './resellers/ResellerDashboard';
import ResellerList from './resellers/ResellerList';
import ResellerForm from './resellers/ResellerForm';
import TransactionManager from './resellers/TransactionManager';
import ConfirmationModal from './resellers/ConfirmationModal';

interface ResellerFormData {
  nome: string;
  whatsapp: string;
  servidor: string;
  purchasePrice: number;
  salePrice: number;
}

const CyberResellersManager: React.FC = () => {
  const { resellers, updateReseller, addReseller, deleteReseller, addCreditTransaction, getCreditTransactionsByReseller } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'dashboard' | 'list' | 'transactions'>('dashboard');
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const { getServers, getServerCostMap, getServerCreditPriceMap } = useSystemData();
  const [servers, setServers] = useState<string[]>(() => getServers());
  const serverCostMap = getServerCostMap();
  const serverCreditPriceMap = getServerCreditPriceMap();
  const [formData, setFormData] = useState<ResellerFormData>({
    nome: '',
    whatsapp: '',
    servidor: servers[0] || '',
    purchasePrice: (servers[0] ? serverCostMap[servers[0]] : 0) || 0,
    salePrice: (servers[0] ? serverCreditPriceMap[servers[0]] : 0) || 0
  });

  const [allTransactions, setAllTransactions] = useState<CreditTransaction[]>([]);
  const [operatorName, setOperatorName] = useState<string>('');
  const [purchaseForm, setPurchaseForm] = useState({ server: servers[0] || '', supplier: '', quantity: 0, unitPrice: (servers[0] ? serverCostMap[servers[0]] : 0) || 0 });
  const [saleForm, setSaleForm] = useState({ resellerId: 0, quantity: 0, unitPrice: 0 });
  const [expenses, setExpenses] = useState<Array<{ id: number; description: string; amount: number; date: string }>>([]);

  // Confirmation Modal State
  const [confirmReseller, setConfirmReseller] = useState<Reseller | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setServers(getServers());
      const costMap = getServerCostMap();
      const priceMap = getServerCreditPriceMap();
      setFormData(prev => ({
        ...prev,
        purchasePrice: costMap[prev.servidor] ?? prev.purchasePrice,
        salePrice: priceMap[prev.servidor] ?? prev.salePrice
      }));

      // Fetch all transactions for dashboard and history using API
      api.creditTransactions.list()
        .then((txs: any[]) => {
          const mappedTxs = (txs || []).map((tx: any) => ({
            ...tx,
            operatorName: tx.operator_name || tx.operatorName,
            partyName: tx.party_name || tx.partyName,
            unitPrice: tx.unit_price || tx.unitPrice,
            resellerId: tx.reseller_id || tx.resellerId
          }));
          setAllTransactions(mappedTxs);
        })
        .catch((err: any) => console.error('Error fetching all transactions:', err));
    };
    refresh();
    window.addEventListener('settingsUpdated', refresh);
    return () => window.removeEventListener('settingsUpdated', refresh);
  }, []);

  // Removed fetchTransactions per reseller (N+1 optimization)
  // We now rely on allTransactions for calculations in ResellerList

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingReseller) {
      // Update existing reseller
      const updatedReseller: Reseller = {
        ...editingReseller,
        ...formData,
        whatsapp: (String(formData.whatsapp || '').startsWith('+') ? `+${String(formData.whatsapp).replace(/\D/g, '')}` : String(formData.whatsapp).replace(/\D/g, ''))
      };

      updateReseller(updatedReseller);
    } else {
      // Add new reseller
      const newReseller: Reseller = {
        id: Date.now(),
        ...formData,
        whatsapp: (String(formData.whatsapp || '').startsWith('+') ? `+${String(formData.whatsapp).replace(/\D/g, '')}` : String(formData.whatsapp).replace(/\D/g, '')),
        activeClients: 0,
        totalSales: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      addReseller(newReseller);
    }

    resetForm();
  };

  const resetForm = () => {
    const defaultServer = getServers()[0] || '';
    const costMap = getServerCostMap();
    const priceMap = getServerCreditPriceMap();
    setFormData({ nome: '', whatsapp: '', servidor: defaultServer, purchasePrice: (costMap[defaultServer] || 0), salePrice: (priceMap[defaultServer] || 0) });
    setShowForm(false);
    setEditingReseller(null);
  };

  const openWhatsAppReseller = (reseller: Reseller) => {
    const raw = String(reseller.whatsapp || '').trim();
    const apiNumber = raw.startsWith('+') ? raw.slice(1).replace(/\D/g, '') : raw.replace(/\D/g, '');
    const url = `https://wa.me/${apiNumber}?text=${encodeURIComponent(`Olá ${reseller.nome}`)}`;
    window.open(url, '_blank');
  };

  const handleEdit = (reseller: Reseller) => {
    setEditingReseller(reseller);
    setFormData({
      nome: reseller.nome,
      whatsapp: (String(reseller.whatsapp || '').startsWith('+') ? `+${String(reseller.whatsapp).replace(/\D/g, '')}` : String(reseller.whatsapp).replace(/\D/g, '')),
      servidor: reseller.servidor,
      purchasePrice: reseller.purchasePrice,
      salePrice: reseller.salePrice
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    const target = resellers.find(r => r.id === id) || null;
    setConfirmReseller(target);
  };

  const confirmDelete = async () => {
    if (!confirmReseller) return;
    setConfirmLoading(true);
    try {
      await deleteReseller(confirmReseller.id);
      setConfirmReseller(null);
    } catch (error) {
      console.error('Erro ao excluir revendedor:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const toggleStatus = (reseller: Reseller) => {
    const updatedReseller = {
      ...reseller,
      status: reseller.status === 'active' ? 'inactive' : 'active' as 'active' | 'inactive'
    };
    updateReseller(updatedReseller);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName || !purchaseForm.server || purchaseForm.quantity <= 0) return;

    const total = purchaseForm.quantity * purchaseForm.unitPrice;
    const payload = {
      type: 'purchase',
      operatorName: operatorName || 'Operador',
      partyName: purchaseForm.supplier || 'Fornecedor',
      quantity: purchaseForm.quantity,
      unitPrice: purchaseForm.unitPrice,
      total,
      server: purchaseForm.server,
      date: new Date().toISOString(),
      status: 'ok'
    } as Omit<CreditTransaction, 'id'>;

    await addCreditTransaction(payload);

    // Refresh transactions via API
    try {
      const txs = await api.creditTransactions.list();
      const mappedTxs = (txs || []).map((tx: any) => ({ ...tx, operatorName: tx.operator_name || tx.operatorName, partyName: tx.party_name || tx.partyName, unitPrice: tx.unit_price || tx.unitPrice, resellerId: tx.reseller_id || tx.resellerId }));
      setAllTransactions(mappedTxs);
    } catch (error) {
      console.error("Error refreshing transactions", error);
    }

    setPurchaseForm({ server: servers[0] || '', supplier: '', quantity: 0, unitPrice: (serverCostMap[servers[0] || ''] || 0) });
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reseller = resellers.find(r => r.id === Number(saleForm.resellerId));
    if (!reseller) return;
    if (saleForm.quantity <= 0) return;

    const total = saleForm.quantity * saleForm.unitPrice;
    const payload = {
      type: 'sale',
      operatorName: operatorName || 'Operador',
      partyName: reseller.nome,
      resellerId: reseller.id,
      quantity: saleForm.quantity,
      unitPrice: saleForm.unitPrice,
      total,
      server: reseller.servidor,
      date: new Date().toISOString(),
      status: 'ok'
    } as Omit<CreditTransaction, 'id'>;

    await addCreditTransaction(payload);

    // Refresh transactions via API
    try {
      const txs = await api.creditTransactions.list();
      const mappedTxs = (txs || []).map((tx: any) => ({ ...tx, operatorName: tx.operator_name || tx.operatorName, partyName: tx.party_name || tx.partyName, unitPrice: tx.unit_price || tx.unitPrice, resellerId: tx.reseller_id || tx.resellerId }));
      setAllTransactions(mappedTxs);
    } catch (error) {
      console.error("Error refreshing transactions", error);
    }

    const updated = { ...reseller, creditsSold: (reseller.creditsSold || 0) + saleForm.quantity, totalSales: reseller.totalSales + total };
    await updateReseller(updated);

    setSaleForm({ resellerId: 0, quantity: 0, unitPrice: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Revendedores</h1>
          <p className="text-gray-400">Gerencie seus revendedores e transações de créditos</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-lg ${view === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-black/30 text-gray-400 hover:text-white'}`}>Dashboard</button>
          <button onClick={() => setView('list')} className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-purple-600 text-white' : 'bg-black/30 text-gray-400 hover:text-white'}`}>Lista</button>
          <button onClick={() => setView('transactions')} className={`px-4 py-2 rounded-lg ${view === 'transactions' ? 'bg-purple-600 text-white' : 'bg-black/30 text-gray-400 hover:text-white'}`}>Transações</button>
        </div>
      </div>

      {view === 'dashboard' && (
        <ResellerDashboard
          resellers={resellers}
          allTransactions={allTransactions}
          expenses={expenses}
        />
      )}

      {view === 'list' && (
        <>
          <ResellerList
            resellers={resellers}
            allTransactions={allTransactions}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddNew={() => setShowForm(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={toggleStatus}
            openWhatsApp={openWhatsAppReseller}
          />
          <AnimatePresence>
            {showForm && (
              <ResellerForm
                formData={formData}
                setFormData={setFormData}
                editingReseller={editingReseller}
                servers={servers}
                serverCostMap={serverCostMap}
                serverCreditPriceMap={serverCreditPriceMap}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {view === 'transactions' && (
        <TransactionManager
          resellers={resellers}
          allTransactions={allTransactions}
          servers={servers}
          serverCostMap={serverCostMap}
          operatorName={operatorName}
          setOperatorName={setOperatorName}
          purchaseForm={purchaseForm}
          setPurchaseForm={setPurchaseForm}
          saleForm={saleForm}
          setSaleForm={setSaleForm}
          onPurchaseSubmit={handlePurchaseSubmit}
          onSaleSubmit={handleSaleSubmit}
        />
      )}

      <ConfirmationModal
        isOpen={!!confirmReseller}
        reseller={confirmReseller}
        loading={confirmLoading}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmReseller(null)}
      />
    </div>
  );
};

export default CyberResellersManager;
