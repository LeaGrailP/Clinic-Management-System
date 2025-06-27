// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  addProduct: (products) => ipcRenderer.invoke('add-products', products),
  getProducts: () => ipcRenderer.invoke('get-products'),
  insertTransaction: (data) => ipcRenderer.invoke('insert-transaction', data),
  getTransactions: () => ipcRenderer.invoke('get-transactions')
})
