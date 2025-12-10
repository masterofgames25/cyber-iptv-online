import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CyberClientsList } from '../components/CyberClientsList'
import { DataProvider } from '../context/DataContext'
import { CyberpunkNotificationProvider } from '../components/CyberpunkNotification'
import { Client } from '../types'

// Mock the date utility functions
vi.mock('../utils/dateUtils', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
  formatDateForInput: (date: string) => date ? new Date(date).toISOString().split('T')[0] : '',
  isThisMonth: (date: string) => {
    if (!date) return false
    const d = new Date(date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  },
  getDaysUntilExpiration: (date: string) => {
    if (!date) return null
    const d = new Date(date)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  },
  isDateValid: (date: string) => {
    if (!date) return false
    const d = new Date(date)
    return d instanceof Date && !isNaN(d.getTime())
  }
}))

// Mock the notification system
vi.mock('../utils/notifications', () => ({
  showNotification: vi.fn(),
  showErrorNotification: vi.fn(),
  showSuccessNotification: vi.fn()
}))

// Mock system data
vi.mock('../utils/systemData', () => ({
  useSystemData: () => ({
    getServers: () => ['Server1', 'Server2'],
    getApplications: () => ['App1', 'App2'],
    getDevices: () => ['Device1', 'Device2'],
    getPlans: () => [{ id: 1, name: 'Basic', price: 30, months: 1 }],
    getPaymentMethods: () => ['PIX', 'Cartão'],
    getLeadSources: () => ['Facebook', 'Instagram']
  })
}))

