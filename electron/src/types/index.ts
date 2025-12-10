export interface Client {
    id: number;
    nome: string;
    whatsapp?: string;
    login?: string;
    senha?: string;
    plano?: string;
    valor: number;
    ativacao?: string;
    vencimento?: string;
    formaPagamento?: string;
    statusPagamento: 'Pago' | 'Pendente' | 'Atrasado';
    servidor?: string;
    dispositivo?: string;
    aplicativo?: string;
    macAddress?: string;
    chaveDispositivo?: string;
    prospeccao?: string;
    situacao: 'Ativo' | 'Inativo' | 'Pendente';
    listaM3U?: string;
    observacoes?: string;
    dataPagamento?: string;
    archived?: number;
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Lead {
    id: number;
    nome: string;
    whatsapp?: string;
    observacoes?: string;
    status: 'Novo' | 'Em Andamento' | 'Convertido' | 'Perdido';
    source: string;
    createdAt: string;
    category: 'new' | 'migration';
    contador_testes: number;
    fromMigration?: boolean;
    migratedFromClientId?: number;
    migratedAt?: string;
    originalExpiration?: string;
    originalStatusPagamento?: string;
    migrationReason?: string;
    originalPlano?: string;
    originalValor?: string;
}

export interface RevenueTransaction {
    id: number;
    clientId: number;
    clientName: string;
    amount: number;
    type: 'subscription' | 'renewal' | 'other';
    date: string;
    description?: string;
    serverSnapshot?: string;
    costSnapshot?: number;
    monthsSnapshot?: number;
    status?: 'committed' | 'pending' | 'reverted';
    reversedAt?: string;
    refTransactionId?: number;
}

export interface Test {
    id: number;
    clientName: string;
    whatsapp?: string;
    plano?: string;
    server?: string;
    durationHours: number;
    startAt: string;
    endAt: string;
    endDate?: string;
    notes?: string;
    status: 'active' | 'expired' | 'converted';
    convertedToClient?: number;
}

export interface Reseller {
    id: number;
    name: string;
    whatsapp?: string;
    servidor?: string;
    buyPrice: number;
    sellPrice: number;
    totalSales: number;
    status: 'Ativo' | 'Inativo';
    created_at?: string;
}

export interface SystemLogEntry {
    id: number;
    date: string;
    type: 'system' | 'client_added' | 'client_updated' | 'client_archived' | 'payment_confirmed' | 'revenue_added' | 'transaction_reverted' | 'test_created' | 'lead_created';
    clientId?: number;
    clientName?: string;
    leadId?: number;
    leadName?: string;
    testId?: number;
    testPhone?: string;
    reason?: string;
    originalClient?: string;
    originalTest?: string;
}
