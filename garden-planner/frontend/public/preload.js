const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    call: (endpoint, method, body) => {
      return ipcRenderer.invoke('api-call', { endpoint, method, body });
    }
  }
);