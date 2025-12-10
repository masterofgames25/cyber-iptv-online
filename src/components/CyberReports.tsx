import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useData } from '../context/DataContext'
import { useSystemData } from '../utils/systemData'
import { CyberpunkLineChart } from './CyberpunkLineChart'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid, LabelList, Legend } from 'recharts'
import { accessibleStroke } from '../utils/accessibility'
import { debounce } from '../utils/performance'
import { parseDateString, getExpirationStatus } from '../utils/date'

const NEON_PALETTE = ['#00FFFF', '#FF00FF', '#9400D3', '#C0C0C0', '#4682B4']

function brCurrency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const periods = [
  { id: 'month', label: 'Mensal (6 meses)', days: 180 },
  { id: 'year', label: 'Anual (12 meses)', days: 365 },
]

const CyberReports: React.FC = () => {
  const { clients, leads, revenueLog, tests, resellers, refreshAll } = useData()
  const { getPlans } = useSystemData()
  const [period, setPeriod] = useState(periods[0])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - period.days)
    return d
  }, [period])

  const filteredClients = useMemo(() => clients.filter(c => {
    const s = String((c as any).createdAt || c.ativacao || '')
    const parsed = s ? parseDateString(s) : null
    const d = parsed || (s ? new Date(s) : new Date())
    return d >= cutoff
  }), [clients, cutoff])
  const filteredRevenue = useMemo(() => revenueLog.filter(r => {
    const parsed = parseDateString(String(r.date))
    const d = parsed || new Date(r.date)
    return d >= cutoff
  }), [revenueLog, cutoff])

  const planMonthsMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {}
    try {
      (getPlans() || []).forEach((p: any) => { if (p?.name) map[p.name] = Number(p?.months) || 1 })
    } catch { }
    return map
  }, [getPlans])

  const monthsForPlan = (name: string = ''): number => {
    const key = String(name || '').trim()
    if (planMonthsMap[key]) return planMonthsMap[key]
    const low = key.toLowerCase()
    if (low.includes('trimes')) return 3
    if (low.includes('semes')) return 6
    if (low.includes('anual') || low.includes('ano')) return 12
    return 1
  }

  const activeClientsCount = useMemo(() => clients.filter(c => c.situacao === 'Ativo' && getExpirationStatus(c.vencimento).status !== 'Vencido').length, [clients])
  const revenueCycles = useMemo(() => {
    const actives = clients.filter(c => c.situacao === 'Ativo' && getExpirationStatus(c.vencimento).status !== 'Vencido')
    const byMonths = (m: number) => actives.filter(c => monthsForPlan(c.plano) === m).reduce((sum, c) => sum + (Number(c.valor) || 0), 0)
    return {
      mensal: byMonths(1),
      trimestral: byMonths(3),
      semestral: byMonths(6),
      anual: byMonths(12)
    }
  }, [clients])
  const arpu = useMemo(() => activeClientsCount ? (revenueCycles.mensal / activeClientsCount) : 0, [revenueCycles, activeClientsCount])
  const conversionRate = useMemo(() => {
    const inPeriodLeads = leads.filter(l => {
      const s = String(l.createdAt || '')
      const parsed = s ? parseDateString(s) : null
      const d = parsed || (s ? new Date(s) : new Date())
      return d >= cutoff
    })
    const converted = inPeriodLeads.filter(l => l.status === 'Convertido').length
    return inPeriodLeads.length ? (converted / inPeriodLeads.length) * 100 : 0
  }, [leads, cutoff])

  const clientsPerMonth = useMemo(() => {
    const monthsCount = period.days >= 365 ? 12 : 6
    const now = new Date()
    const windowStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1)
    const map = new Map<string, Set<number>>()

    // Count new subscriptions from revenueLog
    revenueLog
      .filter(r => r && r.type === 'subscription' && r.status !== 'reverted')
      .filter(r => {
        const parsed = parseDateString(String(r.date))
        const d = parsed || new Date(r.date)
        return d >= windowStart
      })
      .forEach(r => {
        const parsed = parseDateString(String(r.date))
        const d = parsed || new Date(r.date)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const set = map.get(ym) || new Set<number>()
        set.add(Number(r.clientId))
        map.set(ym, set)
      })

    // Historical chart strictly based on revenue transactions

    const series: { name: string; value: number }[] = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
      series.push({ name: label, value: (map.get(ym)?.size || 0) })
    }
    return series
  }, [revenueLog, period])

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, { label: string; ts: number; value: number }>()
    const monthsCount = period.days >= 365 ? 12 : 6
    const now = new Date()
    const windowStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1)

    // Sum revenue transactions (subscription + renewal) within the window, excluding reverted
    revenueLog
      .filter(r => r && r.date)
      .filter(r => {
        const parsed = parseDateString(String(r.date))
        const d = parsed || new Date(r.date)
        return d >= windowStart && r.status !== 'reverted'
      })
      .forEach(r => {
        const parsed = parseDateString(String(r.date))
        const d = parsed || new Date(r.date)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
        const ts = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
        const prev = map.get(ym)
        map.set(ym, { label, ts, value: (prev?.value || 0) + Number(r.amount || 0) })
      })

    // Historical chart strictly based on revenue transactions

    const series: { name: string; value: number; ts: number }[] = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
      const entry = map.get(ym)
      series.push({ name: label, value: entry?.value || 0, ts: d.getTime() })
    }
    return series
  }, [revenueLog, period])

  const recurringClientsByMonth = useMemo(() => {
    const monthsCount = period.days >= 365 ? 12 : 6
    const now = new Date()
    const windowStart = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1)
    const renewals = revenueLog
      .filter(r => r.type === 'renewal' && r.status !== 'reverted')
      .filter(r => {
        const parsed = parseDateString(String(r.date))
        const d = parsed || new Date(r.date)
        return d >= windowStart
      })
    const map = new Map<string, Set<number>>()
    renewals.forEach(r => {
      const parsed = parseDateString(String(r.date))
      const d = parsed || new Date(r.date)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const set = map.get(ym) || new Set<number>()
      set.add(Number(r.clientId))
      map.set(ym, set)
    })
    const series: { name: string; value: number }[] = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })
      series.push({ name: label, value: (map.get(ym)?.size || 0) })
    }
    return series
  }, [revenueLog, period])

  const activeReportClients = useMemo(() => clients.filter(c => c.situacao !== 'Inativo'), [clients])

  const plansDistribution = useMemo(() => {
    const map = new Map<string, number>()
    activeReportClients.forEach(c => map.set(c.plano || 'Mensal', (map.get(c.plano || 'Mensal') || 0) + 1))
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: NEON_PALETTE[i % NEON_PALETTE.length] }))
  }, [activeReportClients])

  const totalPlans = useMemo(() => (plansDistribution || []).reduce((s, e) => s + Number(e.value || 0), 0), [plansDistribution])

  const paymentDistribution = useMemo(() => {
    const map = new Map<string, number>()
    activeReportClients.forEach(c => map.set(c.formaPagamento || 'PIX', (map.get(c.formaPagamento || 'PIX') || 0) + 1))
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: NEON_PALETTE[i % NEON_PALETTE.length] }))
  }, [activeReportClients])

  const totalPayments = useMemo(() => (paymentDistribution || []).reduce((s, e) => s + Number(e.value || 0), 0), [paymentDistribution])

  const prospectionDistribution = useMemo(() => {
    const map = new Map<string, number>()
    activeReportClients.forEach(c => map.set(c.prospeccao || 'Direto', (map.get(c.prospeccao || 'Direto') || 0) + 1))
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: NEON_PALETTE[i % NEON_PALETTE.length] }))
  }, [activeReportClients])

  const totalProspection = useMemo(() => (prospectionDistribution || []).reduce((s, e) => s + Number(e.value || 0), 0), [prospectionDistribution])

  const serverDistribution = useMemo(() => {
    const map = new Map<string, number>()
    activeReportClients.forEach(c => map.set(c.servidor || 'N/A', (map.get(c.servidor || 'N/A') || 0) + 1))
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: NEON_PALETTE[i % NEON_PALETTE.length] }))
  }, [activeReportClients])

  const totalServers = useMemo(() => (serverDistribution || []).reduce((s, e) => s + Number(e.value || 0), 0), [serverDistribution])

  useEffect(() => {
    const handler = () => setIsRefreshing(true)
    window.addEventListener('clientsUpdated', handler)
    window.addEventListener('settingsUpdated', handler)
    return () => {
      window.removeEventListener('clientsUpdated', handler)
      window.removeEventListener('settingsUpdated', handler)
    }
  }, [])

  useEffect(() => {
    if (isRefreshing) {
      const t = setTimeout(() => setIsRefreshing(false), 400)
      return () => clearTimeout(t)
    }
  }, [isRefreshing])

  // Data validation handled by DataContext - no need for manual sync

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold neon-text">📈 Relatórios & Análises</h2>
        <div className="flex gap-3">
          <select value={period.id} onChange={(e) => setPeriod(periods.find(p => p.id === e.target.value) || periods[0])} className="select-cyber">
            {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button onClick={() => setIsRefreshing(true)} className="btn-cyber">Atualizar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div className="glass p-6 rounded-xl border border-green-500/30">
          <div className="text-gray-400 text-sm">Receita Mensal Recorrente</div>
          <div className="text-3xl font-bold text-green-400">{brCurrency(revenueCycles.mensal)}</div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <div className="text-gray-400 text-sm">Total de Clientes</div>
          <div className="text-3xl font-bold text-green-400">{clients.length}</div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <div className="text-gray-400 text-sm">Clientes Ativos</div>
          <div className="text-3xl font-bold text-magenta-400">{activeClientsCount}</div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <div className="text-gray-400 text-sm">Ticket Médio</div>
          <div className="text-3xl font-bold text-green-400">{brCurrency(arpu)}</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <motion.div className="glass p-6 rounded-xl border border-cyan-500/30">
          <div className="text-gray-400 text-sm">Receita Trimestral Recorrente</div>
          <div className="text-3xl font-bold text-cyan-400">{brCurrency(revenueCycles.trimestral)}</div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-pink-500/30">
          <div className="text-gray-400 text-sm">Receita Semestral Recorrente</div>
          <div className="text-3xl font-bold text-pink-400">{brCurrency(revenueCycles.semestral)}</div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-blue-500/30">
          <div className="text-gray-400 text-sm">Receita Anual Recorrente</div>
          <div className="text-3xl font-bold text-blue-400">{brCurrency(revenueCycles.anual)}</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberpunkLineChart
          data={clientsPerMonth}
          title={`Clientes por Mês (${period.days >= 365 ? '12' : '6'} meses)`}
          height={280}
          color="#22D3EE"
          gradientStart="#22D3EE"
          gradientEnd="#7C3AED"
          glowColor="rgba(34,211,238,0.6)"
          electric={false}
          showDots={true}
          animatedDots={false}
          area={true}
          yTickFormatter={(v) => v.toLocaleString('pt-BR')}
        />
        <motion.div className="glass p-6 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold neon-text text-purple-400" style={{ letterSpacing: '0.5px' }}>Receita por Mês ({period.days >= 365 ? '12' : '6'} meses)</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#22D3EE', boxShadow: '0 0 10px rgba(34,211,238,0.6)' }} />
              <span className="text-cyber-secondary text-sm">Ativo</span>
            </div>
          </div>
          {(!Array.isArray(revenueByMonth) || revenueByMonth.length === 0 || !revenueByMonth.some(s => s.value > 0)) ? (
            <div className="rounded-lg border border-purple-500/30 bg-black/40 p-6 text-center">
              <p className="text-gray-300 text-sm">Sem dados para exibir</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByMonth} barCategoryGap={20} margin={{ top: 24, right: 12, left: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tickMargin={10} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <YAxis stroke="rgba(255,255,255,0.6)" tickFormatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} tickMargin={8} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.2)' }} domain={[0, 'dataMax + 50']} />
                <Tooltip formatter={(v) => brCurrency(Number(v))} labelFormatter={(l) => `Mês: ${l}`} contentStyle={{ background: '#111', border: '1px solid #22D3EE', color: '#fff' }} />
                <Bar dataKey="value" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="value" position="top" formatter={(v) => `${Number(v).toLocaleString('pt-BR')}`} style={{ fill: '#22D3EE', fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberpunkLineChart
          data={recurringClientsByMonth}
          title={`Clientes Recorrentes (${period.days >= 365 ? '12' : '6'} meses)`}
          height={280}
          color="#10B981"
          gradientStart="#10B981"
          gradientEnd="#34D399"
          glowColor="rgba(16,185,129,0.6)"
          electric={false}
          showDots={true}
          animatedDots={false}
          area={true}
          yTickFormatter={(v) => v.toLocaleString('pt-BR')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-bold text-cyber-primary mb-3">Distribuição por Plano</h3>
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="pieGlow1" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie data={plansDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={115} paddingAngle={2} labelLine isAnimationActive animationDuration={800} label={({ name }) => String(name)}>
                    {plansDistribution.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke={accessibleStroke(e.color, '#0a0a0a')} strokeWidth={2} filter="url(#pieGlow1)" />
                    ))}
                    <LabelList position="inside" dataKey="value" formatter={(value: any) => `${Math.round((Number(value) / (totalPlans || 1)) * 100)}%`} style={{ fill: '#fff', fontWeight: 700 }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-1">
              <div className="space-y-2">
                {plansDistribution.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: it.color }} />
                    <span className="text-gray-300 text-sm">{it.name}:</span>
                    <span className="text-white font-semibold text-sm">{Number(it.value).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-bold text-cyber-primary mb-3">Formas de Pagamento</h3>
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="pieGlow2" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie data={paymentDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={115} paddingAngle={2} labelLine isAnimationActive animationDuration={800} label={({ name }) => String(name)}>
                    {paymentDistribution.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke={accessibleStroke(e.color, '#0a0a0a')} strokeWidth={2} filter="url(#pieGlow2)" />
                    ))}
                    <LabelList position="inside" dataKey="value" formatter={(value: any) => `${Math.round((Number(value) / (totalPayments || 1)) * 100)}%`} style={{ fill: '#fff', fontWeight: 700 }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-1">
              <div className="space-y-2">
                {paymentDistribution.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: it.color }} />
                    <span className="text-gray-300 text-sm">{it.name}:</span>
                    <span className="text-white font-semibold text-sm">{Number(it.value).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-bold text-cyber-primary mb-3">Canais de Prospecção</h3>
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="pieGlow3" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie data={prospectionDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={115} paddingAngle={2} labelLine isAnimationActive animationDuration={800} label={({ name }) => String(name)}>
                    {prospectionDistribution.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke={accessibleStroke(e.color, '#0a0a0a')} strokeWidth={2} filter="url(#pieGlow3)" />
                    ))}
                    <LabelList position="inside" dataKey="value" formatter={(value: any) => `${Math.round((Number(value) / (totalProspection || 1)) * 100)}%`} style={{ fill: '#fff', fontWeight: 700 }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-1">
              <div className="space-y-2">
                {prospectionDistribution.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: it.color }} />
                    <span className="text-gray-300 text-sm">{it.name}:</span>
                    <span className="text-white font-semibold text-sm">{Number(it.value).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div className="glass p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-bold text-cyber-primary mb-3">Distribuição por Servidor</h3>
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="pieGlow4" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie data={serverDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={115} paddingAngle={2} labelLine isAnimationActive animationDuration={800} label={({ name }) => String(name)}>
                    {serverDistribution.map((e, i) => (
                      <Cell key={i} fill={e.color} stroke={accessibleStroke(e.color, '#0a0a0a')} strokeWidth={2} filter="url(#pieGlow4)" />
                    ))}
                    <LabelList position="inside" dataKey="value" formatter={(value: any) => `${Math.round((Number(value) / (totalServers || 1)) * 100)}%`} style={{ fill: '#fff', fontWeight: 700 }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-1">
              <div className="space-y-2">
                {serverDistribution.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: it.color }} />
                    <span className="text-gray-300 text-sm">{it.name}:</span>
                    <span className="text-white font-semibold text-sm">{Number(it.value).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {isRefreshing && (
        <div className="text-sm text-cyan-400">Atualizando…</div>
      )}
    </div>
  )
}

export default CyberReports