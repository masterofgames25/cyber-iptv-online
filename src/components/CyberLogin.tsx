import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CyberpunkLoader } from './CyberpunkLoader';

export const CyberLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (isSignUp && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.user && data.session) {
                    // User created and logged in automatically (if email confirm is off)
                    // Or just created
                }
                setSuccessMessage('Conta criada com sucesso! Verifique seu email se necessário.');
                if (!data.session) {
                    // If email confirmation is required, stays on login screen
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff9d] to-transparent opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent opacity-50"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 bg-gray-900/80 backdrop-blur-md p-8 rounded-lg border border-[#00ff9d]/30 shadow-[0_0_50px_rgba(0,255,157,0.1)] w-full max-w-md"
            >
                <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9d] to-[#00b8ff] uppercase tracking-widest">
                    Sistema Neural
                </h2>
                <p className="text-center text-gray-400 text-xs mb-6 tracking-wider">
                    {isSignUp ? 'INICIANDO PROTOCOLO DE REGISTRO' : 'AUTENTICAÇÃO NECESSÁRIA'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[#00ff9d] text-sm font-bold mb-2 tracking-wider">
                            IDENTIFICADOR (EMAIL)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-[#00ff9d]/50 rounded p-3 text-white focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all"
                            placeholder="agente@cyber.net"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[#ff00ff] text-sm font-bold mb-2 tracking-wider">
                            CHAVE DE ACESSO (SENHA)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-[#ff00ff]/50 rounded p-3 text-white focus:outline-none focus:border-[#ff00ff] focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {isSignUp && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <label className="block text-[#ff00ff] text-sm font-bold mb-2 tracking-wider">
                                    CONFIRMAR CHAVE
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-[#ff00ff]/50 rounded p-3 text-white focus:outline-none focus:border-[#ff00ff] focus:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all"
                                    placeholder="••••••••"
                                    required={isSignUp}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 bg-green-900/40 border border-green-500/50 rounded text-green-200 text-sm text-center"
                        >
                            {successMessage}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#00ff9d]/10 hover:bg-[#00ff9d]/20 border border-[#00ff9d] text-[#00ff9d] font-bold py-3 px-4 rounded transition-all transform hover:scale-[1.02] flex items-center justify-center group"
                    >
                        {loading ? (
                            <CyberpunkLoader size="sm" color="#00ff9d" />
                        ) : (
                            <span className="group-hover:tracking-widest transition-all duration-300">
                                {isSignUp ? 'REGISTRAR ACESSO' : 'ACESSAR SISTEMA'}
                            </span>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className="text-xs text-gray-500 hover:text-[#00ff9d] hover:underline tracking-wider transition-colors"
                        >
                            {isSignUp ? 'JÁ POSSUI ACESSO? ENTRAR' : 'NÃO POSSUI ACESSO? REGISTRAR'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
