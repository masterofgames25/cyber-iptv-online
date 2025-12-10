import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-4 right-4 z-[9999] p-4 bg-gray-900 border border-[#00ff9d] rounded-lg shadow-[0_0_20px_rgba(0,255,157,0.3)] max-w-sm"
                >
                    <div className="mb-3 text-white text-sm">
                        {offlineReady ? (
                            <span>App pronto para uso offline!</span>
                        ) : (
                            <span>Nova versão disponível. Atualizar agora?</span>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={close}
                            className="px-3 py-1 text-xs border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-colors"
                        >
                            FECHAR
                        </button>
                        {needRefresh && (
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="px-3 py-1 text-xs bg-[#00ff9d]/20 border border-[#00ff9d] text-[#00ff9d] rounded hover:bg-[#00ff9d]/30 transition-colors"
                            >
                                ATUALIZAR
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
