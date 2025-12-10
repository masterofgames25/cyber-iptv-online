import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Client } from '../types';
import { CyberDateInput } from './CyberDateInput';
import { parseDateString, formatDateStringForDisplay } from '../utils/date';

interface CyberRenewClientModalProps {
    client: Client;
    onConfirm: (newDate: string) => void;
    onClose: () => void;
}

const CyberRenewClientModal: React.FC<CyberRenewClientModalProps> = ({ client, onConfirm, onClose }) => {
    const [newDate, setNewDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Calculate default renewal date: 30 days from now or from current expiration if valid and in future
        const today = new Date();
        let baseDate = today;

        if (client.vencimento) {
            const currentExp = parseDateString(client.vencimento);
            if (currentExp && currentExp > today) {
                baseDate = currentExp;
            }
        }

        const nextMonth = new Date(baseDate);
        nextMonth.setDate(baseDate.getDate() + 30);

        const yyyy = nextMonth.getFullYear();
        const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
        const dd = String(nextMonth.getDate()).padStart(2, '0');

        setNewDate(`${yyyy}-${mm}-${dd}`);
    }, [client]);

    const handleConfirm = () => {
        if (!newDate) return;
        setLoading(true);
        // Simulate a small delay for better UX
        setTimeout(() => {
            onConfirm(newDate);
            setLoading(false);
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass rounded-2xl p-6 w-full max-w-md mx-4 border border-cyan-500/30 shadow-2xl bg-[#0a0a0f]"
            >
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                            <ClockIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Renovar Assinatura</h2>
                            <p className="text-sm text-gray-400">{client.nome}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">Vencimento Atual</span>
                        </div>
                        <div className="text-lg font-medium text-white">
                            {formatDateStringForDisplay(client.vencimento)}
                        </div>
                    </div>

                    <div>
                        <CyberDateInput
                            label="Nova Data de Vencimento"
                            value={newDate}
                            onChange={setNewDate}
                            calendar={true}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Por padrão, sugerimos 30 dias a partir de hoje ou do vencimento atual.
                        </p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleConfirm}
                            disabled={loading || !newDate}
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <ClockIcon className="w-5 h-5" />
                                    Confirmar Renovação
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CyberRenewClientModal;
