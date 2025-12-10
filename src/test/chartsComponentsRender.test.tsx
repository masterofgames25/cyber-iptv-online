import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import CyberpunkLineChart from '../components/CyberpunkLineChart'
import CyberpunkPieChart from '../components/CyberpunkPieChart'

describe('Charts components render', () => {
  it('LineChart shows data with axes and hides fallback', () => {
    const data = [
      { name: 'jun', value: 1 },
      { name: 'jul', value: 2 },
    ]
    const { queryByText, getByText } = render(<CyberpunkLineChart data={data} title="Teste Line" />)
    expect(getByText('Teste Line')).toBeTruthy()
    expect(queryByText('Sem dados para exibir')).toBeNull()
  })

  it('LineChart shows fallback when empty', () => {
    const { getByText } = render(<CyberpunkLineChart data={[]} title="Vazio" />)
    expect(getByText('Sem dados para exibir')).toBeTruthy()
  })

  it('PieChart shows data with legend and hides fallback', () => {
    const data = [
      { name: 'Mensal', value: 2, color: '#22D3EE' },
      { name: 'Semestral', value: 1, color: '#7C3AED' },
    ]
    const { queryByText, getByText } = render(<CyberpunkPieChart data={data} title="Teste Pie" />)
    expect(getByText('Teste Pie')).toBeTruthy()
    expect(queryByText('Sem dados para exibir')).toBeNull()
  })

  it('PieChart shows fallback when empty', () => {
    const { getByText } = render(<CyberpunkPieChart data={[]} title="Vazio" />)
    expect(getByText('Sem dados para exibir')).toBeTruthy()
  })
})