import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import React, { useEffect } from 'react'
import { DataProvider, useData } from '../context/DataContext'

describe('Confirmação de pagamento registra receita e atualiza status', () => {
  it('confirmPayment cria transação de renovação e marca cliente como Pago', async () => {
    const initialClient = {
      id: 10,
      nome: 'Cliente Teste',
      whatsapp: '11988887777',
      login: 'login',
      senha: 'senha',
      plano: 'Mensal',
      valor: 50,
      ativacao: '2025-01-01',
      vencimento: '2025-01-01',
      formaPagamento: 'Pix',
      statusPagamento: 'Pendente' as const,
      servidor: 'BLAZE',
      dispositivo: 'TV',
      aplicativo: 'APP',
      macAddress: '',
      chaveDispositivo: '',
      prospeccao: '',
      situacao: 'Ativo' as const,
      listaM3U: '',
      observacoes: ''
    }

    // preparar mocks
    window.electronAPI.database.getClients.mockResolvedValue([initialClient])
    const revenueStore: any[] = []
    window.electronAPI.database.getRevenueTransactions.mockResolvedValue(revenueStore)
    window.electronAPI.database.confirmPayment = vi.fn(async ({ clientId, paymentDate }) => {
      // atualiza cliente
      window.electronAPI.database.getClients.mockResolvedValue([{ ...initialClient, statusPagamento: 'Pago', dataPagamento: paymentDate }])
      // insere receita
      revenueStore.push({ id: 1, clientId, clientName: initialClient.nome, amount: initialClient.valor, type: 'renewal', date: paymentDate, description: 'Pagamento confirmado - Renovação', status: 'committed' })
      window.electronAPI.database.getRevenueTransactions.mockResolvedValue([...revenueStore])
      return true
    })

    const Probe: React.FC = () => {
      const { clients, revenueLog, markClientAsPaid } = useData()
      useEffect(() => {
        (async () => {
          if (clients.length) {
            await markClientAsPaid(clients[0].id)
          }
        })()
      }, [clients])
      return <div><span data-testid="status">{clients[0]?.statusPagamento || 'n/a'}</span><span data-testid="revenueCount">{revenueLog.length}</span></div>
    }

    const { getByTestId } = render(
      <DataProvider>
        <Probe />
      </DataProvider>
    )

    await waitFor(() => {
      expect(getByTestId('status').textContent).toBe('Pago')
      expect(getByTestId('revenueCount').textContent).toBe('1')
    })
  })
})