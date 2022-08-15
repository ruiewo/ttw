import * as fs from 'fs';
import * as path from 'path';
import { log } from './logger';
import { AppConfig, AppNotification, AppWindow, BoundsConfig, UserConfig, WorkConfig } from '../common/models';

const defaultConfig: AppConfig = {
    jmotto: {
        useJmotto: false,
        memberId: '',
        userId: '',
        password: '',
        icalPassword: '',
    },
    freee: {
        useFreee: false,
        email: '',
        password: '',
    },
    achievement: {
        email: '',
        password: '',
    },
    calendar: {
        useDefaultIcon: true,
        smile: 8,
        uncomfortable: 8.1,
        frustrated: 8.3,
        mad: 8.5,
        skull: 9,
    },
    work: {
        isWorking: false,
        id: null,
        date: '',
        workingHours: 0,
        categoryId: 1,
        workProcessDetailId: 1,
        boardId: null,
        boardDetail: '',
        comment: '',
        startDateTime: '',
        endDateTime: '',
    },
    workComments: ['社内会議', '顧客会議', '差込依頼', '調査依頼', '不具合'],
    notifications: [
        {
            id: 1,
            title: '朝礼',
            message: '10時になりました',
            time: '10:00',
            link: '',
        },
        {
            id: 2,
            title: 'lunch time',
            message: '12時になりました',
            time: '12:00',
            link: '',
        },
        {
            id: 3,
            title: '夕礼',
            message: '17時45分になりました',
            time: '17:45',
            link: '',
        },
    ],
    windowSetting: {
        alwaysOnTop: false,
        useDefaultWindowSize: true,
        zoomSlider: 100,
    },
    color: {
        useDefaultMainColor: true,
        mainHueSlider: 158,
        useDefaultIconColor: false,
        iconHueSlider: 360,
    },
    bounds: {
        mainWindow: { x: 100, y: 100 },
        workListWindow: { x: 100, y: 100 },
        jmottoWindow: { x: 100, y: 100 },
        freeeWindow: { x: 100, y: 100 },
    },
    workInfoPanel: {
        maxBoardListCount: 10,
    },
};

const configFileName = 'config.json';

let configManager: ConfigManager;

export class ConfigManager {
    private configFilePath: string;
    public config: AppConfig;

    public static initialize(folderPath: string) {
        configManager = new ConfigManager(folderPath);
        return configManager;
    }

    public static getInstance() {
        if (configManager == null) {
            throw new Error('ConfigManger is not initialized yet.');
        }

        return configManager;
    }

    private constructor(folderPath: string) {
        this.configFilePath = path.join(folderPath, configFileName);
        this.config = loadConfig(this.configFilePath);
    }

    saveAchievementConfig({ email, password }: UserConfig.Achievement) {
        this.config.achievement.email = email;
        this.config.achievement.password = password;
        return saveConfig(this.config, this.configFilePath);
    }

    saveUserConfig({
        jmotto,
        freee,
        achievement,
        windowSetting,
        color,
        calendar,
        workInfoPanel,
    }: {
        jmotto: UserConfig.Jmotto;
        freee: UserConfig.Freee;
        achievement: UserConfig.Achievement;
        windowSetting: UserConfig.WindowSetting;
        color: UserConfig.Color;
        calendar: UserConfig.Calendar;
        workInfoPanel: UserConfig.WorkInfoPanel;
    }) {
        this.config.jmotto = jmotto;
        this.config.freee = freee;
        this.config.achievement = achievement;
        this.config.windowSetting = windowSetting;
        this.config.color = color;
        this.config.calendar = calendar;
        this.config.workInfoPanel = workInfoPanel;
        return saveConfig(this.config, this.configFilePath);
    }

    saveWork(work: WorkConfig) {
        this.config.work = work;
        return saveConfig(this.config, this.configFilePath);
    }

    getBounds(window: AppWindow) {
        let targetBounds: BoundsConfig.Bounds | null = null;

        switch (window) {
            case 'mainWindow':
                targetBounds = this.config.bounds?.mainWindow;
                break;
            case 'workListWindow':
                targetBounds = this.config.bounds?.workListWindow;
                break;
            case 'jmottoWindow':
                targetBounds = this.config.bounds?.jmottoWindow;
                break;
            case 'freeeWindow':
                targetBounds = this.config.bounds?.freeeWindow;
                break;
        }

        return targetBounds != null ? targetBounds : { x: 100, y: 100 };
    }

    saveBounds(window: AppWindow, bounds: BoundsConfig.Bounds) {
        switch (window) {
            case 'mainWindow':
                this.config.bounds.mainWindow = bounds;
                break;
            case 'workListWindow':
                this.config.bounds.workListWindow = bounds;
                break;
            case 'jmottoWindow':
                this.config.bounds.jmottoWindow = bounds;
                break;
            case 'freeeWindow':
                this.config.bounds.freeeWindow = bounds;
                break;
        }

        return saveConfig(this.config, this.configFilePath);
    }

    saveNotification(notification: AppNotification) {
        if (notification.id == null) {
            // add
            const newId = Math.max(...this.config.notifications.map(notification => notification.id)) + 1;
            notification.id = newId;
            this.config.notifications.push(notification);
        } else {
            // update
            const targetNotification = this.config.notifications.find(x => x.id === notification.id)!;
            targetNotification.time = notification.time;
            targetNotification.title = notification.title;
            targetNotification.message = notification.message;
            targetNotification.link = notification.link;
        }

        saveConfig(this.config, this.configFilePath);

        return notification;
    }

    deleteNotification(id: number) {
        const index = this.config.notifications.findIndex(x => x.id === id);
        if (index === -1) {
            return;
        }

        this.config.notifications.splice(index, 1);
        return saveConfig(this.config, this.configFilePath);
    }

    get defaultConfig() {
        return defaultConfig;
    }
}

function loadConfig(configFilePath: string) {
    try {
        if (fs.existsSync(configFilePath)) {
            const text = fs.readFileSync(configFilePath, 'utf-8');
            const config = JSON.parse(text) as AppConfig;

            return config;
        } else {
            throw new Error('config file does not exist.');
        }
    } catch (error) {
        log.warn(`load config file failed. config file path = [ ${configFilePath} ]`);
        log.warn(error);
        return defaultConfig;
    }
}

function saveConfig(config: AppConfig, configFilePath: string) {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4), 'utf8');
        log.debug('config saved.');
    } catch (error) {
        log.error('saveConfig failed.');
        log.error(error);
        return { error };
    }
}
