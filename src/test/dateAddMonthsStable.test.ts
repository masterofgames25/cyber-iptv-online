import { describe, it, expect } from 'vitest'
import { parseDateString, formatDateForDisplay, addMonthsStable } from '../utils/date'

describe('addMonthsStable e datas BR', () => {
  it('mensal mantém o dia e não perde 1 dia', () => {
    const d = parseDateString('15/03/2025')!
    const r = addMonthsStable(d, 1)
    expect(formatDateForDisplay(r)).toBe('15/04/2025')
  })

  it('trimestral mantém o dia', () => {
    const d = parseDateString('10/05/2025')!
    const r = addMonthsStable(d, 3)
    expect(formatDateForDisplay(r)).toBe('10/08/2025')
  })

  it('semestral mantém o dia', () => {
    const d = parseDateString('07/06/2025')!
    const r = addMonthsStable(d, 6)
    expect(formatDateForDisplay(r)).toBe('07/12/2025')
  })

  it('anual mantém o dia e ano', () => {
    const d = parseDateString('01/12/2024')!
    const r = addMonthsStable(d, 12)
    expect(formatDateForDisplay(r)).toBe('01/12/2025')
  })

  it('fim de mês clampa corretamente (31/01 -> 28/02)', () => {
    const d = parseDateString('31/01/2025')!
    const r = addMonthsStable(d, 1)
    expect(formatDateForDisplay(r)).toBe('28/02/2025')
  })

  it('múltiplas renovações não reduzem um dia', () => {
    const start = parseDateString('15/03/2025')!
    const r1 = addMonthsStable(start, 1)
    const r2 = addMonthsStable(r1, 1)
    expect(formatDateForDisplay(r2)).toBe('15/05/2025')
  })
})