import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reseller, CreditTransaction } from '../../types';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface ResellerListProps {
    resellers: Reseller[];
    allTransactions: CreditTransaction[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAddNew: () => void;
    onEdit: (reseller: Reseller) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (reseller: Reseller) => void;
    openWhatsApp: (reseller: Reseller) => void;
}

const ResellerList: React.FC<ResellerListProps> = ({
    resellers,
    allTransactions,
    searchTerm,
    setSearchTerm,
    onAddNew,
    onEdit,
    onDelete,
    onToggleStatus,
    openWhatsApp
}) => {
    const filteredResellers = resellers.filter(reseller => {
        const nome = (reseller.nome || '').toLowerCase();
        const wpp = reseller.whatsapp || '';
        return nome.includes(searchTerm.toLowerCase()) || wpp.includes(searchTerm);
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'inactive': return 'bg-red-500/20 text-red-400 border border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar revendedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/30 border border-purple-500/30 rounded-xl text-white placeholder-gray-400"
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg"
                >
                    <PlusIcon className="w-5 h-5" />
                    Novo Revendedor
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredResellers.map(reseller => {
                        // Calculate credits bought by this reseller from allTransactions
                        const creditsBought = allTransactions
                            .filter(t => t.type === 'sale' && (t.resellerId === reseller.id || t.partyName === reseller.nome))
                            .reduce((s, t) => s + (t.quantity || 0), 0);

                        return (
                            <motion.div
                                key={reseller.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white truncate">{reseller.nome}</h3>
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => openWhatsApp(reseller)}
                                            className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg"
                                            title="Abrir WhatsApp"
                                        >
                                            <PaperAirplaneIcon className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onEdit(reseller)}
                                            className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg"
                                            title="Editar"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onDelete(reseller.id)}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg"
                                            title="Excluir"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">WhatsApp:</span>
                                        <span className="text-white">{reseller.whatsapp}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Servidor:</span>
                                        <span className="text-white">{reseller.servidor}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Valor de Compra:</span>
                                        <span className="text-orange-400 font-semibold">R$ {reseller.purchasePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Valor de Venda:</span>
                                        <span className="text-green-400 font-semibold">R$ {reseller.salePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Ganho (%):</span>
                                        <span className="text-cyan-400 font-semibold">{reseller.purchasePrice > 0 ? (((reseller.salePrice - reseller.purchasePrice) / reseller.purchasePrice) * 100).toFixed(2) : '0.00'}%</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Vendas Totais:</span>
                                        <span className="text-magenta-400 font-semibold">R$ {reseller.totalSales.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Créditos Comprados:</span>
                                        <span className="text-cyan-400 font-semibold">{creditsBought}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Status:</span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onToggleStatus(reseller)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reseller.status)}`}
                                        >
                                            {reseller.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ResellerList;
