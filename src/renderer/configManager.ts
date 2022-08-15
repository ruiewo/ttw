import { AppConfig, UserConfig } from '../common/models';
import { api } from './api.js';
import { appEvent } from './event.js';
import { triggerEvent } from './tw/twUtility/twUtility.js';

let config: AppConfig;
let icon: string;

export const configManager = {
    loadConfig(callback: (config: AppConfig) => void) {
        api.getConfig(_config => {
            config = _config;
            callback(_config);
        });
    },

    async saveConfig(newConfig: UserConfig) {
        Object.assign(config, newConfig);
        await api.saveConfig(config);
        triggerEvent(appEvent.configChanged, document.body);
    },

    get config(): AppConfig {
        return config;
    },

    get icon(): string {
        return icon;
    },

    set icon(_icon: string) {
        if (icon !== _icon) {
            icon = _icon;
            triggerEvent(appEvent.iconChanged, document.body);
        }
    },
};
