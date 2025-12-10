import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { DataContext } from '../../src/context/DataContext'
import CyberLeadsManager from '../../src/components/CyberLeadsManager'
import { CyberClientsList } from '../../src/components/CyberClientsList'

const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const noop = async (..._args: any[]) => {}
  return (
    <DataContext.Provider value={{
      clients: [], leads: [], revenueLog: [], tests: [], resellers: [], systemLog: [],
      planos: [], servidores: [], formasPagamento: [], dispositivos: [], aplicativos: [], prospeccoes: [],
      addReseller: noop, updateReseller: noop, deleteReseller: noop,
      addTest: noop, updateTest: noop, deleteTest: noop,
      addClient: noop, updateClient: noop, deleteClient: noop,
      addLead: noop, updateLead: noop, deleteLead: noop,
      markClientAsPaid: noop, renewClient: noop,
      clearRevenueData: noop, clearAllData: noop,
      isLoading: false, error: null
    }}>
      {children}
    </DataContext.Provider>
  )
}

const renderWithProvider = (ui: React.ReactElement) => render(<MockProvider>{ui}</MockProvider>)

describe('Paridade visual dos botões de alternância Leads vs Clientes', () => {
  beforeEach(() => {
    // Garante ambiente sem Electron durante os testes
    // @ts-ignore
    window.electronAPI = undefined
  })
  it('Classes e estrutura idênticas para estado Tabela ativo', async () => {
    const r1 = renderWithProvider(<CyberLeadsManager />)
    const leadsBtnTable = screen.getByTitle('Visualização Tabela')
    const leadsBtnKanban = screen.getByTitle('Visualização Kanban')
    await userEvent.click(leadsBtnTable)
    const leadsTableClass = leadsBtnTable.className
    const leadsKanbanClass = leadsBtnKanban.className
    const leadsTableIconClass = leadsBtnTable.querySelector('svg')?.getAttribute('class')
    r1.unmount()

    const r2 = renderWithProvider(<CyberClientsList />)
    const clientsBtnTable = screen.getByTitle('Visualização Tabela')
    const clientsBtnKanban = screen.getByTitle('Visualização Kanban')
    await userEvent.click(clientsBtnTable)
    expect(clientsBtnTable.className).toBe(leadsTableClass)
    expect(clientsBtnKanban.className).toBe(leadsKanbanClass)
    expect(clientsBtnTable.querySelector('svg')?.getAttribute('class')).toBe(leadsTableIconClass)
    r2.unmount()
  })

  it('Classes e estrutura idênticas para estado Kanban/Cards ativo', async () => {
    const r1 = renderWithProvider(<CyberLeadsManager />)
    const leadsBtnKanban = screen.getByTitle('Visualização Kanban')
    const leadsBtnTable = screen.getByTitle('Visualização Tabela')
    await userEvent.click(leadsBtnKanban)
    const leadsKanbanClass = leadsBtnKanban.className
    const leadsTableClass = leadsBtnTable.className
    r1.unmount()

    const r2 = renderWithProvider(<CyberClientsList />)
    const clientsBtnKanban = screen.getByTitle('Visualização Kanban')
    const clientsBtnTable = screen.getByTitle('Visualização Tabela')
    await userEvent.click(clientsBtnKanban)
    expect(clientsBtnKanban.className).toBe(leadsKanbanClass)
    expect(clientsBtnTable.className).toBe(leadsTableClass)
    r2.unmount()
  })
})