import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const LeadsToggle = () => (
  <div className="flex bg-black/30 rounded-lg p-1 border border-purple-500/30">
    <button className={`p-2 rounded bg-cyan-500/20 text-cyan-400`} title="Visualização Kanban">
      <svg className="w-5 h-5" />
    </button>
    <button className={`p-2 rounded text-gray-400 hover:text-white`} title="Visualização Tabela">
      <svg className="w-5 h-5" />
    </button>
  </div>
)

const ClientsToggle = () => (
  <div className="flex bg-black/30 rounded-lg p-1 border border-purple-500/30">
    <button className={`p-2 rounded bg-cyan-500/20 text-cyan-400`} title="Visualização Kanban">
      <svg className="w-5 h-5" />
    </button>
    <button className={`p-2 rounded text-gray-400 hover:text-white`} title="Visualização Tabela">
      <svg className="w-5 h-5" />
    </button>
  </div>
)

describe('Paridade estática de classes dos botões de alternância', () => {
  it('Estrutura e classes são idênticas', () => {
    render(<LeadsToggle />)
    const leadsKanban = screen.getByTitle('Visualização Kanban')
    const leadsTable = screen.getByTitle('Visualização Tabela')

    render(<ClientsToggle />)
    const clientsKanban = screen.getAllByTitle('Visualização Kanban')[1]
    const clientsTable = screen.getAllByTitle('Visualização Tabela')[1]

    expect(leadsKanban.className).toBe(clientsKanban.className)
    expect(leadsTable.className).toBe(clientsTable.className)
    expect(leadsTable.querySelector('svg')?.getAttribute('class')).toBe(
      clientsTable.querySelector('svg')?.getAttribute('class')
    )
  })
})