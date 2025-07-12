const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('auth', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  register: (data) => ipcRenderer.invoke('auth:register', data)
})
