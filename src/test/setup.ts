import '@testing-library/jest-dom'
import { vi } from 'vitest'

  // No longer using Electron API - PWA only
  // Keep empty electronAPI mock to prevent errors in any remaining test code
  ; (window as any).electronAPI = undefined
  // Marcar ambiente de teste
  ; (window as any).IS_TEST_ENV = true

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock CustomEvent constructor if not available
global.CustomEvent = class CustomEvent extends Event {
  detail: any
  constructor(type: string, eventInitDict?: CustomEventInit) {
    super(type, eventInitDict)
    this.detail = eventInitDict?.detail
  }
  initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: any): void {
    // Mock implementation
  }
}

// Mock console methods to reduce noise in tests, but keep error and warn
const originalConsole = {
  log: console.log,
  debug: console.debug,
  info: console.info,
}

console.log = vi.fn()
console.debug = vi.fn()
console.info = vi.fn()

// Keep error and warn for debugging
console.error = originalConsole.log.bind(console)
console.warn = originalConsole.log.bind(console)

// Mock crypto for consistent UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
  },
  writable: true,
  configurable: true
}) // Cast entire FormData mock as any to avoid TypeScript issues

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
} as any

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  } as Response)
)

// Mock Notification API
global.Notification = vi.fn().mockImplementation(() => ({
  permission: 'granted',
  requestPermission: vi.fn(() => Promise.resolve('granted')),
})) as any

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  readAsBinaryString: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  result: null,
  error: null,
  readyState: 0,
})) as any

// Mock File constructor
global.File = class File {
  name: string
  size: number
  type: string
  lastModified: number
  webkitRelativePath: string = ''

  constructor(parts: any[], name: string, options?: FilePropertyBag) {
    this.name = name
    this.size = parts.reduce((acc, part) => acc + (part.length || part.size || 0), 0)
    this.type = options?.type || ''
    this.lastModified = options?.lastModified || Date.now()
  }

  slice() { return this }
  stream() { return new ReadableStream() }
  text() { return Promise.resolve('') }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)) }
  bytes() { return Promise.resolve(new Uint8Array(0)) }
}

// Mock FormData
global.FormData = class FormData {
  private data = new Map<string, any>()

  append(name: string, value: any, filename?: string) {
    this.data.set(name, { value, filename })
  }

  delete(name: string) {
    this.data.delete(name)
  }

  get(name: string) {
    const item = this.data.get(name)
    return item ? item.value : null
  }

  getAll(name: string) {
    const item = this.data.get(name)
    return item ? [item.value] : []
  }

  has(name: string) {
    return this.data.has(name)
  }

  set(name: string, value: any, filename?: string) {
    this.data.set(name, { value, filename })
  }

  forEach(callback: (value: any, key: string, parent: FormData) => void, thisArg?: any) {
    this.data.forEach((item, key) => {
      callback.call(thisArg, item.value, key, this)
    })
  }

  entries() {
    const entries = Array.from(this.data.entries()).map(([key, item]) => [key, item.value] as [string, any])
    return {
      *[Symbol.iterator]() {
        for (const entry of entries) {
          yield entry
        }
      },
      next() {
        const entry = entries.shift()
        return entry ? { value: entry, done: false } : { value: undefined, done: true }
      }
    } as any
  }

  keys() {
    const keys = Array.from(this.data.keys())
    return {
      *[Symbol.iterator]() {
        for (const key of keys) {
          yield key
        }
      },
      next() {
        const key = keys.shift()
        return key ? { value: key, done: false } : { value: undefined, done: true }
      }
    } as any
  }

  values() {
    const values = Array.from(this.data.values()).map(item => item.value)
    return {
      *[Symbol.iterator]() {
        for (const value of values) {
          yield value
        }
      },
      next() {
        const value = values.shift()
        return value ? { value, done: false } : { value: undefined, done: true }
      }
    } as any
  }

  *[Symbol.iterator]() {
    for (const [key, item] of this.data.entries()) {
      yield [key, item.value] as [string, any]
    }
  }
} as any

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test')
global.URL.revokeObjectURL = vi.fn()

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) as any
})

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id)
})

// Mock setTimeout and setInterval for consistent timing
vi.useFakeTimers()

// Cleanup function for tests
export function cleanup() {
  vi.clearAllMocks()
  vi.clearAllTimers()
}

// Test utilities
export const testUtils = {
  // Wait for async operations
  waitForAsync: async (ms = 0) => {
    await vi.advanceTimersByTimeAsync(ms || 1)
  },

  // Mock localStorage data removed - SQLite system only

  // Create mock client data
  createMockClient: (overrides = {}) => ({
    id: 'test-client-' + Math.random().toString(36).substr(2, 9),
    nome: 'Test Client',
    email: 'test@example.com',
    telefone: '(11) 98765-4321',
    cpfCnpj: '123.456.789-09',
    endereco: 'Test Address',
    aplicativo: 'Test App',
    servidor: 'Test Server',
    status: 'ativo',
    statusPagamento: 'pago',
    valor: 100,
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    dataCadastro: new Date().toISOString(),
    observacoes: 'Test observations',
    ...overrides
  }),

  // Create mock lead data
  createMockLead: (overrides = {}) => ({
    id: 'test-lead-' + Math.random().toString(36).substr(2, 9),
    nome: 'Test Lead',
    email: 'lead@example.com',
    telefone: '(11) 98765-4321',
    origem: 'website',
    status: 'novo',
    interesse: 'IPTV Service',
    dataCadastro: new Date().toISOString(),
    observacoes: 'Test lead observations',
    ...overrides
  }),

  // Create mock transaction data
  createMockTransaction: (overrides = {}) => ({
    id: 'test-transaction-' + Math.random().toString(36).substr(2, 9),
    clienteId: 'test-client',
    clienteNome: 'Test Client',
    tipo: 'pagamento',
    valor: 100,
    descricao: 'Test transaction',
    data: new Date().toISOString(),
    metodoPagamento: 'pix',
    status: 'confirmado',
    ...overrides
  }),

  // Create mock reseller data
  createMockReseller: (overrides = {}) => ({
    id: 'test-reseller-' + Math.random().toString(36).substr(2, 9),
    nome: 'Test Reseller',
    email: 'reseller@example.com',
    telefone: '(11) 98765-4321',
    comissao: 20,
    clientesAtivos: 10,
    totalVendas: 1000,
    status: 'ativo',
    dataCadastro: new Date().toISOString(),
    ...overrides
  }),

  // Create mock test data
  createMockTest: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    clientId: Math.floor(Math.random() * 100),
    clientName: 'Test Client',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    notes: 'Test description',
    whatsapp: '5511999999999',
    server: 'server1',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    durationHours: 24,
    ...overrides
  }),
}

// Global test setup
declare global {
  var testUtils: any
  var cleanup: any
}

global.testUtils = testUtils
global.cleanup = cleanup
