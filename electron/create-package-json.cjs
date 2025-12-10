const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist-electron');
const packageJsonPath = path.join(distPath, 'package.json');

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
}

fs.writeFileSync(packageJsonPath, JSON.stringify({ type: 'commonjs' }, null, 2));
console.log('Created dist-electron/package.json');
