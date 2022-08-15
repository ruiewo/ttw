import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('api', {
    closeWorkListWindow: () => {
        ipcRenderer.send('closeWorkListWindow');
    },
});
