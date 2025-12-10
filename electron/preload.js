console.log("PRELOAD LOADED");


const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  printReceipt: (html) => ipcRenderer.invoke('print-receipt', html),
})

contextBridge.exposeInMainWorld('electronAPI', {
  checkAdmin: () => ipcRenderer.invoke('checkAdmin'),
  register: (data) => ipcRenderer.invoke('auth:register', data),
  login: (data) => ipcRenderer.invoke('login', data),
  updateName: (data) => ipcRenderer.invoke('user:updateName', data),
  updateUserName: (data) => ipcRenderer.invoke('user:updateName', data),
  resetPassword: (data) => ipcRenderer.invoke("reset-password", data),
  createAdmin: (data) => ipcRenderer.invoke("createAdmin", data),
});



contextBridge.exposeInMainWorld('patientAPI', {
  get: () => ipcRenderer.invoke('get-patients'),
  add: (data) => ipcRenderer.invoke('add-patient', data),
  update: (data) => ipcRenderer.invoke('update-patient', data),
  delete: (id) => ipcRenderer.invoke('delete-patient', id),
  searchPatients: (query) => ipcRenderer.invoke('search-patients', query),
});

contextBridge.exposeInMainWorld('productAPI', {
  get: () => ipcRenderer.invoke('get-products'),
  add: (data) => ipcRenderer.invoke('add-product', data),
  update: (data) => ipcRenderer.invoke('update-product', data),
  delete: (id) => ipcRenderer.invoke('delete-product', id)
})