import { describe, it, expect, vi } from 'vitest'
import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { DataProvider, useData } from '../context/DataContext'
import { CyberpunkNotificationProvider } from '../components/CyberpunkNotification'

describe('Renovação marca como Pago quando pendente', () => {
  it('ao renovar um cliente pendente, muda status para Pago e registra receita', async () => {
    const initialClient = {
      id: 42,
      nome: 'Cliente Pendente',
      whatsapp: '11999999999',
      login: 'user',
      senha: 'pass',
      plano: 'Mensal',
      valor: 30,
      ativacao: '15/01/2025',
      vencimento: '15/02/2025',
      formaPagamento: 'Pix',
      statusPagamento: 'Pendente',
      servidor: 'BLAZE',
      dispositivo: 'TV',
      aplicativo: 'APP',
      macAddress: '',
      chaveDispositivo: '',
      prospeccao: '',
      situacao: 'Ativo',
      listaM3U: '',
      observacoes: ''
    }

    const revenueStore: any[] = []
    window.electronAPI = {
      // @ts-ignore
      database: {
        getClients: vi.fn(async () => [initialClient]),
        updateClient: vi.fn(async (updated) => {
          Object.assign(initialClient, updated)
        }),
        addRevenueTransaction: vi.fn(async (t) => {
          const newTx = { id: revenueStore.length + 1, ...t }
          revenueStore.push(newTx)
          return newTx
        }),
        getRevenueTransactions: vi.fn(async () => revenueStore),
        addSystemLogEntry: vi.fn(async () => { })
      }
    } as any

    const Probe: React.FC = () => {
      const { clients, renewClient, revenueLog } = useData()
      useEffect(() => { (async () => { if (clients.length) await renewClient(clients[0].id) })() }, [clients])
      return <div><span data-testid="status">{clients[0]?.statusPagamento || 'n/a'}</span><span data-testid="revc">{revenueLog.length}</span></div>
    }

    const { getByTestId } = render(
      <CyberpunkNotificationProvider>
        <DataProvider>
          <Probe />
        </DataProvider>
      </CyberpunkNotificationProvider>
    )

    await waitFor(() => {
      expect(getByTestId('status').textContent).toBe('Pago')
      expect(Number(getByTestId('revc').textContent)).toBeGreaterThan(0)
    })
  })
})