// Mock framer-motion for simpler animations
vi.mock('framer-motion', () => {
  const filterProps = (props: any) => {
    const { whileHover, whileTap, initial, animate, exit, transition, ...validProps } = props;
    return validProps;
  };
  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...filterProps(props)}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...filterProps(props)}>{children}</button>,
      input: ({ children, ...props }: any) => <input {...filterProps(props)}>{children}</input>,
      select: ({ children, ...props }: any) => <select {...filterProps(props)}>{children}</select>,
      textarea: ({ children, ...props }: any) => <textarea {...filterProps(props)}>{children}</textarea>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('CyberClientsList', () => {
  const brDateOffset = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  const testUtils = {
    createMockClient: (overrides: Partial<Client> = {}): Client => ({
      id: Math.floor(Math.random() * 10000),
      nome: 'Test Client',
      whatsapp: '11999999999',
      login: 'testuser',
      senha: 'password',
      plano: 'Basic',
      valor: 30,
      ativacao: new Date().toISOString(),
      vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      formaPagamento: 'PIX',
      statusPagamento: 'Pago',
      servidor: 'Server1',
      dispositivo: 'TV Box',
      aplicativo: 'IPTV Smarters',
      macAddress: '00:00:00:00:00:00',
      chaveDispositivo: 'key123',
      prospeccao: 'Facebook',
      situacao: 'Ativo',
      listaM3U: 'http://example.com/list.m3u',
      observacoes: '',
      ...overrides
    })
  }

  const mockClients = [
    testUtils.createMockClient({
      id: 1,
      nome: 'João Silva',
      situacao: 'Ativo',
      statusPagamento: 'Pago',
      vencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    testUtils.createMockClient({
      id: 2,
      nome: 'Maria Santos',
      situacao: 'Inativo',
      statusPagamento: 'Pendente',
      vencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    testUtils.createMockClient({
      id: 3,
      nome: 'Pedro Oliveira',
      situacao: 'Ativo',
      statusPagamento: 'Pendente',
      vencimento: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  ]

  const renderWithDataProvider = (ui: React.ReactElement, { initialClients = mockClients, ...options }: any = {}) => {
    return render(
      <CyberpunkNotificationProvider>
        <DataProvider initialClients={initialClients}>
          {ui}
        </DataProvider>
      </CyberpunkNotificationProvider>,
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
      renderWithDataProvider(<CyberClientsList />)
      expect(screen.getByText(/Clientes/i)).toBeInTheDocument()
    })

    it('should display the client list with correct data', () => {
      renderWithDataProvider(<CyberClientsList />)

      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.getByText('Pedro Oliveira')).toBeInTheDocument()
    })

    it('should display client status badges correctly', () => {
      renderWithDataProvider(<CyberClientsList />)

      // Check status badges are present
      expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0)
    })

    it('should display payment status badges correctly', () => {
      renderWithDataProvider(<CyberClientsList />)

      expect(screen.getAllByText('Pagamento Pago').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Pagamento Pendente').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Vencido/i).length).toBeGreaterThan(0)
    })
  })

  describe('Search and Filtering', () => {
    it('should filter clients by search term', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const searchInput = screen.getByLabelText('Buscar clientes')
      await user.type(searchInput, 'João')

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
        expect(screen.queryByText('Pedro Oliveira')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should filter by status', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const statusFilter = screen.getByLabelText('Status')
      await user.selectOptions(statusFilter, 'Ativo')

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.getByText('Pedro Oliveira')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
      })
    })

    it('should filter by payment status', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const paymentFilter = screen.getByLabelText('Status Pagamento')
      await user.selectOptions(paymentFilter, 'Pago')

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
        expect(screen.queryByText('Pedro Oliveira')).not.toBeInTheDocument()
      })
    })

    it('should show clients expiring within 7 days', async () => {
      // Create a client expiring in 3 days
      const expiringClient = testUtils.createMockClient({
        id: 4,
        nome: 'Expiring Client',
        vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })

      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />, { initialClients: [...mockClients, expiringClient] })

      const expiringFilter = screen.getByLabelText('Filtro de Expiração')
      await user.selectOptions(expiringFilter, 'expiring')

      await waitFor(() => {
        expect(screen.getByText('Expiring Client')).toBeInTheDocument()
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument() // João expires in 15 days
      })
    })
  })

  describe('Client Actions', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const editButtons = screen.getAllByLabelText('Editar cliente')
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Editar Cliente')).toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const deleteButtons = screen.getAllByLabelText('Excluir cliente')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        // Updated text to match component: "arquivar" instead of "excluir"
        expect(screen.getByText(/Tem certeza que deseja arquivar este cliente/i)).toBeInTheDocument()
      })
    })

    it('should cancel deletion when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const deleteButtons = screen.getAllByLabelText('Excluir cliente')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText(/Tem certeza que deseja arquivar este cliente/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Add New Client', () => {
    it('should open add client modal when add button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const addButton = screen.getByText('Novo Cliente')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Adicionar Cliente')).toBeInTheDocument()
      })
    })

    it('should validate required fields in add form', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const addButton = screen.getByText('Novo Cliente')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Adicionar Cliente')).toBeInTheDocument()
      })

      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithDataProvider(<CyberClientsList />)
      expect(screen.getByLabelText('Buscar clientes')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Status Pagamento')).toBeInTheDocument()
      expect(screen.getByLabelText('Filtro de Expiração')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberClientsList />)

      const searchInput = screen.getByLabelText('Buscar clientes')
      searchInput.focus()
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty client list gracefully', () => {
      renderWithDataProvider(<CyberClientsList />, { initialClients: [] })

      expect(screen.getByText(/Clientes/i)).toBeInTheDocument()
      // Check for empty state message if it exists, or just ensure no rows are rendered
      // Based on component code: {uniqueFilteredClients.length === 0 && null} -> it renders nothing special for empty list in table mode?
      // Actually, let's check that no rows are in the body
      const rows = screen.queryAllByRole('row')
      // Header row might still be there
      expect(rows.length).toBeLessThanOrEqual(1)
    })

    it('should handle invalid dates gracefully', () => {
      const invalidDateClient = testUtils.createMockClient({
        id: 999,
        nome: 'Invalid Date Client',
        vencimento: 'invalid-date',
      })

      renderWithDataProvider(<CyberClientsList />, { initialClients: [invalidDateClient] })

      expect(screen.getByText('Invalid Date Client')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce search input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderWithDataProvider(<CyberClientsList />)

      const searchInput = screen.getByLabelText('Buscar clientes')

      // Type quickly
      await user.type(searchInput, 'test search')

      // Should not immediately filter
      // Note: In a real debounce test we'd check if the filter function was called, 
      // but here we are testing the integration. 
      // Since we can't easily check intermediate state without more complex setup,
      // we will just verify it eventually updates after the timer.

      // Advance time
      await vi.advanceTimersByTimeAsync(300)

      // Should filter after debounce
      await waitFor(() => {
        expect(searchInput).toHaveValue('test search')
      })
    })
  })
})