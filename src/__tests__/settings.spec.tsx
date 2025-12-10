import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { DataProvider } from '../context/DataContext'
import CyberSystemSettings from '../components/CyberSystemSettings'

describe('Aba Configurações', () => {
  it('não exibe botão de exportar JSON', () => {
    render(
      <DataProvider>
        <CyberSystemSettings />
      </DataProvider>
    )
    const btn = screen.queryByRole('button', { name: /Exportar JSON/i })
    expect(btn).toBeNull()
  })
})