import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { DataProvider } from '../context/DataContext'
import { CyberClientsList } from '../components/CyberClientsList'

describe('Aba Clientes', () => {
  it('renderiza lista e filtros sem erros', () => {
    // Pass empty clients array through DataProvider props instead of localStorage
    render(
      <DataProvider initialClients={[]}>
        <CyberClientsList />
      </DataProvider>
    )
    expect(screen.getByText(/Clientes/i)).toBeInTheDocument()
  })
})