import { calendar } from './calendar.js';
import { notification, notificationManager } from './notification.js';
import { markdown } from './markdown.js';
import { twDialog } from './tw/twDialog/twDialog.js';
import { icons } from './icons.js';
import { log } from './logger.js';
import { appEvent } from './event.js';
import { configManager } from './configManager.js';
import { PageManager } from './page.js';
import { UserConfig } from '../common/models.js';
import { TwConfigDialog, TwConfigGroupData } from './tw/twConfigDialog/twConfigDialog.js';
import { WorkInfoPanel } from './workInfoPanel.js';
import { api, apiEvent } from './api.js';
import { enableWindowDrag } from './mouseEventManager.js';
import { isNullOrWhiteSpace, triggerEvent, DateEx } from './tw/twUtility/twUtility.js';

const menuButton = document.getElementById('menuButton')!;
const punchInButton = document.getElementById('punchInButton')!;
const startOrEndWorkButton = document.getElementById('startOrEndWorkButton')!;
const calendarButton = document.getElementById('calendarButton')!;
const notificationButton = document.getElementById('notificationButton')!;
const workListButton = document.getElementById('workListButton')!;
const markdownButton = document.getElementById('markdownButton')!;
const workInfo = document.getElementById('workInfo')!;

let configDialog: TwConfigDialog;

const root = document.querySelector(':root') as HTMLElement;

const workInfoPanel = new WorkInfoPanel();

initialize();

function showInitializeDialog() {
    return new Promise<UserConfig.Achievement>((resolve, reject) => {
        const html =
            `<dialog id="initializeDialog" class="boardEditorDialog" id="boardEditorDialog">` +
            `<form method="dialog">` +
            `<h1 class="boardEditorHeader">please input achievement web's password.</h1>` +
            `<ul>` +
            `<li>` +
            `<span class="boardEditorLabel">email</span>` +
            `<span class="separator">:</span>` +
            `<input type="text" class="boardEditorInput" spellcheck="false">` +
            `</li>` +
            `<li>` +
            `<span class="boardEditorLabel">password</span>` +
            `<span class="separator">:</span>` +
            `<input type="text" class="boardEditorInput" spellcheck="false">` +
            `</li>` +
            `</ul>` +
            `<button type="button" class="button boardEditorButton">Save</button>` +
            `</form>` +
            `</dialog>`;

        document.getElementById('container')!.insertAdjacentHTML('beforeend', html);

        const dialog = document.getElementById('initializeDialog')! as HTMLDialogElement;
        dialog.querySelector('button')!.onclick = () => {
            const inputs = dialog.querySelectorAll('input');
            const email = inputs[0].value;
            const password = inputs[1].value;

            if (isNullOrWhiteSpace(email) || isNullOrWhiteSpace(password)) {
                return;
            }

            resolve({ email, password });
            dialog.close();
        };

        dialog.showModal();
    });
}

