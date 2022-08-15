import { ElectronWindow } from './ElectronWindow';
declare let window: ElectronWindow;

export const log = {
    debug: (message: string) => {
        window.api.send('log', { level: 'debug', message });
    },

    warn: (message: string) => {
        window.api.send('log', { level: 'warn', message });
    },

    error: (message: string) => {
        window.api.send('log', { level: 'error', message });
    },
};
