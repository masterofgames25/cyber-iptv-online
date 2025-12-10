// Lead Status Types
export type LeadStatus = 'Novo' | 'Contatado' | 'Não testou' | 'Convertido' | 'Perdido' | 'Ex-Clientes';

// Lead Interface
export interface Lead {
  id: number;
  nome: string;
  whatsapp: string;
  observacoes?: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  category?: 'new' | 'ex-client';
  fromMigration?: boolean;
  migratedFromClientId?: number;
  migratedAt?: string;
  originalExpiration?: string;
  originalStatusPagamento?: string;
  migrationReason?: string;
  originalPlano?: string;
  originalValor?: string;
  contador_testes?: number;
  testHistory?: Array<{
    id: number;
    startAt?: string;
    endAt?: string;
    durationHours?: number;
    server?: string;
    notes?: string;
    migratedAt: string;
  }>;
}

// Plan Interface
export interface Plan {
  id: number;
  name: string;
  months: number;
  price: number;
}

// Client Interface
export interface Client {
  id: number;
  nome: string;
  whatsapp: string;
  login: string;
  senha: string;
  plano: string;
  valor: number;
  ativacao: string;
  vencimento: string;
  formaPagamento: string;
  statusPagamento: 'Pendente' | 'Pago';
  dataPagamento?: string;
  servidor: string;
  dispositivo: string;
  aplicativo: string;
  macAddress: string;
  chaveDispositivo: string;
  prospeccao: string;
  situacao: 'Ativo' | 'Inativo';
  listaM3U: string;
  observacoes: string;
}

// Revenue Transaction Interface
export interface RevenueTransaction {
  id: number;
  clientId: number;
  clientName: string;
  amount: number;
  type: 'subscription' | 'renewal' | 'other';
  date: string;
  description: string;
  status?: 'committed' | 'reverted' | 'pending';
  reversedAt?: string;
  refTransactionId?: number;
}

// Test Interface
export interface Test {
  id: number;
  clientId: number;
  clientName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'converted';
  notes?: string;
  whatsapp?: string;
  server?: string;
  startAt?: string;
  endAt?: string;
  durationHours?: number;
}

// Reseller Interface
export interface Reseller {
  id: number;
  nome: string;
  whatsapp: string;
  servidor: string;
  purchasePrice: number;
  salePrice: number;
  creditCost?: number;
  creditsSold?: number;
  activeClients: number;
  totalSales: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreditTransaction {
  id: number;
  type: 'purchase' | 'sale';
  operatorName: string;
  partyName: string; // fornecedor ou revendedor
  resellerId?: number; // somente em venda
  quantity: number;
  unitPrice: number;
  total: number;
  server?: string;
  date: string;
  status: string;
  description?: string;
}
export interface ResellerTransaction {
  id: number;
  resellerId: number;
  resellerName: string;
  type: 'credit_sale';
  quantity: number;
  unitPrice: number;
  total: number;
  commissionRate: number;
  commissionTotal: number;
  date: string;
}

// Report Interface
export interface Report {
  id: number;
  title: string;
  type: 'clients' | 'revenue' | 'leads' | 'tests';
  dateRange: { start: string; end: string };
  data: any;
  createdAt: string;
}

export interface MigrationLogEntry {
  id: number;
  date: string;
  clientId: number;
  clientName: string;
  leadId: number;
  leadName: string;
  reason: string;
  originalClient: Client;
}

export interface TestMigrationLogEntry {
  id: number;
  date: string;
  testId: number;
  testPhone?: string;
  leadId: number;
  leadName: string;
  reason: string;
  originalTest: Test;
}

export type SystemLogEntryType = 'system' | 'client_migration' | 'test_migration';

export interface SystemLogEntry {
  id: number;
  date: string;
  type: SystemLogEntryType;
  clientId?: number;
  clientName?: string;
  leadId?: number;
  leadName?: string;
  testId?: number;
  testPhone?: string;
  reason: string;
  originalClient?: Client;
  originalTest?: Test;
}