async function initialize() {
    log.debug('mainWindow::initialize started.');

    const params = new URLSearchParams(location.search);
    const zoom = parseInt(params.get('zoom')!);
    api.setWindowSize(zoom);

    if (params.get('isDebugMode') === 'true') {
        console.log('mainWindow set debug mode.');
    }

    if (params.get('notInitialized') === 'true') {
        console.log('notInitialized yet.');
        const { email, password } = await showInitializeDialog();
        try {
            await api.initializeWithWebApp(email, password);
        } catch (error) {
            twDialog.error('initialize failed. reboot and try again.');
        }
        return;
    }

    configManager.loadConfig(config => {
        const work = config.work;

        workInfoPanel.setCurrentWork(work);

        if (work.isWorking) {
            punchInButton.innerText = '退勤';
            startOrEndWorkButton.innerText = 'End';
        } else {
            punchInButton.innerText = '出勤';
            startOrEndWorkButton.innerText = 'Start';
        }

        notificationManager.addNotifications(config.notifications);

        setMainColor(config.color.useDefaultMainColor, config.color.mainHueSlider);

        configManager.icon = icons.random;

        setIcon(configManager.icon, config.color.useDefaultIconColor, config.color.iconHueSlider);

        if (isNullOrWhiteSpace(config.freee.email)) {
            // triggerEvent('contextmenu', menuButton);
            // todo click user info group
            // document.getElementById('configUserInfo')!.click();
        }
    });

    enableWindowDrag(menuButton);

    const pageManager = new PageManager();
    pageManager.addPage('notification', notification);
    pageManager.addPage('calendar', calendar);
    pageManager.addPage('markdown', markdown);

    menuButton.onclick = async e => {
        const target = (e.target as HTMLElement).closest<HTMLElement>('.menuButton, .subButton, .workInfo');
        switch (target) {
            case workInfo:
                workInfoPanel.onClick(e);
                break;
            case punchInButton:
                startOrEndWork(true);
                break;
            case startOrEndWorkButton:
                startOrEndWork(false);
                break;
            case workListButton:
                api.showWorkListWindow();
                break;
            case calendarButton:
            case notificationButton:
            case markdownButton:
                pageManager.toggle(target.dataset.page!);
                break;
            case menuButton: {
                pageManager.hideAll();
                break;
            }
        }
    };

    menuButton.oncontextmenu = async e => {
        const target = (e.target as HTMLElement).closest<HTMLElement>('.subButtonWrapper, .menuButton, .workInfo')!;
        const area = target.dataset.area;
        switch (area) {
            case 'workInfo':
                workInfoPanel.onContextMenu(e);
                break;
            case 'subButton': {
                const buttons = [...target.querySelectorAll<HTMLElement>('.subButton')];
                toggleButtons(buttons);
                break;
            }
            case 'menuButton':
                if (configDialog == null) {
                    createConfigDialog();
                }

                configDialog.show();
                break;
        }
    };

    menuButton.onmouseup = e => {
        if (e.button !== 1) {
            return;
        }

        configManager.icon = icons.random;
        setIcon(configManager.icon, configManager.config.color.useDefaultIconColor, configManager.config.color.iconHueSlider);
    };

    apiEvent.workChanged(() => {
        triggerEvent(appEvent.workChanged, document.body);
    });

    apiEvent.errorOccurred(detail => {
        switch (detail.functionName) {
            case 'punchInFreee':
            case 'punchInJmotto':
                twDialog.warn(detail.message, [
                    { label: 'ok' },
                    {
                        label: 'retry',
                        onclick: () => {
                            api.punchIn(detail.functionName, detail.startOrEnd!);
                        },
                    },
                ]);
                break;
            default:
                twDialog.warn({ message: detail.message });
                break;
        }
    });

    apiEvent.updateDownloaded(() => {
        twDialog.warn(
            {
                header: 'Update',
                message: 'A new version has been downloaded.\nRestart the application to apply the updates.',
            },
            [{ label: 'Later' }, { label: 'Restart', onclick: () => api.updateAppVersion() }]
        );
    });

    log.debug('mainWindow::initialize finished.');
}

function toggleButtons(buttons: HTMLElement[]) {
    buttons.forEach(button => {
        button.classList.toggle('show');
        button.classList.toggle('hide');
    });
}

