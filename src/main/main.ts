import { AppConfig, GetSVGsCond, AppBoard, StartOrEnd, WorkConfig, WorkRecord, UserConfig } from '../common/models';
import { BrowserWindow, app, ipcMain, shell, screen, Menu, Tray, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import pie from 'puppeteer-in-electron';
import { autoUpdater } from 'electron-updater';

import { isDebugMode, appFolderPath } from './appManager';
import { AppDb } from './database';
import { log } from './logger';
import { ConfigManager } from './configManager';
import { AppSettingsManager } from './appSettingsManager';
import { jmotto } from './jmotto';
import { mdConverter } from './mdConverter';
import { holiday } from './holiday';
import { automation } from './automation';
import { tokenHandler } from './achievement/tokenHandler';
import { achievementApi } from './achievement/achievementApi';

let database: AppDb;
let configManager: ConfigManager;
let appSettingsManager: AppSettingsManager;

let mainWindow: BrowserWindow | null = null;
const mainWindowWidth = 700;
const mainWindowHeight = 500;
let workListWindow: BrowserWindow | null = null;

let tray: Tray | null = null; // must declare globally!!! Otherwise, the task tray icon will disappear BY garbage collection.

main();

async function main() {
    checkDualBoot();
    await pie.initialize(app); // MUST call this first!!! call this before app.ready.
    await initializeApp();
    activateCallback();
}

function checkDualBoot() {
    const dualBoot = app.requestSingleInstanceLock();
    if (!dualBoot) {
        app.quit();
    } else {
        app.on('second-instance', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    }
}

async function initializeApp() {
    log.debug(`---- TTW STARTED version ${app.getVersion()} ----`);

    database = await AppDb.create(appFolderPath);

    configManager = ConfigManager.initialize(appFolderPath);
    appSettingsManager = AppSettingsManager.initialize(appFolderPath);

    await automation.initialize();

    holiday.initialize(database);
    holiday.UpdateHolidaysIfNeeded();

    const notInitialized = (await database.getCategories()).length === 0;

    autoUpdater.checkForUpdates();
    autoUpdater.on('update-downloaded', info => {
        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            message: 'UPDATE',
            detail: 'A new version has been downloaded. Restart the application to apply the updates.',
        };

        dialog.showMessageBox(mainWindow!, dialogOpts).then(returnValue => {
            if (returnValue.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
    autoUpdater.on('error', err => {
        log.error('There was a problem updating the application!');
        log.error(err);
    });

    app.whenReady().then(() => {
        createMainWindow(configManager.config.windowSetting, notInitialized);
        createTaskTrayMenu();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            mainWindow = null;
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow(configManager.config.windowSetting);
        }
    });
}

function activateCallback() {
    ipcMain.handle('initializeWithWebApp', async (event, { email, password }: UserConfig.Achievement) => {
        log.info(`initializeWithWebApp started.`);
        try {
            const result = configManager.saveAchievementConfig({ email, password });

            const { categories, workProcessList } = await achievementApi.getSetupItems();

            await database.seed({ categories, workProcessList });

            app.relaunch();
            app.quit();

            log.info('initializeWithWebApp succeed.');
        } catch (error) {
            log.error('initializeWithWebApp failed.');
            return { error };
        }
    });

    ipcMain.handle(
        'startOrEndWork',
        async (event, { startOrEnd, usePunchIn, work }: { startOrEnd: StartOrEnd; usePunchIn: boolean; work: WorkConfig }) => {
            log.debug(`startOrEndWork started. args.startOrEnd = [${startOrEnd}]`);
            try {
                if (usePunchIn) {
                    if (configManager.config.jmotto.useJmotto) {
                        automation.punchInJmotto(startOrEnd);
                    }
                    if (configManager.config.freee.useFreee) {
                        automation.punchInFreee(startOrEnd);
                    }
                }

                if (startOrEnd === 'end') {
                    await database.insertWorkData(work);
                }

                const error = configManager.saveWork(work); // uploadより先にconfig保存し、アプリ側の処理は完結させる。

                uploadWorks(startOrEnd);

                return error;
            } catch (error) {
                log.error('startOrEndWork failed.');
                log.error(error);
            }
        }
    );

    let isUploading = false;
    async function uploadWorks(startOrEnd: StartOrEnd) {
        try {
            if (startOrEnd !== 'end') {
                return;
            }

            if (isUploading) {
                return;
            }

            const ttwNotUploadedRecords = await database.getNotUploadedWorkData();
            if (ttwNotUploadedRecords.length === 0) {
                return;
            }

            isUploading = true;

            const ids = await achievementApi.addWorkRecords(ttwNotUploadedRecords);

            await database.setUploaded(ids);
        } catch (error) {
            log.error(`upload works failed.`);
            log.error(error);
        } finally {
            isUploading = false;
        }
    }

    ipcMain.handle('punchIn', async (event, { target, startOrEnd }: { target: string; startOrEnd: StartOrEnd }) => {
        log.debug(`punchIn started. target = [${target}] startOrEnd = [${startOrEnd}]`);
        switch (target) {
            case 'punchInJmotto':
                automation.punchInJmotto(startOrEnd);
                break;
            case 'punchInFreee':
                automation.punchInFreee(startOrEnd);
                break;
        }
    });

    ipcMain.handle('getCategories', async () => {
        return await database.getCategories().catch(error => {
            log.error(error);
            return { error };
        });
    });

    ipcMain.handle('getWorkProcessList', async () => {
        return await database.getWorkProcessList().catch(error => {
            log.error(error);

            return { error };
        });
    });

    ipcMain.handle('getHolidays', async (event, args) => {
        return await database.getHolidays(args).catch(error => {
            log.error(error);
            return { error };
        });
    });

    ipcMain.handle('searchWorkRecords', async (event, { startDate, endDate }: { startDate: string; endDate: string }) => {
        return await achievementApi.searchWorkRecords({ startDate, endDate }).catch(error => {
            log.error(error);
            return { error };
        });
    });

    ipcMain.handle('saveWorks', async (event, { works }: { works: WorkRecord[] }) => {
        log.debug(`saveWorks: works count = [${works.length}]`);
        await database.saveWorks(works);
        mainWindow!.webContents.send('workChanged');
        return 'finished';
    });

    ipcMain.handle('deleteWorks', async (event, args) => {
        log.debug(`deleteWorks: ${args.ids}`);
        await database.deleteWorks(args.ids);
        mainWindow!.webContents.send('workChanged');
    });

    ipcMain.handle('getJmottoEvents', async () => {
        return await jmotto.getJmottoEvents().catch(error => {
            log.error(error);
            return { error };
        });
    });

    ipcMain.handle('getConfig', () => {
        return { config: configManager.config };
    });

    ipcMain.handle('saveConfig', (event, config: AppConfig) => {
        const isZoomChanged = configManager.config.windowSetting.zoomSlider != config.windowSetting.zoomSlider;
        const result = configManager.saveUserConfig(config);
        if (isZoomChanged) {
            setMainWindowSize(config.windowSetting.zoomSlider);
        }
        mainWindow?.setAlwaysOnTop(configManager.config.windowSetting.alwaysOnTop);
        return result;
    });

    ipcMain.handle('searchBoardList', async (event, { projectName }) => {
        return await achievementApi.searchBoardList(projectName).catch(error => {
            return { error };
        });
    });

    ipcMain.handle('getBoardList', async (event, { count }) => {
        return await database.getBoardList(count);
    });

    ipcMain.handle('saveBoard', async (event, board: AppBoard) => {
        return await database.saveBoard(board);
    });

    ipcMain.handle('getSVG', (event, { iconName, iconColor }: { iconName: string; iconColor: string }) => {
        const svg = createSvg(iconName, iconColor);
        return svg;
    });

    ipcMain.handle('getSVGs', (event, { iconName, iconColors }: GetSVGsCond) => {
        const svgs = iconColors.map(color => createSvg(iconName, color));
        return svgs;
    });

    ipcMain.handle('saveNotification', (event, { notification }) => {
        return configManager.saveNotification(notification);
    });

    ipcMain.handle('deleteNotification', (event, { id }) => {
        return configManager.deleteNotification(id);
    });

    ipcMain.handle('convertMdFile', (event, { filePath, docType, template, isEmbed }) => {
        return mdConverter.convert({ filePath, docType, template, isEmbed });
    });

    ipcMain.on('showWorkListWindow', async () => {
        log.debug('workListWindow started.');
        if (workListWindow !== null) {
            workListWindow.focus();
            log.debug('workListWindow already exists.');
            return;
        }

        return await createWorkListWindow().catch(error => {
            return { error };
        });
    });

    ipcMain.on('closeWorkListWindow', async () => {
        if (workListWindow == null) {
            log.debug('workListWindow not exists.');
            return;
        }

        workListWindow.close();
        log.debug('workListWindow closed.');
    });

    ipcMain.on('log', (event, { level, message }: { level: string; message: string }) => {
        // @ts-ignore
        log[level](message);
    });

    ipcMain.on('setWindowSize', (event, { zoom }: { zoom: number }) => {
        setMainWindowSize(zoom);
    });

    ipcMain.on('setClickThrough', (event, { isClickThrough }: { isClickThrough: boolean }) => {
        mainWindow!.setIgnoreMouseEvents(isClickThrough, { forward: true });
    });

    ipcMain.on('openLinkExternal', (event, url: string) => {
        shell.openExternal(url);
    });

    ipcMain.on('showItemInFolder', (event, { filePath }: { filePath: string }) => {
        shell.showItemInFolder(filePath);
    });

    ipcMain.on('windowMoving', (e, { mouseX, mouseY }: { mouseX: number; mouseY: number }) => {
        const { x, y } = screen.getCursorScreenPoint();
        const zoom = Number(configManager.config.windowSetting.zoomSlider || 100) / 100;
        mainWindow!.setPosition(Math.trunc(x - mouseX * zoom), Math.trunc(y - mouseY * zoom));
    });
}

function setMainWindowSize(zoomPercent: number) {
    if (mainWindow == null) {
        return;
    }

    const zoom = zoomPercent / 100; // %の整数部分が来るためfloatに戻す。
    const newWidth = Math.trunc(mainWindowWidth * zoom);
    const newHeight = Math.trunc(mainWindowHeight * zoom);

    //右下固定のためboundsを補正
    const bounds = mainWindow.getContentBounds();
    const posX = bounds.x - (newWidth - bounds.width);
    const posY = bounds.y - (newHeight - bounds.height);

    mainWindow.webContents.setZoomFactor(zoom);
    mainWindow.setContentBounds({
        x: posX,
        y: posY,
        width: newWidth,
        height: newHeight,
    });

    log.debug('window resized');
}

function createSvg(iconName: string, iconColor: string) {
    const svgPath = path.join(__dirname, `../../style/img/${iconName}.svg`);
    const svgString = fs.readFileSync(svgPath, 'utf-8');
    const cutKey = '<svg ';
    const preEncodeSVG = cutKey + svgString.split(cutKey)[1];

    // fillのカラーコードが6桁前提、3桁は色変更しない. example 'warning.svg'
    const regExp = new RegExp('fill="#[0-9a-fA-F]{6}"', 'gi');
    const replaced = preEncodeSVG.replace(regExp, `fill="${iconColor}"`);
    const encodedSVG = Buffer.from(replaced).toString('base64');
    return `url(data:image/svg+xml;base64,${encodedSVG})`;
}

function createTaskTrayMenu() {
    const trayIcon = path.join(__dirname, '../../style/img/ttw.ico');

    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '再配置',
            click: () => {
                mainWindow!.setPosition(0, 0);
            },
        },
        {
            label: '再起動',
            click: () => {
                app.relaunch();
                app.quit();
            },
        },
        {
            label: 'フォルダを開く',
            click: () => {
                shell.openPath(appFolderPath);
            },
        },
        { type: 'separator' },
        { label: `version ${app.getVersion()}` },
        { type: 'separator' },
        { label: '終了', role: 'quit' },
    ]);
    tray.setToolTip(app.name);
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow!.show();
    });
}

