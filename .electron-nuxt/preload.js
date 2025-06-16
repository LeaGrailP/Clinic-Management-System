const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  insertTransaction: (data) => ipcRenderer.invoke('insert-transaction', data),
  getTransactions: () => ipcRenderer.invoke('get-transactions')
});
