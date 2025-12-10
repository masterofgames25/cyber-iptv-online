import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import React, { useEffect } from 'react'
import { DataProvider, useData } from '../context/DataContext'

describe('renewClient preserva statusPagamento', () => {
  beforeEach(() => {
    const initialClient = {
      id: 1,
      nome: 'Cliente Pago',
      whatsapp: '11999999999',
      login: 'user',
      senha: 'pass',
      plano: 'Mensal',
      valor: 100,
      ativacao: '2025-01-01',
      vencimento: '2025-01-01',
      formaPagamento: 'Pix',
      statusPagamento: 'Pago' as const,
      servidor: 'BLAZE',
      dispositivo: 'TV',
      aplicativo: 'IPTV',
      macAddress: '',
      chaveDispositivo: '',
      prospeccao: '',
      situacao: 'Ativo' as const,
      listaM3U: '',
      observacoes: ''
    }
    // Mockar carregamento inicial para incluir cliente
    window.electronAPI.database.getClients.mockResolvedValue([initialClient])
  })

  it('não altera statusPagamento ao renovar', async () => {
    const Probe: React.FC = () => {
      const { clients, renewClient } = useData()
      useEffect(() => {
        (async () => {
          if (clients.length) {
            await renewClient(clients[0].id)
          }
        })()
      }, [clients])
      return <div data-testid="status">{clients[0]?.statusPagamento || 'n/a'}</div>
    }

    const { getByTestId } = render(
      <DataProvider>
        <Probe />
      </DataProvider>
    )

    await waitFor(() => {
      expect(getByTestId('status').textContent).toBe('Pago')
    })
  })
})