async function createMainWindow({ alwaysOnTop, zoomSlider }: { alwaysOnTop: boolean; zoomSlider: number }, notInitialized = false) {
    const zoom = zoomSlider || 100;

    const { x, y } = configManager.getBounds('mainWindow');

    const option = {
        width: (mainWindowWidth * zoom) / 100,
        height: (mainWindowHeight * zoom) / 100,
        x,
        y,
        useContentSize: true,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/preload.js',
            devTools: isDebugMode,
        },

        frame: false,
        transparent: true,
        skipTaskbar: !isDebugMode,
    };

    mainWindow = new BrowserWindow(option);
    mainWindow.setAlwaysOnTop(alwaysOnTop);

    mainWindow.on('close', function () {
        configManager.saveBounds('mainWindow', mainWindow!.getBounds());
        database.close();
        workListWindow?.close();
        automation.freeeWindow?.close();
        automation.jmottoWindow?.close();
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
        log.debug(`---- TTW END ----`);
    });

    mainWindow.webContents.on('will-navigate', (e, url) => {
        if (url.match(/^http/)) {
            e.preventDefault();
            shell.openExternal(url);
        }
    });

    automation.eventEmitter.on('error', args => mainWindow?.webContents.send('errorOccurred', args));

    const url = new URL(`file://${path.join(__dirname, '../../')}/view/index.html`);
    url.searchParams.append('isDebugMode', isDebugMode.toString());
    url.searchParams.append('notInitialized', notInitialized.toString());
    url.searchParams.append('zoom', zoom.toString());
    mainWindow.loadURL(url.toString());
    log.debug(url.searchParams);
}

