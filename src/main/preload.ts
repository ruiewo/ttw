import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('api', {
    send: (channel: string, data: any) => {
        ipcRenderer.send(channel, data);
    },
    invoke: async (channel: string, data: any, func: (data: any) => void) => {
        const result = await ipcRenderer.invoke(channel, data);
        if (result?.error) throw result.error;

        if (func) {
            func(result);
        }
        return result;
    },
    on: (channel: string, func: (...data: any) => void) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
});
