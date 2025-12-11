-- APENAS RESELLERS

ALTER TABLE resellers DISABLE ROW LEVEL SECURITY;
DELETE FROM resellers WHERE id > 0;

INSERT INTO resellers (name, whatsapp, servidor, status, "buyPrice", "sellPrice", "totalSales", created_at, user_id) VALUES ('Revendedor Sem Nome', '+5521976675808', 'NEWTVS', 'Ativo', 0, 0, 0, NOW(), 'cc51e332-4566-44fe-8301-23c44e21eb9e');
INSERT INTO resellers (name, whatsapp, servidor, status, "buyPrice", "sellPrice", "totalSales", created_at, user_id) VALUES ('Revendedor Sem Nome', '+553298847713', 'NEWTVS', 'Ativo', 0, 0, 0, NOW(), 'cc51e332-4566-44fe-8301-23c44e21eb9e');

ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
SELECT COUNT(*) as total_resellers FROM resellers;
