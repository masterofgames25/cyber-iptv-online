-- ==============================================
-- USER DATA ISOLATION - SQL MIGRATION SCRIPT
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================

-- STEP 1: Add user_id column to all tables
-- ==============================================

-- Main data tables
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE revenue_transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE tests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE resellers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE system_log
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

-- Settings tables
ALTER TABLE planos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE servidores
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE formas_pagamento
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE dispositivos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE aplicativos
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

ALTER TABLE fontes_lead
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

-- STEP 2: Enable Row Level Security
-- ==============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

ALTER TABLE system_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

ALTER TABLE servidores ENABLE ROW LEVEL SECURITY;

ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;

ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;

ALTER TABLE aplicativos ENABLE ROW LEVEL SECURITY;

ALTER TABLE fontes_lead ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create RLS Policies
-- ==============================================

-- CLIENTS
CREATE POLICY "Users can only see their own clients" ON clients FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own clients" ON clients FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own clients" ON clients FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid () = user_id);

-- LEADS
CREATE POLICY "Users can only see their own leads" ON leads FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own leads" ON leads FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own leads" ON leads FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own leads" ON leads FOR DELETE USING (auth.uid () = user_id);

-- REVENUE TRANSACTIONS
CREATE POLICY "Users can only see their own revenue" ON revenue_transactions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own revenue" ON revenue_transactions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own revenue" ON revenue_transactions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own revenue" ON revenue_transactions FOR DELETE USING (auth.uid () = user_id);

-- TESTS
CREATE POLICY "Users can only see their own tests" ON tests FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own tests" ON tests FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own tests" ON tests FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own tests" ON tests FOR DELETE USING (auth.uid () = user_id);

-- RESELLERS
CREATE POLICY "Users can only see their own resellers" ON resellers FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own resellers" ON resellers FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own resellers" ON resellers FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own resellers" ON resellers FOR DELETE USING (auth.uid () = user_id);

-- SYSTEM LOG
CREATE POLICY "Users can only see their own logs" ON system_log FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own logs" ON system_log FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

-- CREDIT TRANSACTIONS
CREATE POLICY "Users can only see their own credits" ON credit_transactions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own credits" ON credit_transactions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own credits" ON credit_transactions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own credits" ON credit_transactions FOR DELETE USING (auth.uid () = user_id);

-- PLANOS
CREATE POLICY "Users can only see their own planos" ON planos FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own planos" ON planos FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own planos" ON planos FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own planos" ON planos FOR DELETE USING (auth.uid () = user_id);

-- SERVIDORES
CREATE POLICY "Users can only see their own servidores" ON servidores FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own servidores" ON servidores FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own servidores" ON servidores FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own servidores" ON servidores FOR DELETE USING (auth.uid () = user_id);

-- FORMAS PAGAMENTO
CREATE POLICY "Users can only see their own formas" ON formas_pagamento FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own formas" ON formas_pagamento FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own formas" ON formas_pagamento FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own formas" ON formas_pagamento FOR DELETE USING (auth.uid () = user_id);

-- DISPOSITIVOS
CREATE POLICY "Users can only see their own dispositivos" ON dispositivos FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own dispositivos" ON dispositivos FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own dispositivos" ON dispositivos FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own dispositivos" ON dispositivos FOR DELETE USING (auth.uid () = user_id);

-- APLICATIVOS
CREATE POLICY "Users can only see their own aplicativos" ON aplicativos FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own aplicativos" ON aplicativos FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own aplicativos" ON aplicativos FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own aplicativos" ON aplicativos FOR DELETE USING (auth.uid () = user_id);

-- FONTES LEAD
CREATE POLICY "Users can only see their own fontes" ON fontes_lead FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own fontes" ON fontes_lead FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own fontes" ON fontes_lead FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own fontes" ON fontes_lead FOR DELETE USING (auth.uid () = user_id);

-- ==============================================
-- DONE! Now update api.ts to include user_id
-- ==============================================