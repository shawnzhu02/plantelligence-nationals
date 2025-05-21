const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

// Global references to prevent garbage collection
let mainWindow;
let backendProcess;
let backendUrl = 'http://localhost:5000';

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'favicon.ico'),
    show: false // Don't show until content is loaded
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) {
      // On Windows, we need to force kill the process
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${backendProcess.pid} /f /t`);
      } else {
        backendProcess.kill();
      }
    }
  });

  // Start Flask backend
  startBackend();
}

function startBackend() {
  console.log('Starting Flask backend...');

  // Path to the Python executable and script
  let pythonPath;
  let scriptPath;

  if (isDev) {
    // Development paths
    pythonPath = path.join(process.cwd(), '..', 'backend', 'venv', 'Scripts', 'python.exe');
    scriptPath = path.join(process.cwd(), '..', 'backend', 'app.py');
  } else {
    // Production paths - assuming backend is packaged in resources folder
    pythonPath = path.join(process.resourcesPath, 'backend', 'venv', 'Scripts', 'python.exe');
    scriptPath = path.join(process.resourcesPath, 'backend', 'app.py');
  }

  console.log(`Python path: ${pythonPath}`);
  console.log(`Script path: ${scriptPath}`);

  // Spawn the backend process
  try {
    backendProcess = spawn(pythonPath, [scriptPath]);

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend error: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
  }
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle backend API calls
ipcMain.handle('api-call', async (event, { endpoint, method, body }) => {
  try {
    const response = await fetch(`${backendUrl}/${endpoint}`, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return { error: error.message };
  }
});