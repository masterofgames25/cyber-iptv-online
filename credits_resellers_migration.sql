-- MIGRATION: CREDIT TRANSACTIONS + RESELLERS FIX (CamelCase)

ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE resellers DISABLE ROW LEVEL SECURITY;
DELETE FROM credit_transactions WHERE id > 0;
DELETE FROM resellers WHERE id > 0;

-- CREDIT TRANSACTIONS
INSERT INTO credit_transactions (type, quantity, "unitPrice", total, date, "operatorName", "partyName", server, user_id) VALUES ('purchase', 20, 6.5, 130, '2025-11-27T17:58:49.634Z', 'har', 'gideon', 'NEWTVS', 'cc51e332-4566-44fe-8301-23c44e21eb9e');
INSERT INTO credit_transactions (type, quantity, "unitPrice", total, date, "operatorName", "partyName", server, user_id) VALUES ('sale', 20, 8, 160, '2025-11-27T17:58:58.456Z', 'har', 'leo costa', 'NEWTVS', 'cc51e332-4566-44fe-8301-23c44e21eb9e');
INSERT INTO credit_transactions (type, quantity, "unitPrice", total, date, "operatorName", "partyName", server, user_id) VALUES ('sale', 10, 9, 90, '2025-12-04T20:55:49.973Z', 'Operador', 'Wilson Lino de Oliveira', 'NEWTVS', 'cc51e332-4566-44fe-8301-23c44e21eb9e');
INSERT INTO credit_transactions (type, quantity, "unitPrice", total, date, "operatorName", "partyName", server, user_id) VALUES ('purchase', 10, 6.5, 65, '2025-12-04T20:56:29.222Z', 'eu', 'gideon', 'NEWTVS', 'cc51e332-4566-44fe-8301-23c44e21eb9e');

-- RESELLERS
INSERT INTO resellers (name, whatsapp, servidor, status, "buyPrice", "sellPrice", "totalSales", created_at, user_id) VALUES ('leo costa', '+5521976675808', 'NEWTVS', 'Ativo', 0, 0, 160, NOW(), 'cc51e332-4566-44fe-8301-23c44e21eb9e');
INSERT INTO resellers (name, whatsapp, servidor, status, "buyPrice", "sellPrice", "totalSales", created_at, user_id) VALUES ('Wilson Lino de Oliveira', '+553298847713', 'NEWTVS', 'Ativo', 0, 0, 90, NOW(), 'cc51e332-4566-44fe-8301-23c44e21eb9e');

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
SELECT COUNT(*) as total_credits FROM credit_transactions;
SELECT COUNT(*) as total_resellers FROM resellers;
