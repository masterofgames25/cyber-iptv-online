-- Add credit_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reseller_id INTEGER,
  type TEXT,
  quantity INTEGER,
  unit_price REAL,
  total REAL,
  date DATETIME,
  description TEXT,
  operator_name TEXT,
  party_name TEXT,
  server TEXT,
  FOREIGN KEY (reseller_id) REFERENCES resellers(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_tx_reseller ON credit_transactions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_date ON credit_transactions(date);
