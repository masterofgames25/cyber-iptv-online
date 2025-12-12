import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Test } from '../types';
import { Plus, Clock, User } from 'lucide-react';
import { useSystemData } from '../utils/systemData';
import { normalizePhoneNumber } from '../utils/phoneUtils';
import { useData } from '../context/DataContext';

interface CyberTestFormProps {
  onTestCreated?: (test: Test) => void;
  onTestUpdated?: (test: Test) => void;
  onCancel?: () => void;
  test?: Test | null;
  clientName?: string;
}

const CyberTestForm: React.FC<CyberTestFormProps> = ({ onTestCreated, onTestUpdated, onCancel, test = null, clientName = '' }) => {
  const { getServers } = useSystemData();
  const servers = getServers();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = new Date();
  const initialDateBR = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
  const initialTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
  const [formData, setFormData] = useState({
    clientName: clientName,
    whatsapp: '',
    server: servers[0] || '',
    startDateBR: initialDateBR,
    startTime: initialTime,
    durationHours: 3,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<null | boolean>(null);

  const { addTest, updateTest } = useData();

  // Populate form when editing a test
  React.useEffect(() => {
    if (test) {
      const start = test.startAt ? new Date(test.startAt) : new Date(`${test.startDate}T00:00:00`);
      const end = test.endAt ? new Date(test.endAt) : new Date(`${test.endDate}T00:00:00`);
      const pad2 = (n: number) => String(n).padStart(2, '0');
      const startDateBR = `${pad2(start.getDate())}/${pad2(start.getMonth() + 1)}/${start.getFullYear()}`;
      const startTime = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
      setFormData({
        clientName: test.clientName || '',
        whatsapp: normalizePhoneNumber(test.whatsapp || ''),
        server: test.server || servers[0] || '',
        startDateBR,
        startTime,
        durationHours: typeof test.durationHours === 'number' ? test.durationHours : Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000)),
        notes: test.notes || ''
      });
    } else {
      // reset to defaults, keep clientName prop
      setFormData(prev => ({
        ...prev,
        clientName: clientName,
        server: servers[0] || prev.server
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test]);

  const handleWhatsAppChange = (value: string) => {
    setFormData(prev => ({ ...prev, whatsapp: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isEdit = !!test;
    if (!formData.clientName.trim()) { setIsSubmitting(false); return; }
    if (!isEdit && !formData.whatsapp.trim()) { setIsSubmitting(false); return; }
    if (!formData.server.trim()) { setIsSubmitting(false); return; }
    const h = Number(formData.durationHours);
    if (isNaN(h) || h < 1 || h > 24) { setIsSubmitting(false); return; }
    const m = String(formData.startDateBR || '').match(/^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/);
    if (!m) { setIsSubmitting(false); return; }
    const dd = parseInt(m[1]);
    const mm = parseInt(m[2]) - 1;
    const yy = parseInt(m[3]);
    const t = String(formData.startTime || '00:00').match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    const hh = t ? parseInt(t[1]) : 0;
    const min = t ? parseInt(t[2]) : 0;
    if (hh < 0 || hh > 23 || min < 0 || min > 59) { setIsSubmitting(false); return; }
    const start = new Date(yy, mm, dd, hh, min);
    const end = new Date(start);
    end.setHours(end.getHours() + h);
    const payload: Omit<Test, 'id'> = {
      clientId: 0,
      clientName: formData.clientName,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      status: 'active',
      notes: formData.notes,
      whatsapp: normalizePhoneNumber(formData.whatsapp),
      server: formData.server,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      durationHours: h
    };

    if (test) {
      const updated: Test = {
        id: test.id,
        clientId: test.clientId || 0,
        clientName: payload.clientName,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: test.status,
        notes: payload.notes,
        whatsapp: payload.whatsapp,
        server: payload.server,
        startAt: payload.startAt,
        endAt: payload.endAt,
        durationHours: payload.durationHours
      };
      await updateTest(updated);
      setIsSubmitting(false);
      if (onTestUpdated) onTestUpdated(updated);
      if (onCancel) onCancel();
      return;
    }

    try {
      const newTest = await addTest(payload);

      // Reset form
      const now = new Date();
      const resetDateBR = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
      const resetTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setFormData({
        clientName: '',
        whatsapp: '',
        server: servers[0] || '',
        startDateBR: resetDateBR,
        startTime: resetTime,
        durationHours: 3,
        notes: ''
      });

      setIsSubmitting(false);

      // Notify parent
      if (onTestCreated) onTestCreated(newTest);
    } catch (err) {
      console.error('Erro ao criar teste:', err);
      alert('Erro ao criar teste. Verifique as permissões do banco de dados.');
      setIsSubmitting(false);
    }
  };

  const handleQuickTest = (hours: number) => {
    setFormData({ ...formData, durationHours: hours });
  };

  const validateServerConnection = async (): Promise<boolean> => {
    if (!formData.server) return false;
    await new Promise(res => setTimeout(res, 400));
    return servers.includes(formData.server);
  };

  const handleValidateClick = async () => {
    setValidating(true);
    setValidated(null);
    try {
      const ok = await validateServerConnection();
      setValidated(ok);
    } finally {
      setValidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6 cyberpunk-border"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Clock className="w-6 h-6 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-white">{test ? 'Editar Teste' : 'Criar Teste Gratuito'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Nome do Cliente
          </label>
          <input
            type="text"
            required
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input"
            placeholder="Digite o nome do cliente"
            tabIndex={-1}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">WhatsApp{test ? ' (opcional)' : ''}</label>
            <input
              type="text"
              required={!test}
              value={formData.whatsapp}
              onChange={(e) => handleWhatsAppChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input"
              placeholder="Ex: 5511999999999 ou +351..."
              tabIndex={-1}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Servidor</label>
            <select
              aria-hidden="true"
              value={formData.server}
              onChange={(e) => { setFormData({ ...formData, server: e.target.value }); setValidated(null); }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input"
              tabIndex={-1}
            >
              {servers.length === 0 && <option value="">Nenhum servidor cadastrado</option>}
              {servers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Início (data)</label>
            <input
              type="text"
              required
              value={formData.startDateBR}
              onChange={(e) => setFormData({ ...formData, startDateBR: e.target.value })}
              placeholder="dd/mm/aaaa"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input"
              tabIndex={-1}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Hora</label>
            <input
              type="text"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              placeholder="HH:mm"
              inputMode="numeric"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input"
              tabIndex={-1}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Duração (horas)</label>
            <input
              type="number"
              min={1}
              max={24}
              required
              value={formData.durationHours}
              onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input"
              tabIndex={-1}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Duração Rápida</label>
          <div className="flex gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickTest(1)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              tabIndex={-1}
            >
              1h
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickTest(3)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              tabIndex={-1}
            >
              3h
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickTest(6)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              tabIndex={-1}
            >
              6h
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickTest(12)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              tabIndex={-1}
            >
              12h
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleValidateClick}
            disabled={!formData.server || validating}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            tabIndex={-1}
          >
            {validating ? 'Validando...' : 'Testar Conexão'}
          </motion.button>
          {validated === true && <span className="text-green-400 text-sm">Servidor OK</span>}
          {validated === false && <span className="text-red-400 text-sm">Falha na conexão</span>}
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">Observações</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none cyberpunk-input resize-none"
            placeholder="Notas adicionais sobre o teste..."
            tabIndex={-1}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-magenta-500 text-white rounded-lg font-semibold cyberpunk-button disabled:opacity-50 disabled:cursor-not-allowed"
          tabIndex={-1}
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {isSubmitting ? (test ? 'Salvando...' : 'Criando Teste...') : (test ? 'Salvar Alterações' : 'Criar Teste Gratuito')}
        </motion.button>
      </form>

      <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-cyan-400 text-sm">
          💡 <strong>Dica:</strong> Testes gratuitos são ótimos para demonstrar o serviço e converter leads em clientes pagos!
        </p>
      </div>
    </motion.div>
  );
};

export default CyberTestForm;
