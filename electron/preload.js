const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld('electronAPI', {
  checkAdmin: () => ipcRenderer.invoke('check-admin'),
  register: (data) => ipcRenderer.invoke('auth:register', data),
  login: (data) => ipcRenderer.invoke('login', data)
});

contextBridge.exposeInMainWorld('patientAPI', {
  get: () => ipcRenderer.invoke('get-patients'),
  add: (data) => ipcRenderer.invoke('add-patient', data),
  update: (data) => ipcRenderer.invoke('update-patient', data),
  delete: (id) => ipcRenderer.invoke('delete-patient', id),
});

contextBridge.exposeInMainWorld('productAPI', {
  get: () => ipcRenderer.invoke('get-products'),
  add: (data) => ipcRenderer.invoke('add-product', data),
  update: (data) => ipcRenderer.invoke('update-product', data),
  delete: (id) => ipcRenderer.invoke('delete-product', id),
});