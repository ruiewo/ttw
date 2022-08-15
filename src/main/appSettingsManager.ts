import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger';

const appSettingsFileName = 'appSettings.json';

type AppSettings = {
    hostUrl: string;
    apiUrl: string;
    loginUrl: string;
    storageKey: string;
    clientId: string;
    clientSecret: string;

    // this is unique for each jmotto user.
    jmottoServerUrl: string;
};

const defaultAppSettings: AppSettings = {
    hostUrl: 'https://127.0.0.1:7031',
    apiUrl: 'https://127.0.0.1:7031/api',
    loginUrl: 'https://127.0.0.1:7031/login',
    storageKey: 'storageKey',
    clientId: 'clientId',
    clientSecret: 'clientSecret',
    jmottoServerUrl: 'http://gws00.j-motto.co.jp/',
};

let appSettingsManager: AppSettingsManager;

export class AppSettingsManager {
    private appSettingsFilePath: string;
    public appSettings: AppSettings;

    public static initialize(folderPath: string) {
        appSettingsManager = new AppSettingsManager(folderPath);

        return appSettingsManager;
    }

    public static getInstance() {
        if (appSettingsManager == null) {
            throw new Error('AppSettingsManager is not initialized yet.');
        }

        return appSettingsManager;
    }

    private constructor(folderPath: string) {
        this.appSettingsFilePath = path.join(folderPath, appSettingsFileName);
        this.appSettings = loadAppSettings(this.appSettingsFilePath);
    }

    get hostUrl() {
        return this.appSettings.hostUrl;
    }
    get apiUrl() {
        return this.appSettings.apiUrl;
    }
    get loginUrl() {
        return this.appSettings.loginUrl;
    }
    get storageKey() {
        return this.appSettings.storageKey;
    }
    get clientId() {
        return this.appSettings.clientId;
    }
    get clientSecret() {
        return this.appSettings.clientSecret;
    }

    get jmottoServerUrl() {
        return this.appSettings.jmottoServerUrl;
    }
}

function loadAppSettings(filePath: string) {
    try {
        if (fs.existsSync(filePath)) {
            const text = fs.readFileSync(filePath, 'utf-8');
            const config = JSON.parse(text) as AppSettings;

            return config;
        } else {
            throw new Error('appSettings file does not exist.');
        }
    } catch (error) {
        log.warn(`load appSettings file failed. appSettings file path = [ ${filePath} ]`);
        log.warn(error);
        return defaultAppSettings;
    }
}
