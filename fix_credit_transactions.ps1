# Fix credit_transactions table
 
$dbPath = Join-Path $env:USERPROFILE "Documents\CyberpunkIPTV\cyberpunk-iptv.db"
$sqlitePath = "d:\dowloads\cyberpunk-iptv-crm\node_modules\sqlite3\lib\binding\napi-v6-win32-x64\node_sqlite3.node"

Write-Host "Database path: $dbPath" -ForegroundColor Cyan

if (-not (Test-Path $dbPath)) {
    Write-Host "ERROR: Database file not found at $dbPath" -ForegroundColor Red
    Write-Host "Please run the Electron app at least once to create the database." -ForegroundColor Yellow
    exit 1
}

# SQL commands to fix the table
$sql = @"
DROP TABLE IF EXISTS credit_transactions;

CREATE TABLE credit_transactions (
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

CREATE INDEX IF NOT EXISTS idx_credit_tx_reseller ON credit_transactions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_date ON credit_transactions(date);
"@

# Save SQL to temp file
$sqlFile = Join-Path $env:TEMP "fix_credit_transactions.sql"
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "`nExecuting SQL fix..." -ForegroundColor Yellow
Write-Host $sql -ForegroundColor Gray

# Use node to execute sqlite commands
$nodeScript = @"
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('$($dbPath.Replace('\', '\\'))', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    const sql = require('fs').readFileSync('$($sqlFile.Replace('\', '\\'))', 'utf8');
    db.exec(sql, (err) => {
        if (err) {
            console.error('Error executing SQL:', err);
            process.exit(1);
        }
        console.log('✓ Table credit_transactions recreated successfully!');
        db.close();
    });
});
"@

$nodeScriptFile = Join-Path $env:TEMP "fix_db.js"
$nodeScript | Out-File -FilePath $nodeScriptFile -Encoding UTF8

Push-Location "d:\dowloads\cyberpunk-iptv-crm"
node $nodeScriptFile
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Database fixed successfully!" -ForegroundColor Green
    Write-Host "You can now restart the Electron app and try creating transactions." -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Failed to fix database" -ForegroundColor Red
}

# Cleanup
Remove-Item $sqlFile -ErrorAction SilentlyContinue
Remove-Item $nodeScriptFile -ErrorAction SilentlyContinue
