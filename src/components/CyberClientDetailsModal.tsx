import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    UserIcon,
    PhoneIcon,
    ServerIcon,
    DevicePhoneMobileIcon,
    CubeIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    IdentificationIcon,
    ClipboardDocumentIcon,
    EyeIcon,
    EyeSlashIcon,
    KeyIcon,
    CpuChipIcon,
    WifiIcon
} from '@heroicons/react/24/outline';
import { Client } from '../types';
import { formatPhone, formatCurrency } from '../utils/format';
import { formatDateStringForDisplay } from '../utils/date';
import { useCyberpunkNotification } from './CyberpunkNotification';

interface CyberClientDetailsModalProps {
    client: Client;
    onClose: () => void;
}

const CyberClientDetailsModal: React.FC<CyberClientDetailsModalProps> = ({ client, onClose }) => {
    const { addNotification } = useCyberpunkNotification();
    const [showPassword, setShowPassword] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        addNotification({
            type: 'success',
            title: 'Copiado!',
            message: `${label} copiado para a área de transferência.`,
            duration: 2000,
            autoClose: true,
            read: false,
            priority: 'low'
        });
    };

    const DetailItem = ({ label, value, icon: Icon, copyable = false, isPassword = false, highlight = false }: any) => {
        const displayValue = isPassword && !showPassword ? '••••••••' : (value || '-');

        return (
            <div className={`p-3 rounded-xl border ${highlight ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'} hover:border-white/20 transition-colors group`}>
                <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${highlight ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className={`font-mono text-sm truncate ${highlight ? 'text-cyan-100 font-bold' : 'text-gray-200'}`}>
                        {displayValue}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPassword && (
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title={showPassword ? "Ocultar" : "Mostrar"}
                            >
                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        )}
                        {copyable && value && (
                            <button
                                onClick={() => copyToClipboard(value, label)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title="Copiar"
                            >
                                <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass rounded-2xl w-full max-w-4xl border border-cyan-500/30 shadow-2xl bg-[#0a0a0f] overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                            <UserIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{client.nome}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${client.situacao === 'Ativo'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                    }`}>
                                    {client.situacao.toUpperCase()}
                                </span>
                                <span className="text-gray-500 text-sm">•</span>
                                <span className="text-gray-400 text-sm font-mono">ID: {client.id}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Coluna 1: Identificação e Acesso */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase tracking-wider">
                                <IdentificationIcon className="w-4 h-4" />
                                Identificação e Acesso
                            </h3>
                            <div className="space-y-3">
                                <DetailItem
                                    label="Usuário / Login"
                                    value={client.login}
                                    icon={UserIcon}
                                    copyable
                                    highlight
                                />
                                <DetailItem
                                    label="Senha"
                                    value={client.senha}
                                    icon={KeyIcon}
                                    copyable
                                    isPassword
                                />
                                <DetailItem
                                    label="WhatsApp"
                                    value={formatPhone(client.whatsapp)}
                                    icon={PhoneIcon}
                                    copyable
                                />
                                <DetailItem
                                    label="Nome Completo"
                                    value={client.nome}
                                    icon={IdentificationIcon}
                                    copyable
                                />
                            </div>
                        </div>

                        {/* Coluna 2: Assinatura e Financeiro */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-purple-400 uppercase tracking-wider">
                                <CurrencyDollarIcon className="w-4 h-4" />
                                Assinatura
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <DetailItem
                                        label="Plano"
                                        value={client.plano}
                                        icon={CubeIcon}
                                    />
                                    <DetailItem
                                        label="Valor"
                                        value={formatCurrency(client.valor)}
                                        icon={CurrencyDollarIcon}
                                        highlight
                                    />
                                </div>
                                <DetailItem
                                    label="Vencimento"
                                    value={formatDateStringForDisplay(client.vencimento)}
                                    icon={CalendarIcon}
                                    highlight
                                />
                                <DetailItem
                                    label="Data de Ativação"
                                    value={formatDateStringForDisplay(client.ativacao)}
                                    icon={CalendarIcon}
                                />
                                <DetailItem
                                    label="Status Pagamento"
                                    value={client.statusPagamento}
                                    icon={CurrencyDollarIcon}
                                />
                            </div>
                        </div>

                        {/* Coluna 3: Dados Técnicos */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-pink-400 uppercase tracking-wider">
                                <CpuChipIcon className="w-4 h-4" />
                                Dados Técnicos
                            </h3>
                            <div className="space-y-3">
                                <DetailItem
                                    label="Servidor"
                                    value={client.servidor}
                                    icon={ServerIcon}
                                />
                                <DetailItem
                                    label="Aplicativo"
                                    value={client.aplicativo}
                                    icon={CubeIcon}
                                />
                                <DetailItem
                                    label="Dispositivo"
                                    value={client.dispositivo}
                                    icon={DevicePhoneMobileIcon}
                                />
                                <DetailItem
                                    label="Endereço MAC"
                                    value={client.macAddress}
                                    icon={WifiIcon}
                                    copyable
                                />
                                <DetailItem
                                    label="Chave do Dispositivo"
                                    value={client.chaveDispositivo}
                                    icon={KeyIcon}
                                    copyable
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observações - Full Width */}
                    {client.observacoes && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Observações</h3>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-gray-300 text-sm leading-relaxed font-mono">
                                {client.observacoes}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium border border-white/5 hover:border-white/20"
                    >
                        Fechar Visualização
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default CyberClientDetailsModal;
