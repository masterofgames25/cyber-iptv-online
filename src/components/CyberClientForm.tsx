import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Client, Plan } from '../types';
import { sanitizeText } from '../utils/format';
import { normalizePhoneNumber } from '../utils/phoneUtils';
import { parseDateString } from '../utils/date';
import { CyberDateInput } from './CyberDateInput';
import { useSystemData } from '../utils/systemData';
import { useData } from '../context/DataContext';

interface CyberClientFormProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (clientData: any) => void;
  initialData?: {
    nome?: string;
    whatsapp?: string;
    observacoes?: string;
    servidor?: string;
  };
}

const CyberClientForm: React.FC<CyberClientFormProps> = ({
  client,
  onClose,
  onSave,
  initialData
}) => {
  const unique = <T,>(arr: T[]) => Array.from(new Set((arr || []).filter(Boolean))) as T[];
  const { updateClient, planos, servidores, formasPagamento, dispositivos, aplicativos, prospeccoes } = useData();
  const [activeTab, setActiveTab] = useState<'main' | 'subscription' | 'connection'>('main');
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    login: '',
    senha: '',
    plano: '',
    valor: '',
    ativacao: '',
    vencimento: '',
    formaPagamento: '',
    statusPagamento: 'Pago',
    servidor: '',
    dispositivo: '',
    aplicativo: '',
    macAddress: '',
    chaveDispositivo: '',
    prospeccao: '',
    situacao: 'Ativo' as 'Ativo' | 'Inativo',
    listaM3U: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vencimentoSaved, setVencimentoSaved] = useState(false);
  const { getPlans, getServers, getPaymentMethods, getDevices, getApplications, getLeadSources, getServerCostMap, getServerCreditPriceMap } = useSystemData();
  const [plans, setPlans] = useState<Plan[]>(() => getPlans());
  const [servers, setServers] = useState<string[]>(() => unique(getServers()));
  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => unique(getPaymentMethods()));
  const [devices, setDevices] = useState<string[]>(() => unique(getDevices()));
  const [apps, setApps] = useState<string[]>(() => unique(getApplications()));
  const [leadSources, setLeadSources] = useState<string[]>(() => unique(getLeadSources()));
  const [openServerSelect, setOpenServerSelect] = useState(false);
  const [openDeviceSelect, setOpenDeviceSelect] = useState(false);
  const [openAppSelect, setOpenAppSelect] = useState(false);

  useEffect(() => {
    setPlans(getPlans());
    setServers(unique(getServers()));
    setPaymentMethods(unique(getPaymentMethods()));
    setDevices(unique(getDevices()));
    setApps(unique(getApplications()));
    setLeadSources(unique(getLeadSources()));
  }, []);

  useEffect(() => {
    setPlans(getPlans());
    setServers(unique(getServers()));
    setPaymentMethods(unique(getPaymentMethods()));
    setDevices(unique(getDevices()));
    setApps(unique(getApplications()));
    setLeadSources(unique(getLeadSources()));
  }, [planos, servidores, formasPagamento, dispositivos, aplicativos, prospeccoes]);

  useEffect(() => {
    const handler = () => {
      setPlans(getPlans());
      setServers(unique(getServers()));
      setPaymentMethods(unique(getPaymentMethods()));
      setDevices(unique(getDevices()));
      setApps(unique(getApplications()));
      setLeadSources(unique(getLeadSources()));
    };
    window.addEventListener('settingsUpdated', handler);
    return () => window.removeEventListener('settingsUpdated', handler);
  }, []);

  useEffect(() => {
    if (!client && leadSources.length > 0) {
      setFormData(prev => ({
        ...prev,
        prospeccao: leadSources.includes(prev.prospeccao) ? prev.prospeccao : (leadSources[0] || '')
      }));
    }
  }, [leadSources, client]);

  useEffect(() => {
    if (client) {
      setFormData({
        nome: client.nome || '',
        whatsapp: normalizePhoneNumber(client.whatsapp || ''),
        login: client.login || '',
        senha: client.senha || '',
        plano: client.plano || '',
        valor: client.valor != null ? String(client.valor) : '',
        ativacao: client.ativacao || '',
        vencimento: client.vencimento || '',
        formaPagamento: client.formaPagamento || '',
        statusPagamento: client.statusPagamento || 'Pago',
        servidor: client.servidor || '',
        dispositivo: client.dispositivo || '',
        aplicativo: client.aplicativo || '',
        macAddress: client.macAddress || '',
        chaveDispositivo: client.chaveDispositivo || '',
        prospeccao: client.prospeccao || '',
        situacao: client.situacao || 'Ativo',
        listaM3U: client.listaM3U || '',
        observacoes: client.observacoes || ''
      });
    } else if (initialData) {
      const today = getTodayISO();
      const mensal = plans.find(p => p.name.toLowerCase() === 'mensal');
      const defaultPlan = mensal || plans[0];
      const months = defaultPlan ? defaultPlan.months : 1;
      const venc = getExpiration(today, months);
      setFormData(prev => ({
        ...prev,
        nome: initialData.nome || '',
        whatsapp: normalizePhoneNumber(initialData.whatsapp || ''),
        observacoes: initialData.observacoes || '',
        servidor: initialData.servidor || prev.servidor,
        ativacao: today,
        plano: defaultPlan ? defaultPlan.name : prev.plano,
        vencimento: venc,
        statusPagamento: 'Pago',
        formaPagamento: 'PIX'
      }));
    } else {
      const today = getTodayISO();
      const mensal = plans.find(p => p.name.toLowerCase() === 'mensal');
      const defaultPlan = mensal || plans[0];
      const months = defaultPlan ? defaultPlan.months : 1;
      const venc = getExpiration(today, months);
      setFormData(prev => ({
        ...prev,
        ativacao: today,
        plano: defaultPlan ? defaultPlan.name : prev.plano,
        vencimento: venc,
        statusPagamento: 'Pago',
        formaPagamento: 'PIX'
      }));
    }
  }, [client, initialData]);

  const formatMACAddress = (value: string) => {
    const cleanValue = value.replace(/[^a-fA-F0-9]/g, '');
    if (cleanValue.length > 12) return value;

    const formatted = cleanValue.match(/.{1,2}/g)?.join(':') || '';
    return formatted.toUpperCase();
  };

  const getExpiration = (activationDate: string, planMonths: number): string => {
    try {
      const activation = parseDateString(activationDate);
      if (!activation) return '';

      const parsed = parseDateString(String(activation));
      const expiration = parsed || new Date(activation);
      expiration.setMonth(expiration.getMonth() + planMonths);

      return expiration.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const getTodayISO = (): string => {
    const nowInBrazil = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    );
    const year = nowInBrazil.getFullYear();
    const month = (nowInBrazil.getMonth() + 1).toString().padStart(2, '0');
    const day = nowInBrazil.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (formData.ativacao && formData.plano && !client) {
      const selectedPlan = plans.find(p => p.name === formData.plano);
      if (selectedPlan) {
        const newExpiration = getExpiration(formData.ativacao, selectedPlan.months);
        if (newExpiration && newExpiration !== formData.vencimento) {
          setFormData(prev => ({ ...prev, vencimento: newExpiration }));
        }
      }
    }
  }, [formData.ativacao, formData.plano]);

  useEffect(() => {
    if (formData.plano) {
      const selectedPlan = plans.find(p => p.name === formData.plano);
      if (selectedPlan) {
        setFormData(prev => ({ ...prev, valor: selectedPlan.price.toString() }));
      }
    }
  }, [formData.plano]);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'macAddress') {
      value = formatMACAddress(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'vencimento' && client && client.id) {
      try {
        const d = parseDateString(String(value));
        const iso = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : String(value);
        window.dispatchEvent(new CustomEvent('clientDatePreviewChanged', { detail: { id: client.id, vencimento: iso } }));
        if (!d) {
          setErrors(prev => ({ ...prev, vencimento: 'Data inválida' }));
          setVencimentoSaved(false);
          return;
        }
        const today = new Date();
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const candidate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (candidate < todayLocal) {
          setErrors(prev => ({ ...prev, vencimento: 'Data não pode ser anterior à data atual' }));
          setVencimentoSaved(false);
          return;
        }
        const updated = { ...client, vencimento: iso };
        updateClient(updated as any);
        setVencimentoSaved(true);
      } catch { }
    }
  };

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

    if (!formData.login.trim()) {
      newErrors.login = 'Login é obrigatório';
    }

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    }

    if (formData.valor) {
      const valorFloat = parseFloat(formData.valor.replace(',', '.'));
      if (isNaN(valorFloat) || valorFloat <= 0) {
        newErrors.valor = 'Valor inválido';
      }
    }

    if (formData.ativacao) {
      const activationDate = parseDateString(formData.ativacao);
      if (!activationDate) {
        newErrors.ativacao = 'Data de ativação inválida';
      }
    }

    if (formData.vencimento) {
      const expirationDate = parseDateString(formData.vencimento);
      if (!expirationDate) {
        newErrors.vencimento = 'Data de vencimento inválida';
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

    const clientData = {
      ...formData,
      nome: sanitizeText(formData.nome),
      whatsapp: normalizePhoneNumber(formData.whatsapp),
      valor: parseFloat(formData.valor.replace(',', '.')),
      observacoes: sanitizeText(formData.observacoes)
    };

    if (client) {
      onSave({ ...clientData, id: client.id });
    } else {
      onSave(clientData);
    }
  };

  const handleWhatsAppChange = (value: string) => {
    handleInputChange('whatsapp', value);
  };

  const formatCurrencyBR = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    const parsed = Number(digitsOnly) / 100;
    if (isNaN(parsed)) return '';
    return parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCurrencyChange = (value: string) => {
    const formatted = formatCurrencyBR(value);
    handleInputChange('valor', formatted);
  };

  const renderMainSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            value={formData.nome ?? ''}
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
            value={formData.whatsapp ?? ''}
            onChange={(e) => handleWhatsAppChange(e.target.value)}
            className={`w-full px-3 py-2 input-cyber ${errors.whatsapp ? 'border-red-500' : ''
              }`}
            placeholder="Ex: 5511999999999 ou +351..."
          />
          {errors.whatsapp && (
            <p className="mt-1 text-sm text-red-400">{errors.whatsapp}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Login *
          </label>
          <input
            type="text"
            value={formData.login ?? ''}
            onChange={(e) => handleInputChange('login', e.target.value)}
            className={`w-full px-3 py-2 input-cyber ${errors.login ? 'border-red-500' : ''
              }`}
            placeholder="Login de acesso"
          />
          {errors.login && (
            <p className="mt-1 text-sm text-red-400">{errors.login}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Senha *
          </label>
          <input
            type="text"
            value={formData.senha ?? ''}
            onChange={(e) => handleInputChange('senha', e.target.value)}
            className={`w-full px-3 py-2 input-cyber ${errors.senha ? 'border-red-500' : ''
              }`}
            placeholder="Senha de acesso"
          />
          {errors.senha && (
            <p className="mt-1 text-sm text-red-400">{errors.senha}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prospecção
          </label>
          <select
            value={formData.prospeccao}
            onChange={(e) => handleInputChange('prospeccao', e.target.value)}
            className="w-full px-3 py-2 select-cyber"
          >
            {leadSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Situação
          </label>
          <select
            value={formData.situacao}
            onChange={(e) => handleInputChange('situacao', e.target.value)}
            className="w-full px-3 py-2 select-cyber"
          >
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-purple-900/10 to-cyan-900/10 rounded-xl p-1 border border-purple-500/30">
        <div className="bg-black/40 rounded-lg p-4">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Observações
          </label>
          <textarea
            value={formData.observacoes ?? ''}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-black/50 text-white rounded-lg border-2 border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:bg-black/70 resize-none transition-all duration-300 placeholder-gray-500"
            placeholder="Observações sobre o cliente..."
          />
        </div>
      </div>
    </div>
  );

  const renderSubscriptionSection = () => (
    <div className="space-y-4">
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
        <p className="text-yellow-400 text-sm">
          <strong>Atenção:</strong> O vencimento e valor são preenchidos automaticamente com base no plano, mas podem ser alterados manualmente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Plano
          </label>
          <select
            value={formData.plano}
            onChange={(e) => handleInputChange('plano', e.target.value)}
            className="w-full px-3 py-2 select-cyber"
          >
            <option value="">Selecione um plano</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.name}>
                {plan.name} - R$ {plan.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Valor (R$) *
          </label>
          <input
            type="text"
            value={formData.valor ?? ''}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={`w-full px-3 py-2 input-cyber ${errors.valor ? 'border-red-500' : ''
              }`}
            placeholder="0,00"
          />
          {errors.valor && (
            <p className="mt-1 text-sm text-red-400">{errors.valor}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CyberDateInput
          value={formData.ativacao}
          onChange={(value) => handleInputChange('ativacao', value)}
          className={`w-full px-3 py-2 input-cyber ${errors.ativacao ? 'border-red-500' : ''}`}
          label="Ativação *"
          error={errors.ativacao}
          calendar
        />

        <CyberDateInput
          value={formData.vencimento}
          onChange={(value) => handleInputChange('vencimento', value)}
          className={`w-full px-3 py-2 input-cyber ${errors.vencimento ? 'border-red-500' : ''}`}
          label="Vencimento *"
          error={errors.vencimento}
          calendar
        />
        {vencimentoSaved && !errors.vencimento && (
          <div className="text-green-400 text-xs font-semibold">Data de vencimento atualizada</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Forma de Pagamento
          </label>
          <select
            value={formData.formaPagamento}
            onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
            className="w-full px-3 py-2 select-cyber"
          >
            <option value="">Selecione a forma de pagamento</option>
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status do Pagamento
          </label>
          <select
            value={formData.statusPagamento}
            onChange={(e) => handleInputChange('statusPagamento', e.target.value)}
            className="w-full px-3 py-2 select-cyber"
          >
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderConnectionSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">Servidor</label>
          <button type="button" onClick={() => { setServers(unique(getServers())); setOpenServerSelect(v => !v); }} className="w-full px-3 py-2 select-cyber flex items-center justify-between">
            <span>{formData.servidor || 'Selecione o servidor'}</span>
            <span>▾</span>
          </button>
          {openServerSelect && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[60] mt-2 w-full rounded-xl p-2 max-h-52 overflow-auto shadow-xl border border-purple-500/50 bg-gradient-to-br from-[#0a0a0f] via-[#0a0a0f] to-[#0a0a0f]">
              {servers.map(server => (
                <button key={server} type="button" onClick={() => { handleInputChange('servidor', server); setOpenServerSelect(false); }} className="w-full text-left py-2 px-2 rounded hover:bg-[#12121a] transition text-white text-sm">
                  {server}
                </button>
              ))}
            </motion.div>
          )}
          {formData.servidor && (
            <div className="mt-2 text-xs text-gray-300">
              <span className="inline-block mr-3">Custo: R$ {Number(getServerCostMap()[formData.servidor] || 0).toFixed(2)}</span>
              <span className="inline-block">Crédito: R$ {Number(getServerCreditPriceMap()[formData.servidor] || 0).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">Dispositivo</label>
          <button type="button" onClick={() => { setDevices(unique(getDevices())); setOpenDeviceSelect(v => !v); }} className="w-full px-3 py-2 select-cyber flex items-center justify-between">
            <span>{formData.dispositivo || 'Selecione o dispositivo'}</span>
            <span>▾</span>
          </button>
          {openDeviceSelect && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[60] mt-2 w-full rounded-xl p-2 max-h-52 overflow-auto shadow-xl border border-purple-500/50 bg-gradient-to-br from-[#0a0a0f] via-[#0a0a0f] to-[#0a0a0f]">
              {devices.map(device => (
                <button key={device} type="button" onClick={() => { handleInputChange('dispositivo', device); setOpenDeviceSelect(false); }} className="w-full text-left py-2 px-2 rounded hover:bg-[#12121a] transition text-white text-sm">
                  {device}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">Aplicativo</label>
          <button type="button" onClick={() => { setApps(unique(getApplications())); setOpenAppSelect(v => !v); }} className="w-full px-3 py-2 select-cyber flex items-center justify-between">
            <span>{formData.aplicativo || 'Selecione o aplicativo'}</span>
            <span>▾</span>
          </button>
          {openAppSelect && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[60] mt-2 w-full rounded-xl p-2 max-h-52 overflow-auto shadow-xl border border-purple-500/50 bg-gradient-to-br from-[#0a0a0f] via-[#0a0a0f] to-[#0a0a0f]">
              {apps.map(app => (
                <button key={app} type="button" onClick={() => { handleInputChange('aplicativo', app); setOpenAppSelect(false); }} className="w-full text-left py-2 px-2 rounded hover:bg[#12121a] transition text-white text-sm">
                  {app}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Endereço MAC
          </label>
          <input
            type="text"
            value={formData.macAddress}
            onChange={(e) => handleInputChange('macAddress', e.target.value)}
            className="w-full px-3 py-2 input-cyber"
            placeholder="XX:XX:XX:XX:XX:XX"
            maxLength={17}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Chave do Dispositivo
        </label>
        <input
          type="text"
          value={formData.chaveDispositivo}
          onChange={(e) => handleInputChange('chaveDispositivo', e.target.value)}
          className="w-full px-3 py-2 input-cyber"
          placeholder="Chave do dispositivo"
        />
      </div>

      <div className="relative bg-gradient-to-br from-purple-900/10 to-cyan-900/10 rounded-xl p-1 border border-purple-500/30">
        <div className="bg-black/40 rounded-lg p-4">
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Lista M3U
          </label>
          <textarea
            value={formData.listaM3U ?? ''}
            onChange={(e) => handleInputChange('listaM3U', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-black/50 text-white rounded-lg border-2 border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 focus:bg-black/70 resize-none transition-all duration-300 placeholder-gray-500"
            placeholder="URL da lista M3U"
          />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return renderMainSection();
      case 'subscription':
        return renderSubscriptionSection();
      case 'connection':
        return renderConnectionSection();
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={false}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-xl p-6 w-full max-w-[90vw] min-h-[70vh] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Three Panels for large screens */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 mb-6">
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-cyber-secondary mb-3">Dados Principais</h3>
              {renderMainSection()}
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-cyber-secondary mb-3">Assinatura</h3>
              {renderSubscriptionSection()}
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="text-sm font-semibold text-cyber-secondary mb-3">Conexão</h3>
              {renderConnectionSection()}
            </div>
          </div>

          {/* Tabs for small screens */}
          <div className="md:hidden mb-4 cyber-input-group p-1 flex">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'main'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Dados Principais
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'subscription'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Assinatura
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('connection')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'connection'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Conexão
            </button>
          </div>

          {/* Single panel content for small screens */}
          <div className="md:hidden">
            {renderTabContent()}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-purple-500/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors w-full"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 w-full"
            >
              {client ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CyberClientForm;
