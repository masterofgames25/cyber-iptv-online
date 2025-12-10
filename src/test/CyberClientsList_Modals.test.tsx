import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { CyberClientsList } from '../components/CyberClientsList'
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

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: (props: any) => <div {...props} />,
        button: (props: any) => <button {...props} />,
        input: (props: any) => <input {...props} />,
        select: (props: any) => <select {...props} />,
        textarea: (props: any) => <textarea {...props} />,
        tr: (props: any) => <tr {...props} />,
        td: (props: any) => <td {...props} />,
        th: (props: any) => <th {...props} />,
        table: (props: any) => <table {...props} />,
        tbody: (props: any) => <tbody {...props} />,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
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
        observacoes: 'Test observations',
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
]

// Mock useClientsLogic
const mockAddClient = vi.fn();
const mockUpdateClient = vi.fn();
const mockDeleteClient = vi.fn();

vi.mock('../hooks/useClientsLogic', () => ({
    useClientsLogic: () => ({
        clients: mockClients,
        filteredClients: mockClients,
        paginatedClients: mockClients,
        totalPages: 1,
        currentPage: 1,
        setCurrentPage: vi.fn(),
        searchTerm: '',
        setSearchTerm: vi.fn(),
        filterStatus: 'all',
        setFilterStatus: vi.fn(),
        filterExpiration: 'all',
        setFilterExpiration: vi.fn(),
        selectedServers: [],
        setSelectedServers: vi.fn(),
        selectedApps: [],
        setSelectedApps: vi.fn(),
        selectedDevices: [],
        setSelectedDevices: vi.fn(),
        paymentFilter: 'all',
        setPaymentFilter: vi.fn(),
        viewMode: 'table',
        setViewMode: vi.fn(),
        serversList: ['Server1'],
        appsList: ['App1'],
        devicesList: ['Device1'],
        stats: { active: 1, expired: 0, expiring: 0, revenue: 100 },
        expStatusMap: {},
        addClient: mockAddClient,
        updateClient: mockUpdateClient,
        deleteClient: mockDeleteClient
    })
}))

describe('CyberClientsList Modals', () => {
    const renderWithDataProvider = (ui: React.ReactElement) => {
        return render(
            <CyberpunkNotificationProvider>
                {ui}
            </CyberpunkNotificationProvider>
        )
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should open form modal when "Novo Cliente" is clicked', async () => {
        renderWithDataProvider(<CyberClientsList />)

        const newClientButton = screen.getByText('Novo Cliente')
        fireEvent.click(newClientButton)

        await waitFor(() => {
            expect(screen.getByText('Novo Cliente')).toBeInTheDocument()
        })
    })

    it('should open details modal when "Visualizar" is clicked', async () => {
        renderWithDataProvider(<CyberClientsList />)

        const viewButtons = screen.getAllByTitle('Visualizar')
        fireEvent.click(viewButtons[0])

        await waitFor(() => {
            expect(screen.getByText('Detalhes do Cliente')).toBeInTheDocument()
            expect(screen.getByText('João Silva')).toBeInTheDocument()
            expect(screen.getByText('Test observations')).toBeInTheDocument()
        })
    })

    it('should open renew modal when "Renovar" is clicked', async () => {
        renderWithDataProvider(<CyberClientsList />)

        const renewButtons = screen.getAllByTitle('Renovar')
        fireEvent.click(renewButtons[0])

        await waitFor(() => {
            expect(screen.getByText('Renovar Assinatura')).toBeInTheDocument()
            expect(screen.getByText('João Silva')).toBeInTheDocument()
        })
    })

    it('should mark client as paid when "Marcar Pago" is clicked', async () => {
        renderWithDataProvider(<CyberClientsList />)

        // Find the pending client (Maria Santos)
        const pendingClientRow = screen.getByText('Maria Santos').closest('tr')
        expect(pendingClientRow).toBeInTheDocument()

        // Find "Marcar Pago" button within that row
        const markPaidButton = within(pendingClientRow!).getByTitle('Marcar Pago')
        fireEvent.click(markPaidButton)

        await waitFor(() => {
            // Should show success notification
            expect(screen.getByText(/Pagamento Confirmado/i)).toBeInTheDocument()
            expect(mockUpdateClient).toHaveBeenCalledWith(expect.objectContaining({
                id: 2,
                statusPagamento: 'Pago'
            }))
        })
    })
})
