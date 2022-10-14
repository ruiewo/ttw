import { Page } from './page.js';
import { api } from './api.js';
import { AppNotification, Schedule } from '../common/models';
import { appEvent } from './event.js';
import { configManager } from './configManager.js';
import { twDialog } from './tw/twDialog/twDialog.js';
import { appSettings } from './appSettings.js';
import { isNullOrWhiteSpace, DateEx, triggerEvent, sleep } from './tw/twUtility/twUtility.js';

class NotificationPage {
    private notifyEditor: HTMLElement;
    private notifyEditorTime: HTMLInputElement;
    private notifyEditorTitle: HTMLInputElement;
    private notifyEditorMessage: HTMLInputElement;
    private notifyEditorLink: HTMLInputElement;

    private container: HTMLElement;

    constructor(schedules: Schedule[]) {
        const notificationPage = document.getElementById('notificationPage')!;
        notificationPage.innerHTML = '';

        // create settingArea
        this.notifyEditor = document.createElement('div');
        this.notifyEditor.classList.add('pageTopArea');
        this.notifyEditor.classList.add('notifyEditor');
        this.notifyEditor.id = 'notifyEditor';

        let ul = `<ul>`;
        const items = [
            { id: 'notifyEditorTime', label: 'time' },
            { id: 'notifyEditorTitle', label: 'title' },
            { id: 'notifyEditorMessage', label: 'message' },
            { id: 'notifyEditorLink', label: 'link' },
        ];
        for (const { id, label } of items) {
            ul +=
                `<li>` +
                `<span class="pageTopHeader">${label}</span>` +
                `<span class="separator">:</span>` +
                `<input id="${id}" type="text" class="pageTopTextBox" spellcheck="false">` +
                `</li>`;
        }
        ul += `</ul>`;

        let buttons =
            `<div class="notifyEditorButtons">` +
            `<button id="notifyEditorDeleteButton" class="notifyEditorButton">Delete</button>` +
            `<button id="notifyEditorSaveButton" class="notifyEditorButton">Save</button>` +
            `<button id="notifyEditorNewButton" class="notifyEditorButton">New</button>` +
            `</div>`;

        this.notifyEditor.innerHTML = ul + buttons;

        notificationPage.appendChild(this.notifyEditor);
        this.notifyEditorTime = document.getElementById('notifyEditorTime')! as HTMLInputElement;
        this.notifyEditorTitle = document.getElementById('notifyEditorTitle')! as HTMLInputElement;
        this.notifyEditorMessage = document.getElementById('notifyEditorMessage')! as HTMLInputElement;
        this.notifyEditorLink = document.getElementById('notifyEditorLink')! as HTMLInputElement;

        // create container
        this.container = document.createElement('div');
        this.container.classList.add('pageMainArea');
        this.container.classList.add('notificationContainer');
        this.container.id = 'notificationContainer';

        let notifyDomHtml = ``;
        for (const schedule of schedules) {
            notifyDomHtml += this.createNotifyDom(schedule);
        }
        this.container.insertAdjacentHTML('beforeend', notifyDomHtml);

        notificationPage.appendChild(this.container);

        this.activateCallback();
    }

    activateCallback() {
        document.getElementById('notifyEditorDeleteButton')!.onclick = async () => {
            const idStr = this.notifyEditorTime.dataset.id!;
            if (isNullOrWhiteSpace(idStr)) {
                return;
            }

            const id = parseInt(idStr);
            const succeed = await api.deleteNotification(id);
            if (succeed) {
                notificationManager.deleteNotification(id);
            }
        };

        document.getElementById('notifyEditorSaveButton')!.onclick = async () => {
            const idStr = this.notifyEditorTime.dataset.id!;
            const id = parseInt(idStr);

            const notification = {
                id,
                time: this.notifyEditorTime.value,
                title: this.notifyEditorTitle.value,
                message: this.notifyEditorMessage.value,
                link: this.notifyEditorLink.value,
            };

            const updatedNotification = await api.saveNotification(notification);
            if (updatedNotification) {
                notificationManager.updateNotification(updatedNotification);
            }
        };

        document.getElementById('notifyEditorNewButton')!.onclick = async () => {
            const notification = {
                id: null,
                time: this.notifyEditorTime.value,
                title: this.notifyEditorTitle.value,
                message: this.notifyEditorMessage.value,
                link: this.notifyEditorLink.value,
            };

            const updatedNotification = await api.saveNotification(notification);
            if (updatedNotification) {
                notificationManager.addNotifications([updatedNotification]);
            }
        };

        // Show Notification Editor
        this.container.onclick = e => {
            const target = (e.target as HTMLElement).closest<HTMLElement>('.notification');
            if (!target) {
                return;
            }

            const id = Number(target.dataset.id);
            const notification = notificationManager.notifications.find(x => x.id === id);
            if (notification == null) {
                twDialog.warn('Notification not found.');
                return;
            }

            this.notifyEditorTime.dataset.id = notification.id?.toString();
            this.notifyEditorTime.value = notification.time || '';
            this.notifyEditorTitle.value = notification.title || '';
            this.notifyEditorMessage.value = notification.message || '';
            this.notifyEditorLink.value = notification.link || '';

            this.notifyEditor.classList.add('--active');
        };
    }

    isActive() {
        return this.notifyEditor.classList.contains('--active') || this.container.classList.contains('--active');
    }

