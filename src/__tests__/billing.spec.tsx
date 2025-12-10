import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { DataProvider } from '../context/DataContext'
import CyberBillingManager from '../components/CyberBillingManager'

describe('Aba Cobranças', () => {
  it('exibe filtro due_pending e renderiza sem erros', () => {
    const clients = [
      { id: Date.now() - 5 * 86400000, nome: 'Teste', whatsapp: '5599999999999', servidor: 'BLAZE', plano: 'MENSAL', dispositivo: 'TV Box', aplicativo: 'IPTV Smarters', ativacao: '2025-11-01', vencimento: '2025-11-20', statusPagamento: 'Pendente', valor: 50, ativo: true },
    ]
    
    // Pass data through DataProvider props instead of localStorage
    render(
      <DataProvider initialClients={clients}>
        <CyberBillingManager />
      </DataProvider>
    )
    expect(screen.getAllByText(/Vencendo \(7 dias\)/i).length).toBeGreaterThan(0)
  })
})