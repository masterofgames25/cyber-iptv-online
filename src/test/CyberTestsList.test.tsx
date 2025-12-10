import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CyberTestsList from '../components/CyberTestsList'
import { DataProvider } from '../context/DataContext'

// Mock the notification system
vi.mock('../utils/notifications', () => ({
  showNotification: vi.fn(),
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn()
}))

// Mock framer-motion for simpler animations
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
    select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
    textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('CyberTestsList', () => {
  const mockTests = [
    testUtils.createMockTest({
      id: 1,
      clientId: 101,
      clientName: 'Teste de Velocidade',
      notes: 'Testa a velocidade da conexão IPTV',
      status: 'active',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }),
    testUtils.createMockTest({
      id: 2,
      clientId: 102,
      clientName: 'Teste de Canal',
      notes: 'Verifica disponibilidade de canais',
      status: 'active',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }),
    testUtils.createMockTest({
      id: 3,
      clientId: 103,
      clientName: 'Teste de Qualidade',
      notes: 'Avalia qualidade do streaming',
      status: 'expired',
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }),
  ]

  const renderWithDataProvider = (ui: React.ReactElement, options = {}) => {
    return render(
      <DataProvider initialTests={mockTests}>
        {ui}
      </DataProvider>,
      options
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Component Rendering', () => {
    it('should render the component without crashing', () => {
      renderWithDataProvider(<CyberTestsList />)
      expect(screen.getByText('🧪 Testes Gratuitos')).toBeInTheDocument()
    })

    it('should display the tests list with correct data', () => {
      renderWithDataProvider(<CyberTestsList />)
      
      expect(screen.getByText('Teste de Velocidade')).toBeInTheDocument()
      expect(screen.getByText('Teste de Canal')).toBeInTheDocument()
      expect(screen.getByText('Teste de Qualidade')).toBeInTheDocument()
    })

    it('should display test descriptions correctly', () => {
      renderWithDataProvider(<CyberTestsList />)
      
      expect(screen.getByText('Testa a velocidade da conexão IPTV')).toBeInTheDocument()
      expect(screen.getByText('Verifica disponibilidade de canais')).toBeInTheDocument()
      expect(screen.getByText('Avalia qualidade do streaming')).toBeInTheDocument()
    })

    it('should display test status badges correctly', () => {
      renderWithDataProvider(<CyberTestsList />)
      
      expect(screen.getByText('ativo')).toBeInTheDocument()
      expect(screen.getByText('inativo')).toBeInTheDocument()
    })

    it('should display test categories correctly', () => {
      renderWithDataProvider(<CyberTestsList />)
      
      expect(screen.getByText('performance')).toBeInTheDocument()
      expect(screen.getByText('canais')).toBeInTheDocument()
      expect(screen.getByText('qualidade')).toBeInTheDocument()
    })

    it('should display test URLs correctly', () => {
      renderWithDataProvider(<CyberTestsList />)
      
      expect(screen.getByText('http://teste-velocidade.example.com')).toBeInTheDocument()
      expect(screen.getByText('http://teste-canais.example.com')).toBeInTheDocument()
      expect(screen.getByText('http://teste-qualidade.example.com')).toBeInTheDocument()
    })
  })

  describe('Search and Filtering', () => {
    it('should filter tests by search term', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberTestsList />)
      
      const searchInput = screen.getByPlaceholderText('Buscar testes...')
      await user.type(searchInput, 'Velocidade')
      
      await waitFor(() => {
        expect(screen.getByText('Teste de Velocidade')).toBeInTheDocument()
        expect(screen.queryByText('Teste de Canal')).not.toBeInTheDocument()
        expect(screen.queryByText('Teste de Qualidade')).not.toBeInTheDocument()
      })
    })

    it('should filter by status', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberTestsList />)
      
      const statusFilter = screen.getByLabelText('Status')
      await user.selectOptions(statusFilter, 'ativo')
      
      await waitFor(() => {
        expect(screen.getByText('Teste de Velocidade')).toBeInTheDocument()
        expect(screen.getByText('Teste de Canal')).toBeInTheDocument()
        expect(screen.queryByText('Teste de Qualidade')).not.toBeInTheDocument()
      })
    })

    // UI atual não possui filtros de categoria ou intervalo de datas
  })


  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithDataProvider(<CyberTestsList />)
      
      expect(screen.getByPlaceholderText('Buscar testes...')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberTestsList />)
      
      const searchInput = screen.getByPlaceholderText('Buscar testes...')
      await user.tab()
      
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty tests list gracefully', () => {
      render(
        <DataProvider initialTests={[]}>
          <CyberTestsList />
        </DataProvider>
      )
      
      expect(screen.getByText('🧪 Testes Gratuitos')).toBeInTheDocument()
    })

    it('should handle invalid test data gracefully', () => {
      const invalidTest = {
        id: 12345,
        clientId: 0,
        clientName: '',
        startDate: '',
        endDate: '',
        status: 'expired' as const,
      }
      
      render(
        <DataProvider initialTests={[invalidTest]}>
          <CyberTestsList />
        </DataProvider>
      )
      
      expect(screen.getByText('🧪 Testes Gratuitos')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeTestList = Array.from({ length: 100 }, (_, i) => 
        testUtils.createMockTest({
          id: i + 100,
          clientId: i + 1000,
          clientName: `Test ${i}`,
          notes: `Description for test ${i}`,
          status: i % 2 === 0 ? 'active' : 'expired',
          startDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
      )
      
      const startTime = performance.now()
      
      render(
        <DataProvider initialTests={largeTestList}>
          <CyberTestsList />
        </DataProvider>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(screen.getByText('🧪 Testes Gratuitos')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second
    })

    it('should debounce search input', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberTestsList />)
      
      const searchInput = screen.getByPlaceholderText('Buscar testes...')
      
      // Type quickly
      await user.type(searchInput, 'test search')
      
      // Should not immediately filter
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
      
      // Wait for debounce
      await vi.advanceTimersByTimeAsync(300)
      
      // Should filter after debounce
      await waitFor(() => {
        expect(screen.getAllByRole('row').length).toBeLessThanOrEqual(1)
      })
    })
  })
})