import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Reseller } from '../../types';

interface ConfirmationModalProps {
    isOpen: boolean;
    reseller: Reseller | null;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    reseller,
    loading,
    onConfirm,
    onCancel
}) => {
    const confirmResellerBtnRef = useRef<HTMLButtonElement | null>(null);
    const cancelResellerBtnRef = useRef<HTMLButtonElement | null>(null);

    return (
        <AnimatePresence>
            {isOpen && reseller && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') onCancel();
                        if (e.key === 'Enter' && !loading) {
                            onConfirm();
                        }
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const next = document.activeElement === confirmResellerBtnRef.current ? cancelResellerBtnRef.current : confirmResellerBtnRef.current;
                            next?.focus();
                        }
                    }}
                >
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-6 w-full max-w-md border border-purple-500/50 shadow-2xl bg-gradient-to-br from-[#0a0a0f] via-[#0b0b13] to-[#0a0a0f]">
                        <div className="flex items-center gap-2 mb-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-pink-400" />
                            <h3 id="confirm-reseller-title" className="text-lg font-semibold text-white">Tem certeza que deseja excluir este revendedor?</h3>
                        </div>
                        <p id="confirm-reseller-desc" className="text-sm text-gray-300 mb-4">Esta ação é irreversível. Confira os detalhes antes de confirmar.</p>
                        <div className="rounded-xl p-3 border border-purple-500/40 bg-[#12121a] mb-4 shadow-inner">
                            <div className="text-white font-semibold">{reseller.nome}</div>
                            <div className="text-cyber-secondary text-sm">WhatsApp: {reseller.whatsapp}</div>
                            <div className="text-cyber-secondary text-sm">Servidor: {reseller.servidor}</div>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={loading}
                                onClick={onConfirm}
                                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg ring-1 ring-pink-400/50 shadow-[0_0_12px_#ff00ff]"
                                ref={confirmResellerBtnRef}
                            >
                                Confirmar
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onCancel}
                                className="flex-1 bg-[#12121a] border border-cyan-500/50 text-white px-4 py-2 rounded-lg hover:border-cyan-400 transition-colors ring-1 ring-cyan-400/30"
                                ref={cancelResellerBtnRef}
                            >
                                Cancelar
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
