// System data utility - now uses DataContext instead of localStorage
import { useContext } from 'react'
import { DataContext } from '../context/DataContext'

export const useSystemData = () => {
  const context = useContext(DataContext)
  
  // Return default values if no context is available (e.g., during testing)
  if (!context) {
    return {
      getPlans: () => [],
      getServers: () => ['Servidor 1', 'Servidor 2', 'Servidor 3'],
      getServersRaw: () => [],
      getPaymentMethods: () => ['Pix', 'Cartão', 'Boleto'],
      getDevices: () => ['TV Box', 'Smartphone', 'Tablet'],
      getDevicesRaw: () => [],
      getApplications: () => ['IPTV Smarters', 'Tivimate'],
      getApplicationsRaw: () => [],
      getLeadSources: () => ['Redes Sociais', 'Indicação', 'WhatsApp'],
      getServerCostMap: () => ({}),
      getServerCreditPriceMap: () => ({})
    }
  }

  const getPlans = () => {
    if (!context.planos) return []
    const items = context.planos
      .filter((p: any) => p.ativo !== false && !!p.nome)
      .map((p: any) => ({
        id: parseInt(p.id),
        name: String(p.nome).trim(),
        months: parseInt(String(p.meses).replace(/\D/g, '')) || 1,
        price: Number(p.preco) || 0
      }));
    const seen = new Set<string>();
    return items.filter(p => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const getServers = () => {
    if (!context.servidores) return []
    const list = context.servidores
      .filter((s: any) => s.ativo !== false && !!s.nome)
      .map((s: any) => String(s.nome).trim());
    return Array.from(new Set(list));
  };

  const getServersRaw = () => {
    if (!context.servidores) return []
    return context.servidores.map((s: any) => ({
      nome: s?.nome,
      ativo: s?.ativo !== false,
      descricao: s?.descricao,
      custo: Number(s?.custo) || 0,
      valorCredito: s?.valorCredito ?? s?.precoCredito ?? s?.preco
    })).filter((s: any) => !!s.nome);
  };

  const getServerCostMap = (): Record<string, number> => {
    if (!context.servidores) return {}
    const map: Record<string, number> = {};
    context.servidores.forEach((s: any) => {
      if (s && s.nome) {
        map[s.nome] = Number(s.custo) || 0;
      }
    });
    return map;
  };

  const getServerCreditPriceMap = (): Record<string, number> => {
    if (!context.servidores) return {}
    const map: Record<string, number> = {};
    context.servidores.forEach((s: any) => {
      if (s && s.nome) {
        const val =
          s.valorCredito !== undefined ? Number(s.valorCredito) :
          s.precoCredito !== undefined ? Number(s.precoCredito) :
          s.preco !== undefined ? Number(s.preco) : undefined;
        map[s.nome] = val ?? 0;
      }
    });
    return map;
  };

  const getPaymentMethods = () => {
    if (!context.formasPagamento) return []
    const list = context.formasPagamento
      .filter((f: any) => f.ativo !== false && !!f.nome)
      .map((f: any) => String(f.nome).trim());
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of list) {
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out;
  };

  const getDevices = () => {
    if (!context.dispositivos) return []
    const list = context.dispositivos
      .filter((d: any) => d.ativo !== false && !!d.nome)
      .map((d: any) => String(d.nome).trim());
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of list) {
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out;
  };

  const getDevicesRaw = () => {
    if (!context.dispositivos) return []
    return context.dispositivos.map((d: any) => ({
      nome: d?.nome,
      ativo: d?.ativo !== false,
      tipo: d?.tipo || 'outros',
      ultimaConexao: d?.ultimaConexao
    })).filter((d: any) => !!d.nome);
  };

  const getApplications = () => {
    if (!context.aplicativos) return []
    const list = context.aplicativos
      .filter((a: any) => a.ativo !== false && !!a.nome)
      .map((a: any) => String(a.nome).trim());
    const seen = new Set<string>();
    const out: string[] = [];
    for (const n of list) {
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out;
  };

  const getApplicationsRaw = () => {
    if (!context.aplicativos) return []
    return context.aplicativos.map((a: any) => ({
      nome: a?.nome,
      ativo: a?.ativo !== false,
      descricao: a?.descricao
    })).filter((a: any) => !!a.nome);
  };

  const getLeadSources = () => {
    if (!context.prospeccoes) return []
    const list = context.prospeccoes
      .filter((p: any) => p.ativo !== false && !!p.nome)
      .map((p: any) => String(p.nome).trim());
    const unique = Array.from(new Set(list));
    if (unique.length === 0) {
      return ['Redes Sociais', 'Indicação', 'WhatsApp', 'YouTube', 'Outros', 'Direto'];
    }
    return unique;
  };

  return {
    getPlans,
    getServers,
    getServersRaw,
    getPaymentMethods,
    getDevices,
    getDevicesRaw,
    getApplications,
    getApplicationsRaw,
    getLeadSources,
    getServerCostMap,
    getServerCreditPriceMap
  };
};