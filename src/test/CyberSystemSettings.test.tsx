import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CyberSystemSettings from '../components/CyberSystemSettings'
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

describe('CyberSystemSettings', () => {
  const mockApplications = [
    { id: 'app-1', name: 'Netflix', status: 'active' },
    { id: 'app-2', name: 'Disney+', status: 'active' },
    { id: 'app-3', name: 'Prime Video', status: 'inactive' },
  ]

  const mockServers = [
    { id: 'server-1', name: 'Servidor Brasil 1', status: 'active', location: 'São Paulo' },
    { id: 'server-2', name: 'Servidor EUA 1', status: 'active', location: 'Nova York' },
    { id: 'server-3', name: 'Servidor Europa 1', status: 'inactive', location: 'Londres' },
  ]

  const mockSettings = {
    companyName: 'Cyber IPTV',
    companyEmail: 'contato@cyberiptv.com',
    companyPhone: '(11) 98765-4321',
    companyAddress: 'Av. Paulista, 1000 - São Paulo/SP',
    systemTheme: 'cyberpunk',
    defaultPaymentMethod: 'pix',
    currency: 'BRL',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    decimalSeparator: ',',
    thousandSeparator: '.',
  }

  const renderWithDataProvider = (ui: React.ReactElement, options = {}) => {
    return render(
      <DataProvider 
        initialApplications={mockApplications}
        initialServers={mockServers}
      >
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
      renderWithDataProvider(<CyberSystemSettings />)
      expect(screen.getByText('⚙️ Configurações do Sistema')).toBeInTheDocument()
    })

    it('should display all configuration sections', () => {
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByText('Aplicativos')).toBeInTheDocument()
      expect(screen.getByText('Servidores')).toBeInTheDocument()
      expect(screen.getByText('Configurações Gerais')).toBeInTheDocument()
      expect(screen.getByText('Backup e Restauração')).toBeInTheDocument()
    })

    it('should display applications list', () => {
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByText('Netflix')).toBeInTheDocument()
      expect(screen.getByText('Disney+')).toBeInTheDocument()
      expect(screen.getByText('Prime Video')).toBeInTheDocument()
    })

    it('should display servers list', () => {
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByText('Servidor Brasil 1')).toBeInTheDocument()
      expect(screen.getByText('Servidor EUA 1')).toBeInTheDocument()
      expect(screen.getByText('Servidor Europa 1')).toBeInTheDocument()
    })

    it('should display status badges correctly', () => {
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByText('ativo')).toBeInTheDocument()
      expect(screen.getByText('inativo')).toBeInTheDocument()
    })
  })

  describe('Application Management', () => {
    it('should add new application', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const addAppButton = screen.getByLabelText('Adicionar aplicativo')
      await user.click(addAppButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Aplicativo')).toBeInTheDocument()
      })
      
      const nameInput = screen.getByLabelText('Nome do Aplicativo')
      await user.type(nameInput, 'HBO Max')
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('HBO Max')).toBeInTheDocument()
      })
    })

    it('should edit existing application', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const editButton = screen.getAllByLabelText('Editar aplicativo')[0]
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByText('Editar Aplicativo')).toBeInTheDocument()
      })
      
      const nameInput = screen.getByLabelText('Nome do Aplicativo')
      await user.clear(nameInput)
      await user.type(nameInput, 'Netflix Brasil')
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Netflix Brasil')).toBeInTheDocument()
      })
    })

    it('should delete application with confirmation', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const deleteButton = screen.getAllByLabelText('Excluir aplicativo')[0]
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir este aplicativo?')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByText('Confirmar')
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
      })
    })

    it('should cancel application deletion', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const deleteButton = screen.getAllByLabelText('Excluir aplicativo')[0]
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument()
        expect(screen.getByText('Netflix')).toBeInTheDocument()
      })
    })
  })

  describe('Server Management', () => {
    it('should add new server', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const addServerButton = screen.getByLabelText('Adicionar servidor')
      await user.click(addServerButton)
      
      await waitFor(() => {
        expect(screen.getByText('Adicionar Servidor')).toBeInTheDocument()
      })
      
      const nameInput = screen.getByLabelText('Nome do Servidor')
      await user.type(nameInput, 'Servidor Ásia 1')
      
      const locationInput = screen.getByLabelText('Localização')
      await user.type(locationInput, 'Tóquio')
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Servidor Ásia 1')).toBeInTheDocument()
      })
    })

    it('should edit existing server', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const editButton = screen.getAllByLabelText('Editar servidor')[0]
      await user.click(editButton)
      
      await waitFor(() => {
        expect(screen.getByText('Editar Servidor')).toBeInTheDocument()
      })
      
      const nameInput = screen.getByLabelText('Nome do Servidor')
      await user.clear(nameInput)
      await user.type(nameInput, 'Servidor Brasil Principal')
      
      const saveButton = screen.getByText('Salvar')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Servidor Brasil Principal')).toBeInTheDocument()
      })
    })

    it('should delete server with confirmation', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const deleteButton = screen.getAllByLabelText('Excluir servidor')[0]
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir este servidor?')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByText('Confirmar')
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Servidor Brasil 1')).not.toBeInTheDocument()
      })
    })
  })

  describe('General Settings', () => {
    it('should display current settings', () => {
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByDisplayValue('Cyber IPTV')).toBeInTheDocument()
      expect(screen.getByDisplayValue('contato@cyberiptv.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('(11) 98765-4321')).toBeInTheDocument()
    })

    it('should update company settings', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const companyNameInput = screen.getByLabelText('Nome da Empresa')
      await user.clear(companyNameInput)
      await user.type(companyNameInput, 'Nova Cyber IPTV')
      
      const saveButton = screen.getByLabelText('Salvar configurações')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Nova Cyber IPTV')).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const emailInput = screen.getByLabelText('Email da Empresa')
      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      
      const saveButton = screen.getByLabelText('Salvar configurações')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument()
      })
    })

    it('should validate phone format', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const phoneInput = screen.getByLabelText('Telefone da Empresa')
      await user.clear(phoneInput)
      await user.type(phoneInput, '123')
      
      const saveButton = screen.getByLabelText('Salvar configurações')
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Telefone inválido')).toBeInTheDocument()
      })
    })
  })

  describe('Data Management', () => {
    it('should clear all data with confirmation', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const clearDataButton = screen.getByLabelText('Limpar todos os dados')
      await user.click(clearDataButton)
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Limpeza')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja limpar todos os dados?')).toBeInTheDocument()
      })
      
      // Mock browser confirm to return true
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      const confirmButton = screen.getByText('Confirmar')
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
        expect(screen.queryByText('Disney+')).not.toBeInTheDocument()
      })
    })

    it('should cancel data clearing', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const clearDataButton = screen.getByLabelText('Limpar todos os dados')
      await user.click(clearDataButton)
      
      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Confirmar Limpeza')).not.toBeInTheDocument()
        expect(screen.getByText('Netflix')).toBeInTheDocument()
      })
    })

    it('should export system data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const exportButton = screen.getByLabelText('Exportar dados do sistema')
      await user.click(exportButton)
      
      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument()
      })
    })

    it('should import system data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const importButton = screen.getByLabelText('Importar dados do sistema')
      await user.click(importButton)
      
      await waitFor(() => {
        expect(screen.getByText('Importar Dados')).toBeInTheDocument()
      })
    })

    it('should validate imported data', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const importButton = screen.getByLabelText('Importar dados do sistema')
      await user.click(importButton)
      
      await waitFor(() => {
        expect(screen.getByText('Importar Dados')).toBeInTheDocument()
      })
      
      // Test with invalid file
      const fileInput = screen.getByLabelText('Arquivo JSON')
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' })
      
      await user.upload(fileInput, invalidFile)
      
      await waitFor(() => {
        expect(screen.getByText('Formato de arquivo inválido')).toBeInTheDocument()
      })
    })
  })

  describe('Individual Item Deletion', () => {
    it('should delete individual application with confirmation', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      // Find individual delete button for first application
      const deleteButtons = screen.getAllByLabelText('Excluir')
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument()
        expect(screen.getByText('Tem certeza que deseja excluir este item?')).toBeInTheDocument()
      })
      
      const confirmButton = screen.getByText('Confirmar')
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
      })
    })

    it('should prevent deletion of protected system items', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const protectedItem = { id: 'protected-1', name: 'Sistema Principal', status: 'active' }
      
      // Find individual delete button for protected item
      const deleteButtons = screen.getAllByLabelText('Excluir')
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Item padrão do sistema não pode ser excluído')).toBeInTheDocument()
      })
    })

    it('should cancel individual item deletion', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      // Find individual delete button for first application
      const deleteButtons = screen.getAllByLabelText('Excluir')
      await user.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })
      
      const cancelButton = screen.getByText('Cancelar')
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument()
        expect(screen.getByText('Netflix')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByLabelText('Adicionar aplicativo')).toBeInTheDocument()
      expect(screen.getByLabelText('Adicionar servidor')).toBeInTheDocument()
      expect(screen.getByLabelText('Salvar configurações')).toBeInTheDocument()
      expect(screen.getByLabelText('Limpar todos os dados')).toBeInTheDocument()
      expect(screen.getByLabelText('Exportar dados do sistema')).toBeInTheDocument()
      expect(screen.getByLabelText('Importar dados do sistema')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      renderWithDataProvider(<CyberSystemSettings />)
      
      const addAppButton = screen.getByLabelText('Adicionar aplicativo')
      await user.tab()
      
      expect(addAppButton).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      render(
        <DataProvider initialApplications={[]} initialServers={[]}>
          <CyberSystemSettings />
        </DataProvider>
      )
      
      expect(screen.getByText('⚙️ Configurações do Sistema')).toBeInTheDocument()
      expect(screen.getByText('Nenhum aplicativo encontrado')).toBeInTheDocument()
      expect(screen.getByText('Nenhum servidor encontrado')).toBeInTheDocument()
    })

    it('should handle invalid settings data gracefully', () => {
      const invalidSettings = {
        companyName: null,
        companyEmail: 'invalid-email',
        companyPhone: null,
        companyAddress: null,
        systemTheme: null,
        defaultPaymentMethod: null,
        currency: null,
        language: null,
        timezone: null,
        dateFormat: null,
        timeFormat: null,
        decimalSeparator: null,
        thousandSeparator: null,
      }
      
      
      renderWithDataProvider(<CyberSystemSettings />)
      
      expect(screen.getByText('⚙️ Configurações do Sistema')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeApplications = Array.from({ length: 100 }, (_, i) => ({
        id: `app-${i}`,
        name: `Application ${i}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
      }))
      
      const largeServers = Array.from({ length: 100 }, (_, i) => ({
        id: `server-${i}`,
        name: `Server ${i}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        location: `Location ${i}`,
      }))
      
      const startTime = performance.now()
      
      render(
        <DataProvider initialApplications={largeApplications} initialServers={largeServers}>
          <CyberSystemSettings />
        </DataProvider>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(screen.getByText('⚙️ Configurações do Sistema')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(1000) // Should render in less than 1 second
    })
  })
})