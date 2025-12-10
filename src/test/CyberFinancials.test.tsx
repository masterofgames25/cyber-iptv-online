import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CyberFinancials from '../components/CyberFinancials'
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

describe('CyberFinancials', () => {
  const brDateOffset = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const dd = String(d.getDate()).padStart(2,'0')
    const mm = String(d.getMonth()+1).padStart(2,'0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const mockTransactions = [
    testUtils.createMockTransaction({
      id: 'transaction-1',
      clienteId: 'client-1',
      clienteNome: 'João Silva',
      tipo: 'pagamento',
      valor: 100,
      descricao: 'Mensalidade IPTV',
      data: brDateOffset(-5),
      metodoPagamento: 'pix',
      status: 'confirmado',
    }),
    testUtils.createMockTransaction({
      id: 'transaction-2',
      clienteId: 'client-2',
      clienteNome: 'Maria Santos',
      tipo: 'pagamento',
      valor: 80,
      descricao: 'Mensalidade IPTV',
      data: brDateOffset(-10),
      metodoPagamento: 'cartao',
      status: 'confirmado',
    }),
    testUtils.createMockTransaction({
      id: 'transaction-3',
      clienteId: 'client-3',
      clienteNome: 'Pedro Oliveira',
      tipo: 'pagamento',
      valor: 120,
      descricao: 'Mensalidade IPTV',
      data: brDateOffset(-15),
      metodoPagamento: 'dinheiro',
      status: 'pendente',
    }),
    testUtils.createMockTransaction({
      id: 'transaction-4',
      clienteId: 'client-4',
      clienteNome: 'Ana Costa',
      tipo: 'pagamento',
      valor: 90,
      descricao: 'Mensalidade IPTV',
      data: brDateOffset(0),
      metodoPagamento: 'pix',
      status: 'confirmado',
    }),
  ]

  const mockClients = [
    testUtils.createMockClient({
      id: 'client-1',
      nome: 'João Silva',
      email: 'joao@example.com',
      status: 'ativo',
      statusPagamento: 'pago',
      valor: 100,
      dataVencimento: brDateOffset(25),
    }),
    testUtils.createMockClient({
      id: 'client-2',
      nome: 'Maria Santos',
      email: 'maria@example.com',
      status: 'ativo',
      statusPagamento: 'pago',
      valor: 80,
      dataVencimento: brDateOffset(20),
    }),
    testUtils.createMockClient({
      id: 'client-3',
      nome: 'Pedro Oliveira',
      email: 'pedro@example.com',
      status: 'ativo',
      statusPagamento: 'pendente',
      valor: 120,
      dataVencimento: brDateOffset(-5),
    }),
    testUtils.createMockClient({
      id: 'client-4',
      nome: 'Ana Costa',
      email: 'ana@example.com',
      status: 'ativo',
      statusPagamento: 'pago',
      valor: 90,
      dataVencimento: brDateOffset(30),
    }),
  ]

  const renderWithDataProvider = (ui: React.ReactElement, options = {}) => {
    return render(
      <DataProvider initialClients={mockClients} initialTransactions={mockTransactions}>
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
      renderWithDataProvider(<CyberFinancials />)
      expect(screen.getByText('Financeiro')).toBeInTheDocument()
    })

    it('should display financial summary cards', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      expect(screen.getByText('Receita Total')).toBeInTheDocument()
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument()
      expect(screen.getByText('Clientes Ativos')).toBeInTheDocument()
      expect(screen.getByText('Ticket Médio')).toBeInTheDocument()
    })

    it('should display recent transactions', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      expect(screen.getByText('Transações Recentes')).toBeInTheDocument()
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.getByText('Pedro Oliveira')).toBeInTheDocument()
      expect(screen.getByText('Ana Costa')).toBeInTheDocument()
    })

    it('should display monthly revenue chart', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument()
      // Chart should be rendered (mocked)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('Financial Calculations', () => {
    it('should calculate total revenue correctly', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      // Total should be 100 + 80 + 120 + 90 = 390
      expect(screen.getByText('R$ 390,00')).toBeInTheDocument()
    })

    it('should calculate monthly revenue correctly', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      // All transactions are from this month (mocked)
      expect(screen.getByText('R$ 390,00')).toBeInTheDocument()
    })

    it('should count active clients correctly', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      // Should show 4 active clients
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should calculate average ticket correctly', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      // Average should be 390 / 4 = 97.50
      expect(screen.getByText('R$ 97,50')).toBeInTheDocument()
    })
  })

  describe('Transaction Filtering', () => {
    it('should filter transactions by date range', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const dateFromFilter = screen.getByLabelText('Data de')
      const dateToFilter = screen.getByLabelText('até')
      
      const today = new Date()
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const ddmm = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
      await user.type(dateFromFilter, ddmm(sevenDaysAgo))
      await user.type(dateToFilter, ddmm(today))
      
      await waitFor(() => {
        // Should show transactions from last 7 days
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Ana Costa')).toBeInTheDocument()
      })
    })

    it('should filter transactions by status', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const statusFilter = screen.getByLabelText('Status')
      await user.selectOptions(statusFilter, 'confirmado')
      
      await waitFor(() => {
        // Should only show confirmed transactions
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.getByText('Ana Costa')).toBeInTheDocument()
        expect(screen.queryByText('Pedro Oliveira')).not.toBeInTheDocument()
      })
    })

    it('should filter transactions by payment method', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const methodFilter = screen.getByLabelText('Método Pagamento')
      await user.selectOptions(methodFilter, 'pix')
      
      await waitFor(() => {
        // Should only show PIX transactions
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Ana Costa')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
        expect(screen.queryByText('Pedro Oliveira')).not.toBeInTheDocument()
      })
    })

    it('should search transactions by client name', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const searchInput = screen.getByPlaceholderText('Buscar transações...')
      await user.type(searchInput, 'João')
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
        expect(screen.queryByText('Pedro Oliveira')).not.toBeInTheDocument()
        expect(screen.queryByText('Ana Costa')).not.toBeInTheDocument()
      })
    })
  })

  describe('Transaction Actions', () => {
    it('should open transaction details modal', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const transactionRow = screen.getAllByRole('row')[1] // First data row
      await user.click(transactionRow)
      
      await waitFor(() => {
        expect(screen.getByText('Detalhes da Transação')).toBeInTheDocument()
      })
    })

    it('should export financial data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const exportButton = screen.getByLabelText('Exportar relatório financeiro')
      await user.click(exportButton)
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })

    it('should generate financial report', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const reportButton = screen.getByLabelText('Gerar relatório detalhado')
      await user.click(reportButton)
      
      await waitFor(() => {
        expect(screen.getByText('Relatório Financeiro')).toBeInTheDocument()
      })
    })
  })

  describe('Chart Interactions', () => {
    it('should display chart with correct data', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      expect(screen.getByText('Receita Mensal')).toBeInTheDocument()
      expect(screen.getByRole('img')).toBeInTheDocument() // Chart
    })

    it('should update chart when filters change', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const dateFromFilter = screen.getByLabelText('Data de')
      const dateToFilter = screen.getByLabelText('até')
      
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const ddmm2 = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
      await user.type(dateFromFilter, ddmm2(thirtyDaysAgo))
      await user.type(dateToFilter, ddmm2(today))
      
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument() // Chart should update
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithDataProvider(<CyberFinancials />)
      
      expect(screen.getByLabelText('Buscar transações...')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Método Pagamento')).toBeInTheDocument()
      expect(screen.getByLabelText('Data de')).toBeInTheDocument()
      expect(screen.getByLabelText('até')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const searchInput = screen.getByPlaceholderText('Buscar transações...')
      await user.tab()
      
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty transaction list gracefully', () => {
      render(
        <DataProvider initialClients={mockClients} initialTransactions={[]}>
          <CyberFinancials />
        </DataProvider>
      )
      
      expect(screen.getByText('Financeiro')).toBeInTheDocument()
      expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument()
    })

    it('should handle invalid transaction data gracefully', () => {
      const invalidTransaction = {
        id: 12345,
        clientId: 0,
        clientName: '',
        amount: 0,
        type: 'other' as const,
        date: brDateOffset(0),
        description: '',
      }
      
      render(
        <DataProvider initialClients={mockClients} initialTransactions={[invalidTransaction]}>
          <CyberFinancials />
        </DataProvider>
      )
      
      expect(screen.getByText('Financeiro')).toBeInTheDocument()
    })

    it('should handle missing client data gracefully', () => {
      const orphanTransaction = testUtils.createMockTransaction({
        id: 'orphan-transaction',
        clienteId: 'non-existent-client',
        clienteNome: 'Unknown Client',
      })
      
      render(
        <DataProvider initialClients={[]} initialTransactions={[orphanTransaction]}>
          <CyberFinancials />
        </DataProvider>
      )
      
      expect(screen.getByText('Financeiro')).toBeInTheDocument()
      expect(screen.getByText('Unknown Client')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeTransactionList = Array.from({ length: 100 }, (_, i) => 
        testUtils.createMockTransaction({
          id: `transaction-${i}`,
          clienteId: `client-${i % 10}`,
          clienteNome: `Client ${i % 10}`,
          valor: 50 + (i % 100),
          status: i % 3 === 0 ? 'confirmado' : i % 3 === 1 ? 'pendente' : 'cancelado',
          metodoPagamento: i % 2 === 0 ? 'pix' : 'cartao',
        })
      )
      
      const startTime = performance.now()
      
      render(
        <DataProvider initialClients={mockClients} initialTransactions={largeTransactionList}>
          <CyberFinancials />
        </DataProvider>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(screen.getByText('Financeiro')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second
    })

    it('should debounce search input', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberFinancials />)
      
      const searchInput = screen.getByPlaceholderText('Buscar transações...')
      
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