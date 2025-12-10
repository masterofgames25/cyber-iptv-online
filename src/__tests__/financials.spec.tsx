import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { DataProvider } from '../context/DataContext'
import CyberFinancials from '../components/CyberFinancials'

describe('Aba Financeiro', () => {
  it('renderiza métricas e transações recentes', () => {
    const rev = [
      { id: '1', clientId: 1, clientName: 'C1', amount: 50, type: 'payment', description: 'Pagamento', date: new Date().toISOString() },
      { id: '2', clientId: 2, clientName: 'C2', amount: 100, type: 'payment', description: 'Pagamento', date: new Date(Date.now()-86400000).toISOString() },
    ]
    
    // Pass data through DataProvider props instead of localStorage
    render(
      <DataProvider initialRevenueTransactions={rev}>
        <CyberFinancials />
      </DataProvider>
    )
    expect(screen.getByText(/Transações Recentes/i)).toBeInTheDocument()
  })
})