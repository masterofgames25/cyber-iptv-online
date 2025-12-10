import { app, BrowserWindow } from 'electron';
import path from 'path';

console.log('Electron iniciado com sucesso!');
console.log('Caminho do app:', app.getAppPath());

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadURL('data:text/html,<h1>Electron Test</h1>');
  console.log('Janela criada com sucesso!');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('Script de teste carregado');