function startOrEndWork(usePunchIn: boolean) {
    log.debug(`startOrEndWork started. usePunchIn = [ ${usePunchIn} ]`);

    const config = configManager.config;

    if (usePunchIn) {
        if (config.freee.useFreee && (isNullOrWhiteSpace(config.freee.email) || isNullOrWhiteSpace(config.freee.password))) {
            twDialog.warn('Freee情報が登録されていません。');
            return;
        }

        if (
            config.jmotto.useJmotto &&
            (isNullOrWhiteSpace(config.jmotto.memberId) || isNullOrWhiteSpace(config.jmotto.userId) || isNullOrWhiteSpace(config.jmotto.password))
        ) {
            twDialog.warn('Jmotto情報が登録されていません。');
            return;
        }
    }

    const work = configManager.config.work;

    const { categoryId, workProcessDetailId, boardId, boardDetail, comment } = workInfoPanel.getCurrentInfo();
    work.categoryId = categoryId!;
    work.workProcessDetailId = workProcessDetailId!;
    work.boardId = boardId;
    work.boardDetail = boardDetail;
    work.comment = comment;

    switch (work.isWorking) {
        case false: {
            const workStartTime = new DateEx();
            work.isWorking = true;
            work.date = workStartTime.toDateString();
            work.workingHours = 0;
            work.startDateTime = workStartTime.toISOString();
            work.endDateTime = '';

            api.startWork({ usePunchIn, work });

            configManager.config.work = work;
            punchInButton.innerText = '退勤';
            startOrEndWorkButton.innerText = 'end';

            triggerEvent(appEvent.workChanged, document.body);
            break;
        }
        case true: {
            if (Number.isNaN(work.categoryId)) {
                twDialog.warn({ message: '分類を選択してください。' });
                log.debug('EndWork button pressed. But category was not selected.');
                return;
            }

            if (Number.isNaN(work.workProcessDetailId)) {
                twDialog.warn({ message: '詳細を選択してください。' });
                log.debug('EndWork button pressed. But work process was not selected.');
                return;
            }

            if (Number.isNaN(work.boardId)) {
                twDialog.warn({ message: '業務内容を選択してください。' });
                log.debug('EndWork button pressed. But board was not selected.');
                return;
            }

            const workStartTime = new DateEx(work.startDateTime);
            const workEndTime = new DateEx();
            const distance = workEndTime.getTime() - workStartTime.getTime();

            // 小数点1桁まで利用
            let workingHours = Math.floor(((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) * 10) / 10;
            if (workStartTime.getHours() < 12 && workEndTime.getHours() >= 13) {
                workingHours = workingHours - 1; // ToDo 昼休憩 Config化
            }

            work.isWorking = false;
            work.date = workStartTime.toDateString();
            work.workingHours = workingHours;
            work.startDateTime = workStartTime.toISOString();
            work.endDateTime = workEndTime.toISOString();

            api.endWork({ usePunchIn, work });

            punchInButton.innerText = '出勤';
            startOrEndWorkButton.innerText = 'Start';

            triggerEvent(appEvent.workChanged, document.body);
            break;
        }
    }

    log.debug('startOrEndWork finished.');
}

function createConfigDialog() {
    log.debug('createConfigDialog started.');

    configDialog = new TwConfigDialog();

    configDialog.createGroup('jmotto', 'Jmotto');
    configDialog.appendCheckbox('jmotto', 'useJmotto', 'use Jmotto');
    configDialog.appendTextInput('jmotto', 'userId', 'User ID', 'Jmotto');
    configDialog.appendTextInput('jmotto', 'memberId', 'Member ID', 'JM****');
    configDialog.appendTextInput('jmotto', 'password', 'Password', 'more than 8 letters');
    configDialog.appendTextInput('jmotto', 'icalPassword', 'API Password', 'Password for ical api.');

    configDialog.createGroup('freee', 'Freee');
    configDialog.appendCheckbox('freee', 'useFreee', 'use Freee');
    configDialog.appendTextInput('freee', 'email', 'Email', '**@**.**');
    configDialog.appendTextInput('freee', 'password', 'Password', 'more than 8 letters');

    configDialog.createGroup('achievement', 'Achievement');
    configDialog.appendTextInput('achievement', 'email', 'eMail');
    configDialog.appendTextInput('achievement', 'password', 'Password', 'more than 8 letters');

    configDialog.createGroup('windowSetting', 'Window Settings');
    configDialog.appendCheckbox('windowSetting', 'alwaysOnTop', 'always on top');
    configDialog.appendSlider('windowSetting', 'useDefaultWindowSize', 'zoomSlider', 'use default size (50% - 200%)', {
        min: 50,
        max: 200,
        step: 10,
    });

    configDialog.createGroup('color', 'Color');
    configDialog.appendSlider('color', 'useDefaultMainColor', 'mainHueSlider', 'use default main color', {
        min: 0,
        max: 360,
        step: 1,
        useColorSlider: true,
    });
    configDialog.appendSlider('color', 'useDefaultIconColor', 'iconHueSlider', 'use default icon color', {
        min: 0,
        max: 360,
        step: 1,
        useColorSlider: true,
    });

    configDialog.createGroup('calendar', 'Calender');
    configDialog.appendCheckbox('calendar', 'useDefaultIcon', 'use default icon');
    configDialog.appendNumberInput('calendar', 'smile', 'smile', 8);
    configDialog.appendNumberInput('calendar', 'uncomfortable', 'uncomfortable', 8.1);
    configDialog.appendNumberInput('calendar', 'frustrated', 'frustrated', 8.3);
    configDialog.appendNumberInput('calendar', 'mad', 'mad', 8.5);
    configDialog.appendNumberInput('calendar', 'skull', 'skull', 9);

    configDialog.createGroup('workInfoPanel', 'WorkInfoPanel');
    configDialog.appendNumberInput('workInfoPanel', 'maxBoardListCount', 'List Count', 10);

    configDialog.appendButton('', 'saveButton', 'save', 'bouncy');

    configDialog.setData(configManager.config as unknown as { [key: string]: TwConfigGroupData });

    enableConfigEvent();

    document.getElementById('container')!.appendChild(configDialog);
}

function enableConfigEvent() {
    configDialog.get('windowSetting', 'useDefaultWindowSize')!.onchange = e => {
        if ((e.target as HTMLInputElement).checked) {
            configDialog.set('windowSetting', 'zoomSlider', 100);
        }
    };

    configDialog.get('windowSetting', 'zoomSlider')!.onchange = e => {
        configDialog.get('windowSetting', 'useDefaultWindowSize')!.checked = (e.target as HTMLInputElement).value === '100';
    };

    configDialog.get('color', 'useDefaultMainColor')!.onchange = e => {
        setMainColor((e.target as HTMLInputElement).checked, Number.parseFloat(configDialog.get('color', 'mainHueSlider')!.value));
    };

    configDialog.get('color', 'mainHueSlider')!.onchange = e => {
        configDialog.get('color', 'useDefaultMainColor')!.checked = false;
        setMainColor(false, Number.parseFloat((e.target as HTMLInputElement).value));
    };

    configDialog.get('color', 'useDefaultIconColor')!.onchange = e => {
        setIcon(configManager.icon, (e.target as HTMLInputElement).checked, Number.parseFloat(configDialog.get('color', 'iconHueSlider')!.value));
    };

    configDialog.get('color', 'iconHueSlider')!.onchange = e => {
        configDialog.get('color', 'useDefaultIconColor')!.checked = false;
        setIcon(configManager.icon, false, Number.parseFloat((e.target as HTMLInputElement).value));
    };

    configDialog.get('', 'saveButton')!.onclick = async () => {
        const newConfig = configDialog.getData();

        configManager.saveConfig(newConfig as UserConfig);
        configDialog.setData(configManager.config as unknown as { [key: string]: TwConfigGroupData });
        workInfoPanel.createBoardListItems();
    };

    configDialog.setOnCancel(() => {
        setMainColor(configManager.config.color.useDefaultMainColor, configManager.config.color.mainHueSlider);
        setIcon(configManager.icon, configManager.config.color.useDefaultIconColor, configManager.config.color.iconHueSlider);
    });
}

function setMainColor(useDefaultColor: boolean, hue: number) {
    if (useDefaultColor) {
        root.style.setProperty('--color-UI-main', 'hsl(190, 100%, 49%, 1)');
        return;
    }

    root.style.setProperty('--color-UI-main', getHslColor(hue));
}

async function setIcon(icon: string, useDefaultColor: boolean, hue: number) {
    if (useDefaultColor) {
        menuButton.style.backgroundImage = `url(../style/img/${icon}.svg)`;
        return;
    }

    const svg = await api.getSVG({ iconName: icon, iconColor: getHslColor(hue) });
    menuButton.style.backgroundImage = svg;
}

function getHslColor(hue: number) {
    let Lightness = 59;
    if (217 < hue && hue < 280) {
        Lightness = 79;
    } else if (210 < hue && hue < 300) {
        Lightness = 75;
    } else if (205 < hue && hue < 315) {
        Lightness = 69;
    } else if (200 < hue && hue < 335) {
        Lightness = 64;
    }

    return `hsl(${hue}, 100%, ${Lightness}%)`;
}