async function createWorkListWindow() {
    log.debug('createWorkListWindow started.');

    if (isDebugMode) {
        // fixme
        // localhostのサイトを開く際の証明書関係のエラーを抑制
        // ERR_CERT_COMMON_NAME_INVALID
        app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
    }

    const { x, y, width, height } = configManager.getBounds('workListWindow');

    workListWindow = new BrowserWindow({
        width: width ?? 900,
        height: height ?? 800,
        x: x ?? 100,
        y: y ?? 100,
        useContentSize: true,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // sandbox: true,
            preload: __dirname + '/preloadForAchievementPage.js',
        },
        show: false,
        // parent: mainWindow,
        // modal: true,
        // frame: false,
    });

    workListWindow.on('close', () => {
        configManager.saveBounds('workListWindow', workListWindow!.getBounds());
    });

    workListWindow.on('closed', () => {
        workListWindow = null;
    });

    // todo! hanndle error when server cannot connect.
    // UnhandledPromiseRejectionWarning: Error: ERR_CONNECTION_REFUSED (-102) loading 'https://127.0.0.1:7031/login'
    await workListWindow.loadURL(appSettingsManager.loginUrl);

    const token = await tokenHandler.getToken();
    await workListWindow!.webContents.executeJavaScript(`localStorage.setItem("${appSettingsManager.storageKey}", "${token}");`, true);

    workListWindow.loadURL(`${appSettingsManager.hostUrl}/achievement/records`).then(x => {
        workListWindow!.show();
    });

    log.debug('createWorkListWindow finished.');
}
