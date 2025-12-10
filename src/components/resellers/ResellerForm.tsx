import React from 'react';
import { motion } from 'framer-motion';
import { Reseller } from '../../types';

interface ResellerFormData {
    nome: string;
    whatsapp: string;
    servidor: string;
    purchasePrice: number;
    salePrice: number;
}

interface ResellerFormProps {
    formData: ResellerFormData;
    setFormData: React.Dispatch<React.SetStateAction<ResellerFormData>>;
    editingReseller: Reseller | null;
    servers: string[];
    serverCostMap: Record<string, number>;
    serverCreditPriceMap: Record<string, number>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

const ResellerForm: React.FC<ResellerFormProps> = ({
    formData,
    setFormData,
    editingReseller,
    servers,
    serverCostMap,
    serverCreditPriceMap,
    onSubmit,
    onCancel
}) => {
    const handleResellerWhatsAppChange = (value: string) => {
        setFormData(prev => ({ ...prev, whatsapp: value }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 border border-purple-500/20"
        >
            <h3 className="text-lg font-bold text-white mb-4">
                {editingReseller ? 'Editar Revendedor' : 'Novo Revendedor'}
            </h3>
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Nome</label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full px-3 py-2 bg-black/30 border border-purple-500/30 rounded-xl text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">WhatsApp</label>
                        <input
                            type="text"
                            value={formData.whatsapp}
                            onChange={(e) => handleResellerWhatsAppChange(e.target.value)}
                            className="w-full px-3 py-2 bg-black/30 border border-purple-500/30 rounded-xl text-white"
                            placeholder="Ex: 5511999999999 ou +351..."
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Servidor</label>
                        <select
                            value={formData.servidor}
                            onChange={(e) => {
                                const server = e.target.value;
                                const cost = serverCostMap[server] || 0;
                                const price = serverCreditPriceMap[server] || 0;
                                setFormData(prev => ({ ...prev, servidor: server, purchasePrice: cost, salePrice: price }));
                            }}
                            className="w-full select-cyber"
                        >
                            {servers.map(server => (
                                <option key={server} value={server}>{server}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Preço de Compra (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.purchasePrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                            className="w-full input-cyber"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Preço de Venda (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.salePrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                            className="w-full input-cyber"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg"
                    >
                        {editingReseller ? 'Atualizar' : 'Criar'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 bg-black/30 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg"
                    >
                        Cancelar
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
};

export default ResellerForm;
