-- ==============================================
-- ASSOCIAR DADOS EXISTENTES AO SEU USUÁRIO
-- Execute este script no Supabase SQL Editor
-- ==============================================

-- Seu User ID
DO $$
DECLARE
  my_user_id UUID := 'cc51e332-4566-44fe-8301-23c44e21eb9e';
BEGIN
  -- Dados principais
  UPDATE clients SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE leads SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE revenue_transactions SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE tests SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE resellers SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE system_log SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE credit_transactions SET user_id = my_user_id WHERE user_id IS NULL;
  
  -- Configurações
  UPDATE planos SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE servidores SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE formas_pagamento SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE dispositivos SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE aplicativos SET user_id = my_user_id WHERE user_id IS NULL;
  UPDATE fontes_lead SET user_id = my_user_id WHERE user_id IS NULL;
  
  RAISE NOTICE 'Dados associados ao usuário com sucesso!';
END $$;

-- Verificar quantos registros foram atualizados
SELECT 'clients' as tabela, COUNT(*) as total
FROM clients
WHERE
    user_id = 'cc51e332-4566-44fe-8301-23c44e21eb9e'
UNION ALL
SELECT 'leads', COUNT(*)
FROM leads
WHERE
    user_id = 'cc51e332-4566-44fe-8301-23c44e21eb9e'
UNION ALL
SELECT 'planos', COUNT(*)
FROM planos
WHERE
    user_id = 'cc51e332-4566-44fe-8301-23c44e21eb9e'
UNION ALL
SELECT 'servidores', COUNT(*)
FROM servidores
WHERE
    user_id = 'cc51e332-4566-44fe-8301-23c44e21eb9e';