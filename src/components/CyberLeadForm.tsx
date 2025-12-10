import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Lead } from '../types';
import { sanitizeText } from '../utils/format';
import { normalizePhoneNumber } from '../utils/phoneUtils';
import { useSystemData } from '../utils/systemData';
import { useData } from '../context/DataContext';

interface CyberLeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
  onSave: (leadData: Omit<Lead, 'id' | 'createdAt'>) => void;
}

const CyberLeadForm: React.FC<CyberLeadFormProps> = ({ lead, onClose, onSave }) => {
  const { leads } = useData();
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    observacoes: '',
    status: 'Novo' as Lead['status'],
    source: '',
    category: 'new' as 'new' | 'ex-client',
    fromMigration: false,
    migratedFromClientId: undefined as number | undefined,
    migratedAt: undefined as string | undefined,
    originalExpiration: undefined as string | undefined,
    originalStatusPagamento: undefined as string | undefined,
    migrationReason: undefined as string | undefined,
    originalPlano: undefined as string | undefined,
    originalValor: undefined as string | undefined,
    contador_testes: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { getLeadSources } = useSystemData();

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome,
        whatsapp: normalizePhoneNumber(lead.whatsapp),
        observacoes: lead.observacoes || '',
        status: lead.status,
        source: lead.source,
        category: lead.category || 'new',
        fromMigration: lead.fromMigration || false,
        migratedFromClientId: lead.migratedFromClientId,
        migratedAt: lead.migratedAt,
        originalExpiration: lead.originalExpiration,
        originalStatusPagamento: lead.originalStatusPagamento,
        migrationReason: lead.migrationReason,
        originalPlano: lead.originalPlano,
        originalValor: lead.originalValor,
        contador_testes: lead.contador_testes || 0
      });
    }
  }, [lead]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório';
    } else {
      const normalized = normalizePhoneNumber(formData.whatsapp);
      if (!normalized || normalized.replace(/^\+/, '').length < 8) {
        newErrors.whatsapp = 'WhatsApp inválido';
      }
    }

    if (!formData.source.trim()) {
      newErrors.source = 'Prospecção é obrigatória';
    }

    const phone = normalizePhoneNumber(formData.whatsapp);
    if (phone) {
      const duplicate = (leads || []).some(l => {
        if (lead && l.id === lead.id) return false;
        return normalizePhoneNumber(l.whatsapp || '') === phone;
      });
      if (duplicate) {
        newErrors.whatsapp = 'WhatsApp já cadastrado em outro lead';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const cleanData = {
      ...formData,
      nome: sanitizeText(formData.nome),
      whatsapp: normalizePhoneNumber(formData.whatsapp),
      observacoes: sanitizeText(formData.observacoes)
    };

    onSave(cleanData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleWhatsAppChange = (value: string) => {
    handleInputChange('whatsapp', value);
    const normalized = normalizePhoneNumber(value);
    if (normalized.replace(/^\+/, '').length >= 8) {
      const duplicate = (leads || []).some(l => {
        if (lead && l.id === lead.id) return false;
        return normalizePhoneNumber(l.whatsapp || '') === normalized;
      });
      if (duplicate) {
        setErrors(prev => ({ ...prev, whatsapp: 'WhatsApp já cadastrado em outro lead' }));
      }
    }
  };

  const leadSources = Array.from(new Set(getLeadSources().map(s => String(s).trim())));

  const statuses = [
    'Novo',
    'Contatado',
    'Não testou',
    'Convertido',
    'Perdido',
    'Ex-Clientes'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`w-full px-3 py-2 input-cyber ${errors.nome ? 'border-red-500' : ''
                }`}
              placeholder="Digite o nome completo"
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-400">{errors.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              WhatsApp *
            </label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => handleWhatsAppChange(e.target.value)}
              className={`w-full px-3 py-2 input-cyber ${errors.whatsapp ? 'border-red-500' : ''
                }`}
              placeholder="Ex: 5511999999999 ou +351..."
            />
            {errors.whatsapp && (
              <p className="mt-1 text-sm text-red-400">{errors.whatsapp}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prospecção *
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className={`w-full select-cyber ${errors.source ? 'border-red-500' : ''
                }`}
            >
              <option value="">Selecione a prospecção</option>
              {leadSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            {errors.source && (
              <p className="mt-1 text-sm text-red-400">{errors.source}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full select-cyber"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full select-cyber"
            >
              <option value="new">Novo Lead</option>
              <option value="ex-client">Ex-Cliente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 input-cyber resize-none"
              placeholder="Digite observações importantes sobre o lead"
            />
          </div>

          {formData.category === 'ex-client' && (
            <div className="space-y-3 p-4 bg-orange-900/10 border border-orange-500/30 rounded-lg">
              <h3 className="text-sm font-medium text-orange-400">Informações do Ex-Cliente</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Plano Anterior</label>
                  <input
                    type="text"
                    value={formData.originalPlano || ''}
                    onChange={(e) => handleInputChange('originalPlano', e.target.value)}
                    className="w-full px-2 py-1 input-cyber text-sm"
                    placeholder="Plano"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Valor</label>
                  <input
                    type="text"
                    value={formData.originalValor || ''}
                    onChange={(e) => handleInputChange('originalValor', e.target.value)}
                    className="w-full px-2 py-1 input-cyber text-sm"
                    placeholder="R$ 00,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Vencimento</label>
                <input
                  type="text"
                  value={formData.originalExpiration || ''}
                  onChange={(e) => handleInputChange('originalExpiration', e.target.value)}
                  className="w-full px-2 py-1 input-cyber text-sm"
                  placeholder="DD/MM/YYYY"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Motivo da Migração</label>
                <textarea
                  value={formData.migrationReason || ''}
                  onChange={(e) => handleInputChange('migrationReason', e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 input-cyber text-sm resize-none"
                  placeholder="Descreva o motivo da migração"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={Boolean(errors.whatsapp)}
              className={`flex-1 px-4 py-2 rounded-lg transition-all duration-300 text-white
                ${errors.whatsapp ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'}`}
            >
              {lead ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CyberLeadForm;
