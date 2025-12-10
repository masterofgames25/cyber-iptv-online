import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CyberResellersManager from '../components/CyberResellersManager'
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

describe('CyberResellersManager', () => {
  const mockResellers = [
    testUtils.createMockReseller({
      id: 'reseller-1',
      nome: 'Carlos Mendes',
      email: 'carlos@revenda.com',
      telefone: '(11) 98765-4321',
      comissao: 20,
      clientesAtivos: 15,
      totalVendas: 2500,
      status: 'ativo',
      dataCadastro: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    }),
    testUtils.createMockReseller({
      id: 'reseller-2',
      nome: 'Ana Paula',
      email: 'ana@revenda.com',
      telefone: '(21) 99876-5432',
      comissao: 25,
      clientesAtivos: 8,
      totalVendas: 1200,
      status: 'ativo',
      dataCadastro: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    }),
    testUtils.createMockReseller({
      id: 'reseller-3',
      nome: 'Roberto Silva',
      email: 'roberto@revenda.com',
      telefone: '(31) 91234-5678',
      comissao: 15,
      clientesAtivos: 3,
      totalVendas: 450,
      status: 'inativo',
      dataCadastro: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    }),
  ]

  const mockTransactions = [
    testUtils.createMockTransaction({
      id: 'transaction-1',
      clienteId: 'reseller-1',
      clienteNome: 'Carlos Mendes',
      tipo: 'comissao',
      valor: 500,
      descricao: 'Comissão - Vendas do mês',
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metodoPagamento: 'transferencia',
      status: 'confirmado',
    }),
    testUtils.createMockTransaction({
      id: 'transaction-2',
      clienteId: 'reseller-2',
      clienteNome: 'Ana Paula',
      tipo: 'comissao',
      valor: 300,
      descricao: 'Comissão - Vendas do mês',
      data: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      metodoPagamento: 'pix',
      status: 'confirmado',
    }),
  ]

  const renderWithDataProvider = (ui: React.ReactElement, options = {}) => {
    return render(
      <DataProvider initialResellers={mockResellers} initialTransactions={mockTransactions}>
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
      renderWithDataProvider(<CyberResellersManager />)
      expect(screen.getByText('Revendedores')).toBeInTheDocument()
    })

    it('should display resellers list with correct data', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
      expect(screen.getByText('Ana Paula')).toBeInTheDocument()
      expect(screen.getByText('Roberto Silva')).toBeInTheDocument()
    })

    it('should display reseller status badges correctly', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByText('ativo')).toBeInTheDocument()
      expect(screen.getByText('inativo')).toBeInTheDocument()
    })

    it('should display commission information', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByText('20%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
      expect(screen.getByText('15%')).toBeInTheDocument()
    })

    it('should display active clients count', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display total sales information', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument()
      expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()
      expect(screen.getByText('R$ 450,00')).toBeInTheDocument()
    })
  })

  describe('Search and Filtering', () => {
    it('should filter resellers by search term', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const searchInput = screen.getByPlaceholderText('Buscar revendedores...')
      await user.type(searchInput, 'Carlos')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
        expect(screen.queryByText('Ana Paula')).not.toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })

    it('should filter by status', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const statusFilter = screen.getByLabelText('Status')
      await user.selectOptions(statusFilter, 'ativo')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
        expect(screen.getByText('Ana Paula')).toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })

    it('should filter by commission range', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const minCommissionFilter = screen.getByLabelText('Comissão Mínima')
      const maxCommissionFilter = screen.getByLabelText('Comissão Máxima')
      
      await user.type(minCommissionFilter, '20')
      await user.type(maxCommissionFilter, '25')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
        expect(screen.getByText('Ana Paula')).toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })

    it('should filter by active clients range', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const minClientsFilter = screen.getByLabelText('Clientes Mínimos')
      const maxClientsFilter = screen.getByLabelText('Clientes Máximos')
      
      await user.type(minClientsFilter, '5')
      await user.type(maxClientsFilter, '20')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
        expect(screen.getByText('Ana Paula')).toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })
  })

  describe('Reseller Actions', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const editButton = screen.getAllByLabelText('Editar revendedor')[0]
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByText('Editar Revendedor')).toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const deleteButton = screen.getAllByLabelText('Excluir revendedor')[0]
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir este revendedor?')).toBeInTheDocument()
      })
    })

    it('should cancel deletion when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const deleteButton = screen.getAllByLabelText('Excluir revendedor')[0]
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument()
      })
    })

    it('should view reseller transactions', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const transactionsButton = screen.getAllByLabelText('Ver transações')[0]
      await user.click(transactionsButton)
      
      await waitFor(() => {
        expect(screen.getByText('Transações do Revendedor')).toBeInTheDocument()
      })
    })
  })

  describe('Add New Reseller', () => {
    it('should open add reseller modal when add button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo revendedor')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Revendedor')).toBeInTheDocument()
      })
    })

    it('should validate required fields in add form', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo revendedor')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Revendedor')).toBeInTheDocument()
      })
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo revendedor')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Revendedor')).toBeInTheDocument()
      })
      
      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'invalid-email')
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument()
      })
    })

    it('should validate commission percentage', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo revendedor')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Revendedor')).toBeInTheDocument()
      })
      
      const commissionInput = screen.getByLabelText('Comissão (%)')
      await user.type(commissionInput, '150')
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      // Should show commission validation error
      await waitFor(() => {
        expect(screen.getByText('Comissão deve ser entre 0 e 100%')).toBeInTheDocument()
      })
    })
  })

  describe('Commission Management', () => {
    it('should calculate commission correctly', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      // Should show commission percentages
      expect(screen.getByText('20%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
      expect(screen.getByText('15%')).toBeInTheDocument()
    })

    it('should show commission summary', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByText('Total de Comissões')).toBeInTheDocument()
      expect(screen.getByText('R$ 800,00')).toBeInTheDocument() // 500 + 300
    })

    it('should handle commission payments', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const payCommissionButton = screen.getAllByLabelText('Pagar comissão')[0]
      await user.click(payCommissionButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Pagamento de Comissão')).toBeInTheDocument()
      })
    })
  })

  describe('Export Functionality', () => {
    it('should export resellers data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const exportButton = screen.getByLabelText('Exportar revendedores')
      await user.click(exportButton)
      
      // Should trigger export (mocked)
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })

    it('should export filtered results', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      // Apply filter first
      const searchInput = screen.getByPlaceholderText('Buscar revendedores...')
      await user.type(searchInput, 'Carlos')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
      })
      
      // Then export
      const exportButton = screen.getByLabelText('Exportar revendedores')
      await user.click(exportButton)
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Actions', () => {
    it('should select multiple resellers', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const selectAllCheckbox = screen.getByLabelText('Selecionar todos')
      await user.click(selectAllCheckbox)
      
      // Should select all visible resellers
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(1)
    })

    it('should delete selected resellers', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      // Select resellers
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // First reseller checkbox
      await user.click(checkboxes[2]) // Second reseller checkbox
      
      // Click delete selected
      const deleteSelectedButton = screen.getByLabelText('Excluir selecionados')
      await user.click(deleteSelectedButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir os revendedores selecionados?')).toBeInTheDocument()
      })
    })

    it('should export selected resellers', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      // Select resellers
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // First reseller checkbox
      
      // Click export selected
      const exportSelectedButton = screen.getByLabelText('Exportar selecionados')
      await user.click(exportSelectedButton)
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithDataProvider(<CyberResellersManager />)
      
      expect(screen.getByLabelText('Buscar revendedores...')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Comissão Mínima')).toBeInTheDocument()
      expect(screen.getByLabelText('Comissão Máxima')).toBeInTheDocument()
      expect(screen.getByLabelText('Clientes Mínimos')).toBeInTheDocument()
      expect(screen.getByLabelText('Clientes Máximos')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const searchInput = screen.getByPlaceholderText('Buscar revendedores...')
      await user.tab()
      
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty resellers list gracefully', () => {
      render(
        <DataProvider initialResellers={[]}>
          <CyberResellersManager />
        </DataProvider>
      )
      
      expect(screen.getByText('Revendedores')).toBeInTheDocument()
      expect(screen.getByText('Nenhum revendedor encontrado')).toBeInTheDocument()
    })

    it('should handle invalid reseller data gracefully', () => {
      const invalidReseller = {
        id: 12345,
        nome: '',
        whatsapp: '',
        servidor: '',
        purchasePrice: 0,
        salePrice: 0,
        activeClients: 0,
        totalSales: 0,
        status: 'inactive' as const,
        createdAt: new Date().toISOString(),
      }
      
      render(
        <DataProvider initialResellers={[invalidReseller]}>
          <CyberResellersManager />
        </DataProvider>
      )
      
      expect(screen.getByText('Revendedores')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeResellerList = Array.from({ length: 100 }, (_, i) => 
        testUtils.createMockReseller({
          id: `reseller-${i}`,
          nome: `Reseller ${i}`,
          email: `reseller${i}@example.com`,
          comissao: 10 + (i % 30),
          clientesAtivos: i % 50,
          totalVendas: (i % 1000) * 10,
          status: i % 3 === 0 ? 'ativo' : i % 3 === 1 ? 'inativo' : 'pendente',
        })
      )
      
      const startTime = performance.now()
      
      render(
        <DataProvider initialResellers={largeResellerList}>
          <CyberResellersManager />
        </DataProvider>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(screen.getByText('Revendedores')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second
    })

    it('should debounce search input', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberResellersManager />)
      
      const searchInput = screen.getByPlaceholderText('Buscar revendedores...')
      
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