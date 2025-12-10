import React from 'react';
import { motion } from 'framer-motion';
import { Reseller, CreditTransaction } from '../../types';

interface TransactionManagerProps {
    resellers: Reseller[];
    allTransactions: CreditTransaction[];
    servers: string[];
    serverCostMap: Record<string, number>;
    operatorName: string;
    setOperatorName: (name: string) => void;
    purchaseForm: { server: string; supplier: string; quantity: number; unitPrice: number };
    setPurchaseForm: React.Dispatch<React.SetStateAction<{ server: string; supplier: string; quantity: number; unitPrice: number }>>;
    saleForm: { resellerId: number; quantity: number; unitPrice: number };
    setSaleForm: React.Dispatch<React.SetStateAction<{ resellerId: number; quantity: number; unitPrice: number }>>;
    onPurchaseSubmit: (e: React.FormEvent) => void;
    onSaleSubmit: (e: React.FormEvent) => void;
}

const TransactionManager: React.FC<TransactionManagerProps> = ({
    resellers,
    allTransactions,
    servers,
    serverCostMap,
    operatorName,
    setOperatorName,
    purchaseForm,
    setPurchaseForm,
    saleForm,
    setSaleForm,
    onPurchaseSubmit,
    onSaleSubmit
}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Nova Compra</h3>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Nome do Operador</label>
                        <input type="text" value={operatorName} onChange={(e) => { setOperatorName(e.target.value); }} className="w-full input-cyber" />
                    </div>
                    <form onSubmit={onPurchaseSubmit} className="space-y-3">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Servidor</label>
                            <select value={purchaseForm.server} onChange={(e) => setPurchaseForm({ ...purchaseForm, server: e.target.value, unitPrice: serverCostMap[e.target.value] || 0 })} className="w-full select-cyber">
                                {servers.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Fornecedor</label>
                            <input type="text" value={purchaseForm.supplier} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} className="w-full input-cyber" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Quantidade</label>
                                <input type="number" min={1} value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })} className="w-full input-cyber" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Valor Unitário (R$)</label>
                                <input type="number" step="0.01" value={purchaseForm.unitPrice} onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: Number(e.target.value) })} className="w-full input-cyber" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="flex-1 btn-cyber">Registrar Compra</motion.button>
                        </div>
                    </form>
                </div>

                <div className="glass rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Nova Venda</h3>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">Nome do Operador</label>
                        <input type="text" value={operatorName} onChange={(e) => { setOperatorName(e.target.value); }} className="w-full input-cyber" />
                    </div>
                    <form onSubmit={onSaleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Revendedor</label>
                            <select value={saleForm.resellerId} onChange={(e) => setSaleForm({ ...saleForm, resellerId: Number(e.target.value), unitPrice: (resellers.find(r => r.id === Number(e.target.value))?.salePrice || 0) })} className="w-full select-cyber">
                                <option value={0}>Selecione...</option>
                                {resellers.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Quantidade</label>
                                <input type="number" min={1} value={saleForm.quantity} onChange={(e) => setSaleForm({ ...saleForm, quantity: Number(e.target.value) })} className="w-full input-cyber" />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Valor Unitário (R$)</label>
                                <input type="number" step="0.01" value={saleForm.unitPrice} onChange={(e) => setSaleForm({ ...saleForm, unitPrice: Number(e.target.value) })} className="w-full input-cyber" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="flex-1 btn-cyber">Registrar Venda</motion.button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Transaction History Table */}
            <div className="glass rounded-2xl p-6 border border-purple-500/20 mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Histórico Geral</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-purple-500/20">
                                <th className="text-left p-3">Data</th>
                                <th className="text-left p-3">Tipo</th>
                                <th className="text-left p-3">Operador</th>
                                <th className="text-left p-3">Parte (Forn./Rev.)</th>
                                <th className="text-left p-3">Servidor</th>
                                <th className="text-left p-3">Qtd</th>
                                <th className="text-left p-3">Unitário</th>
                                <th className="text-left p-3">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allTransactions.length === 0 && (
                                <tr><td className="p-4 text-gray-500 text-center" colSpan={8}>Nenhuma transação registrada</td></tr>
                            )}
                            {allTransactions.map(tx => (
                                <tr key={tx.id} className="border-b border-purple-500/10 hover:bg-white/5">
                                    <td className="p-3 text-gray-300">{new Date(tx.date).toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.type === 'purchase' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {tx.type === 'purchase' ? 'Compra' : 'Venda'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-300">{tx.operatorName || '-'}</td>
                                    <td className="p-3 text-gray-300">{tx.partyName || '-'}</td>
                                    <td className="p-3 text-gray-300">{tx.server || '-'}</td>
                                    <td className="p-3 text-gray-300">{tx.quantity}</td>
                                    <td className="p-3 text-gray-300">R$ {tx.unitPrice.toFixed(2)}</td>
                                    <td className="p-3 text-gray-300 font-semibold">R$ {tx.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionManager;