    toggle() {
        this.notifyEditor.classList.remove('--active');
        this.container.classList.toggle('--active');
    }

    hide() {
        this.notifyEditor.classList.remove('--active');
        this.container.classList.remove('--active');
    }

    private createNotifyDom(schedule: Schedule) {
        let className = '';
        let icon = '»';
        let id = '';
        switch (schedule.type) {
            case 'act':
                className = '';
                icon = '»';
                id = '';
                break;
            case 'notify':
                className = 'notification';
                icon = '♻';
                id = schedule.id!.toString();
                break;
            case 'event':
                className = 'event';
                icon = '✒';
                // icon = 'ℹ';
                id = '';
                break;
            default:
                return '';
        }

        return `<p class="schedule ${className}" data-id="${id}">` + `${schedule.time} ${icon} ${schedule.title}` + `</p>`;
    }

    public static async create() {
        const today = new DateEx().toDateString();

        const works = await api.searchWorkRecords(today, today);
        const workActs: Schedule[] = works.flatMap(work => {
            const projectName = appSettings.getProjectName(work.boardDetail);

            //実績管理画面からコピーするとstartDatetimeに値は入らない
            if (work.startDateTime) {
                return [
                    { type: 'act', time: new DateEx(work.startDateTime).toTimeString(), title: `${projectName} start` },
                    { type: 'act', time: new DateEx(work.endDateTime).toTimeString(), title: `${projectName} end` },
                ];
            } else {
                return [
                    { type: 'act', time: '00:00', title: `${projectName} start` },
                    { type: 'act', time: '00:00', title: `${projectName} end` },
                ];
            }
        });

        const jmottoEvents = await api.getJmottoEvents();

        const notifications: Schedule[] = notificationManager.notifications
            .filter(x => x.id != -1) // todo refactor this. need to remove jmotto notify events.
            .map(({ time, title, id }) => {
                return { type: 'notify', time, title, id };
            });

        const allSchedules = [...workActs, ...jmottoEvents, ...notifications];

        const currentWork = configManager.config.work;
        if (currentWork.isWorking) {
            const currentWorkSchedule: Schedule = {
                type: 'act',
                time: new DateEx(currentWork.startDateTime).toTimeString(),
                title: `${appSettings.getProjectName(currentWork.boardDetail)} start`,
            };

            allSchedules.push(currentWorkSchedule);
        }

        allSchedules.sort((a, b) => {
            if (a.time < b.time) return -1;
            if (a.time > b.time) return 1;
            return 0;
        });

        return new NotificationPage(allSchedules);
    }
}

function initialize() {
    async function reloadNotificationPage() {
        if (notificationPage === null) {
            return;
        }

        const isActive = notificationPage.isActive();
        notificationPage = await NotificationPage.create();
        if (isActive) {
            notificationPage.toggle();
        }
    }

    document.body.addEventListener(appEvent.notificationChanged, async () => {
        await reloadNotificationPage();
    });
    document.body.addEventListener(appEvent.workChanged, async () => {
        await reloadNotificationPage();
    });
}

initialize();

let notificationPage: NotificationPage | null = null;

type notificationTimer = { notificationId: number; timerId: number };

export const notificationManager = (() => {
    const notifications: AppNotification[] = [];
    const notificationTimers: notificationTimer[] = [];

    function add(_notifications: AppNotification[]) {
        notifications.push(..._notifications);

        for (const notification of _notifications) {
            const target = new Date();
            target.setHours(Number.parseInt(notification.time.split(':')[0]));
            target.setMinutes(Number.parseInt(notification.time.split(':')[1]));
            const timeDelay = target.getTime() - Date.now();

            if (timeDelay <= 0) {
                continue;
            }

            const timer = window.setTimeout(() => {
                const toast = new Notification(notification.title, {
                    body: notification.message,
                    icon: '../style/img/ttw.png',
                });

                if (!isNullOrWhiteSpace(notification.link)) {
                    toast.onclick = () => {
                        location.href = notification.link!;
                    };
                }
            }, timeDelay);

            notificationTimers.push({ notificationId: notification.id, timerId: timer });
        }
    }

    function remove(id: number) {
        const index = notifications.findIndex(x => x.id === id);
        notifications.splice(index, 1);

        const timerIndex = notificationTimers.findIndex(x => x.notificationId === id);
        clearTimeout(notificationTimers[timerIndex].timerId);
        notificationTimers.splice(timerIndex, 1);
    }

    function addNotifications(notifications: AppNotification[]) {
        add(notifications);
        triggerEvent(appEvent.notificationChanged, document.body);
    }

    function deleteNotification(id: number) {
        remove(id);
        triggerEvent(appEvent.notificationChanged, document.body);
    }

    function updateNotification(notification: AppNotification) {
        remove(notification.id!);
        add([notification]);
        triggerEvent(appEvent.notificationChanged, document.body);
    }

    return {
        addNotifications,
        deleteNotification,
        updateNotification,

        get notifications() {
            return notifications;
        },
    };
})();

export const notification: Page = {
    isActive() {
        if (notificationPage === null) {
            return false;
        }

        return notificationPage.isActive();
    },

    async toggle() {
        if (notificationPage === null) {
            notificationPage = await NotificationPage.create();
            await sleep(10);
        }

        notificationPage.toggle();
    },

    hide() {
        if (notificationPage === null) {
            return;
        }

        notificationPage.hide();
    },
};
