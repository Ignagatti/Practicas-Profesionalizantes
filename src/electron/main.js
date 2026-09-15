const { app, BrowserWindow } = require('electron');
const path = require('path');

// Silenciar advertencias de consola no deseadas
process.removeAllListeners('warning');

// Cargar backend Node.js
require(path.join(__dirname, '../backend/server.js'));

let mainWindow;

async function waitForBackend(url = 'http://localhost:4000/api/health', maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

async function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(app.getAppPath(), 'assets/logo-acuaber.ico')
    : path.join(__dirname, '../../assets/logo-acuaber.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Sistema de Gestión Administrativa - Fábrica de Sillas y Sillones",
    icon: iconPath,
    autoHideMenuBar: true,
    show: false, // Ocultar mientras se sincroniza el backend para una experiencia fluida
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = Boolean(process.env.NODE_ENV === 'development' && !app.isPackaged);

  // Esperar a que el backend local responda antes de montar la vista
  await waitForBackend();

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist/index.html');
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.show();

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
