import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CyberLeadsManager from '../components/CyberLeadsManager'
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

describe('CyberLeadsManager', () => {
  const mockLeads = [
    testUtils.createMockLead({
      id: 'lead-1',
      nome: 'Carlos Eduardo',
      email: 'carlos@example.com',
      telefone: '(11) 98765-4321',
      origem: 'website',
      status: 'novo',
      interesse: 'IPTV Premium',
      dataCadastro: new Date().toISOString(),
      observacoes: 'Interessado em plano anual',
    }),
    testUtils.createMockLead({
      id: 'lead-2',
      nome: 'Ana Paula',
      email: 'ana@example.com',
      telefone: '(21) 99876-5432',
      origem: 'indicacao',
      status: 'contatado',
      interesse: 'IPTV Básico',
      dataCadastro: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      observacoes: 'Indicada por cliente existente',
    }),
    testUtils.createMockLead({
      id: 'lead-3',
      nome: 'Roberto Silva',
      email: 'roberto@example.com',
      telefone: '(31) 91234-5678',
      origem: 'facebook',
      status: 'convertido',
      interesse: 'IPTC Corporativo',
      dataCadastro: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      observacoes: 'Empresa de médio porte',
    }),
  ]

  const renderWithDataProvider = (ui: React.ReactElement, options = {}) => {
    return render(
      <DataProvider initialLeads={mockLeads}>
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
      renderWithDataProvider(<CyberLeadsManager />)
      expect(screen.getByText('Leads')).toBeInTheDocument()
    })

    it('should display the leads list with correct data', () => {
      renderWithDataProvider(<CyberLeadsManager />)
      
      expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
      expect(screen.getByText('Ana Paula')).toBeInTheDocument()
      expect(screen.getByText('Roberto Silva')).toBeInTheDocument()
    })

    it('should display lead status badges correctly', () => {
      renderWithDataProvider(<CyberLeadsManager />)
      
      expect(screen.getByText('novo')).toBeInTheDocument()
      expect(screen.getByText('contatado')).toBeInTheDocument()
      expect(screen.getByText('convertido')).toBeInTheDocument()
    })

    it('should display lead origins correctly', () => {
      renderWithDataProvider(<CyberLeadsManager />)
      
      expect(screen.getByText('website')).toBeInTheDocument()
      expect(screen.getByText('indicacao')).toBeInTheDocument()
      expect(screen.getByText('facebook')).toBeInTheDocument()
    })

    it('should display lead interests correctly', () => {
      renderWithDataProvider(<CyberLeadsManager />)
      
      expect(screen.getByText('IPTV Premium')).toBeInTheDocument()
      expect(screen.getByText('IPTV Básico')).toBeInTheDocument()
      expect(screen.getByText('IPTV Corporativo')).toBeInTheDocument()
    })
  })

  describe('Search and Filtering', () => {
    it('should filter leads by search term', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const searchInput = screen.getByPlaceholderText('Buscar leads...')
      await user.type(searchInput, 'Carlos')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
        expect(screen.queryByText('Ana Paula')).not.toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })

    it('should filter by status', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const statusFilter = screen.getByLabelText('Status')
      await user.selectOptions(statusFilter, 'novo')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
        expect(screen.queryByText('Ana Paula')).not.toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })

    it('should filter by origin', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const originFilter = screen.getByLabelText('Origem')
      await user.selectOptions(originFilter, 'website')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
        expect(screen.queryByText('Ana Paula')).not.toBeInTheDocument()
        expect(screen.queryByText('Roberto Silva')).not.toBeInTheDocument()
      })
    })

    it('should filter by date range', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const dateFromFilter = screen.getByLabelText('Data de')
      const dateToFilter = screen.getByLabelText('até')
      
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      
      await user.type(dateFromFilter, yesterday.toISOString().split('T')[0])
      await user.type(dateToFilter, today.toISOString().split('T')[0])
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
      })
    })
  })

  describe('Lead Actions', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const editButton = screen.getAllByLabelText('Editar lead')[0]
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByText('Editar Lead')).toBeInTheDocument()
      })
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const deleteButton = screen.getAllByLabelText('Excluir lead')[0]
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir este lead?')).toBeInTheDocument()
      })
    })

    it('should convert lead to client', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const convertButton = screen.getAllByLabelText('Converter lead')[0]
      await user.click(convertButton)
      
      await waitFor(() => {
        expect(screen.getByText('Converter Lead em Cliente')).toBeInTheDocument()
      })
    })

    it('should cancel conversion when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const convertButton = screen.getAllByLabelText('Converter lead')[0]
      await user.click(convertButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Converter Lead em Cliente')).not.toBeInTheDocument()
      })
    })
  })

  describe('Add New Lead', () => {
    it('should open add lead modal when add button is clicked', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo lead')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Lead')).toBeInTheDocument()
      })
    })

    it('should validate required fields in add form', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo lead')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Lead')).toBeInTheDocument()
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
      renderWithDataProvider(<CyberLeadsManager />)
      
      const addButton = screen.getByLabelText('Adicionar novo lead')
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Lead')).toBeInTheDocument()
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
  })

  describe('Export Functionality', () => {
    it('should export leads data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const exportButton = screen.getByLabelText('Exportar leads')
      await user.click(exportButton)
      
      // Should trigger export (mocked)
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })

    it('should export filtered results', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      // Apply filter first
      const searchInput = screen.getByPlaceholderText('Buscar leads...')
      await user.type(searchInput, 'Carlos')
      
      await waitFor(() => {
        expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
      })
      
      // Then export
      const exportButton = screen.getByLabelText('Exportar leads')
      await user.click(exportButton)
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })
  })

  describe('Import Functionality', () => {
    it('should import leads from file', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const importButton = screen.getByLabelText('Importar leads')
      await user.click(importButton)
      
      await waitFor(() => {
        expect(screen.getByText('Importar Leads')).toBeInTheDocument()
      })
    })

    it('should validate imported data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const importButton = screen.getByLabelText('Importar leads')
      await user.click(importButton)
      
      await waitFor(() => {
        expect(screen.getByText('Importar Leads')).toBeInTheDocument()
      })
      
      // Test with invalid file
      const fileInput = screen.getByLabelText('Arquivo Excel')
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' })
      
      await user.upload(fileInput, invalidFile)
      
      await waitFor(() => {
        expect(screen.getByText('Formato de arquivo inválido')).toBeInTheDocument()
      })
    })
  })

  describe('Bulk Actions', () => {
    it('should select multiple leads', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const selectAllCheckbox = screen.getByLabelText('Selecionar todos')
      await user.click(selectAllCheckbox)
      
      // Should select all visible leads
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(1)
    })

    it('should delete selected leads', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      // Select first lead
      const firstCheckbox = screen.getAllByRole('checkbox')[1] // Skip header checkbox
      await user.click(firstCheckbox)
      
      // Click delete selected
      const deleteSelectedButton = screen.getByLabelText('Excluir selecionados')
      await user.click(deleteSelectedButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir os leads selecionados?')).toBeInTheDocument()
      })
    })

    it('should export selected leads', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      // Select first lead
      const firstCheckbox = screen.getAllByRole('checkbox')[1] // Skip header checkbox
      await user.click(firstCheckbox)
      
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
      renderWithDataProvider(<CyberLeadsManager />)
      
      expect(screen.getByLabelText('Buscar leads...')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByLabelText('Origem')).toBeInTheDocument()
      expect(screen.getByLabelText('Data de')).toBeInTheDocument()
      expect(screen.getByLabelText('até')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const searchInput = screen.getByPlaceholderText('Buscar leads...')
      await user.tab()
      
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty leads list gracefully', () => {
      render(
        <DataProvider initialLeads={[]}>
          <CyberLeadsManager />
        </DataProvider>
      )
      
      expect(screen.getByText('Leads')).toBeInTheDocument()
      expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument()
    })

    it('should handle invalid lead data gracefully', () => {
      const invalidLead = {
        id: 12345,
        nome: '',
        whatsapp: '',
        observacoes: '',
        status: 'Novo' as const,
        source: '',
        createdAt: new Date().toISOString(),
      }
      
      render(
        <DataProvider initialLeads={[invalidLead]}>
          <CyberLeadsManager />
        </DataProvider>
      )
      
      expect(screen.getByText('Leads')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeLeadList = Array.from({ length: 100 }, (_, i) => 
        testUtils.createMockLead({
          id: `lead-${i}`,
          nome: `Lead ${i}`,
          email: `lead${i}@example.com`,
        })
      )
      
      const startTime = performance.now()
      
      render(
        <DataProvider initialLeads={largeLeadList}>
          <CyberLeadsManager />
        </DataProvider>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(screen.getByText('Leads')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second
    })

    it('should debounce search input', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberLeadsManager />)
      
      const searchInput = screen.getByPlaceholderText('Buscar leads...')
      
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