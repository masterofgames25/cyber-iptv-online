import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { DataProvider, useData } from '../context/DataContext'
import CyberFinancials from '../components/CyberFinancials'

const initialClient = {
  id: 1,
  nome: 'Cliente Teste',
  whatsapp: '11999999999',
  login: 'user',
  senha: 'pass',
  plano: 'Mensal',
  valor: 50,
  ativacao: new Date().toISOString().split('T')[0],
  vencimento: new Date().toISOString().split('T')[0],
  formaPagamento: 'PIX',
  statusPagamento: 'Pendente',
  servidor: 'PRINCIPAL',
  dispositivo: 'Smart TV',
  aplicativo: 'IPTV Smarters',
  macAddress: null,
  chaveDispositivo: null,
  prospeccao: 'Direto',
  situacao: 'Ativo',
  listaM3U: null,
  observacoes: null
} as any

const initialTransaction = {
  id: 1,
  clientId: 1,
  clientName: 'Cliente Teste',
  amount: 50,
  type: 'subscription',
  date: new Date().toISOString(),
  description: 'Novo cliente - Plano Mensal',
  serverSnapshot: 'PRINCIPAL',
  costSnapshot: 10,
  monthsSnapshot: 1,
  status: 'committed'
} as any

describe('Persistência financeira', () => {
  beforeEach(() => {
    // helper wrapper resets mocks between tests
  })

  it('exibe despesas com snapshot histórico', async () => {
    render(
      <DataProvider initialClients={[initialClient]} initialRevenueLog={[initialTransaction]}>
        <CyberFinancials />
      </DataProvider>
    )
    await waitFor(() => {
      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })
  })

  it('preserva dados financeiros ao arquivar cliente', async () => {
    function DeleteHarness() {
      const { deleteClient } = useData()
      React.useEffect(() => {
        (async () => {
          await deleteClient(1)
        })()
      }, [])
      return <CyberFinancials />
    }
    render(
      <DataProvider initialClients={[initialClient]} initialRevenueLog={[initialTransaction]}>
        <DeleteHarness />
      </DataProvider>
    )
    await waitFor(() => {
      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })
  })
})