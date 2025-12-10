const { app } = require('electron');
const path = require('path');

app.whenReady().then(() => {
    const docs = app.getPath('documents');
    console.log('DOCUMENTS_PATH:', docs);
    console.log('EXPECTED_DB_PATH:', path.join(docs, 'CyberpunkIPTV', 'cyberpunk-iptv.db'));
    app.quit();
});
