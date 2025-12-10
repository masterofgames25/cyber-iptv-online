import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { initializeDatabase, getDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { setupIpcHandlers } from './ipc/handlers';

// Performance improvements
try {
    app.commandLine.appendSwitch('ignore-gpu-blacklist');
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
} catch { }

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: true, // Native frame for better resizing support
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'), // Adjusted path for compiled output
            sandbox: false
        },
        icon: path.join(__dirname, '../public/icon.png') // Adjust path if needed
    });

    // Load the app
    if (!app.isPackaged) {
        const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5175';
        mainWindow.loadURL(devUrl);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.whenReady().then(async () => {
    try {
        await initializeDatabase();
        const db = getDatabase();
        await runMigrations(db);
        setupIpcHandlers();

        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } catch (error) {
        console.error('Failed to initialize app:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
