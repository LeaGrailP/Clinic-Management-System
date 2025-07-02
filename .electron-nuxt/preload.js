// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, users) => ipcRenderer.invoke(channel, users),
})

