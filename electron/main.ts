import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { promises as fs } from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'FlowCanvas - Elite Performer Edition',
    backgroundColor: '#0a0a0a',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('save-session', async (_event, sessionData: string) => {
  const userDataPath = app.getPath('userData');
  const sessionsDir = path.join(userDataPath, 'sessions');

  try {
    await fs.mkdir(sessionsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `session-${timestamp}.json`;
    const filepath = path.join(sessionsDir, filename);
    await fs.writeFile(filepath, sessionData, 'utf-8');
    return { success: true, filepath };
  } catch (error) {
    console.error('Error saving session:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-session', async (_event, filepath: string) => {
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    console.error('Error loading session:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('list-sessions', async () => {
  const userDataPath = app.getPath('userData');
  const sessionsDir = path.join(userDataPath, 'sessions');

  try {
    await fs.mkdir(sessionsDir, { recursive: true });
    const files = await fs.readdir(sessionsDir);
    const sessions = files
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(sessionsDir, f));
    return { success: true, sessions };
  } catch (error) {
    console.error('Error listing sessions:', error);
    return { success: false, error: String(error), sessions: [] };
  }
});

ipcMain.handle('export-session', async (_event, sessionData: string, filepath: string) => {
  try {
    await fs.writeFile(filepath, sessionData, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error exporting session:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('save-recording', async (_event, audioBlob: Buffer, sessionId: string) => {
  const userDataPath = app.getPath('userData');
  const recordingsDir = path.join(userDataPath, 'recordings');

  try {
    await fs.mkdir(recordingsDir, { recursive: true });
    const filename = `recording-${sessionId}.webm`;
    const filepath = path.join(recordingsDir, filename);
    await fs.writeFile(filepath, audioBlob);
    return { success: true, filepath };
  } catch (error) {
    console.error('Error saving recording:', error);
    return { success: false, error: String(error) };
  }
});
