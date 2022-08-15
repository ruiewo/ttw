export interface ElectronWindow extends Window {
    api: {
        send: (channel: string, data?: any) => void;
        invoke: (channel: string, data?: any, func?: (data: any) => void) => Promise<any>;
        on: (channel: string, func: (data: any) => void) => void;
    };
}
