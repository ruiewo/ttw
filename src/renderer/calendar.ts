import { Page } from './page.js';
import { api } from './api.js';
import { Holiday, UserConfig, WorkRecord } from '../common/models';
import { appEvent } from './event.js';
import { configManager } from './configManager.js';
import { appSettings } from './appSettings.js';
import { DateEx, sleep } from './tw/twUtility/twUtility.js';

export const typewriter = async (dom: HTMLElement, text: string, speed: number, delay: number) => {
    const charArray = text.split('');

    await new Promise(resolve => setTimeout(resolve, delay));
    charArray.forEach((char, index) => {
        setTimeout(() => (dom.textContent += char), speed * index);
    });
};

class CalendarPage {
    private task: HTMLElement;
    private workStatus: HTMLElement;
    private dailyWorkInfo: HTMLElement;

    private calendarContainer: HTMLElement;
    private calendarBody: HTMLElement;

    private workSummary: { project: string; hours: number }[];

    constructor({
        config,
        startDate,
        endDate,
        holidays,
        workRecords,
    }: {
        config: UserConfig.Calendar;
        startDate: DateEx;
        endDate: DateEx;
        holidays: Holiday[];
        workRecords: WorkRecord[];
    }) {
        const calendarPage = document.getElementById('calendarPage')!;
        calendarPage.innerHTML = '';

        // create settingArea
        this.task = document.createElement('div');
        this.task.classList.add('pageTopArea');
        this.task.classList.add('task');
        this.task.id = 'task';

        this.task.innerHTML = `<div id="workStatus" class="workStatus"></div>` + `<div id="dailyWorkInfo" class="dailyWorkInfo"></div>`;

        calendarPage.appendChild(this.task);
        this.workStatus = document.getElementById('workStatus')!;
        this.dailyWorkInfo = document.getElementById('dailyWorkInfo')!;

        // summary header
        const totalHour = workRecords.reduce((sum, record) => sum + record.workingHours, 0);
        const workDays = new Set(workRecords.map(x => x.date)).size;
        const average = workDays != 0 ? (totalHour / workDays).toFixed(1) : 0.0;
        typewriter(this.workStatus, `worked ${totalHour.toFixed(1)} hours for ${workDays} days. (${average}h/day)`, 50, 1200);

        const workSummaryMap = new Map<number, { project: string; hours: number }>();

        for (const record of workRecords) {
            const hours = workSummaryMap.has(record.boardId!)
                ? workSummaryMap.get(record.boardId!)!.hours + record.workingHours
                : record.workingHours;
            const boardDetails = record.boardDetail.split(',');
            boardDetails.pop();
            workSummaryMap.set(record.boardId!, { project: boardDetails.join(','), hours });
            // workSummaryMap.set(record.boardId!, { project: appSettings.getProjectName(record.boardDetail), hours });
        }

        this.workSummary = [...workSummaryMap.values()];
        this.workSummary.sort((a, b) => (a.hours > b.hours ? -1 : 1));

        // create container
        this.calendarContainer = document.createElement('div');
        this.calendarContainer.classList.add('pageMainArea');
        this.calendarContainer.classList.add('calendarContainer');
        this.calendarContainer.id = 'calendarContainer';

        let calendarHead = `<div id="calendarHead" class="calendarHead">`;
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (const day of dayOfWeek) {
            calendarHead += `<div>${day}</div>`;
        }
        calendarHead += `</div>`;

        let calendarBody = `<div id="calendarBody" class="calendarBody">`;

        const today = new DateEx().toDateString();
        const days = getDaysArray(startDate, endDate);

        const dailyRecordMap = new Map();
        workRecords.forEach(record => {
            const hours = dailyRecordMap.has(record.date) ? dailyRecordMap.get(record.date) + record.workingHours : record.workingHours;
            dailyRecordMap.set(record.date, hours);
        });

        for (const day of days) {
            const disabledClass = day.fullDate > today ? '--disabled' : '';
            const holidayClass = holidays.some(h => h.date === day.fullDate) ? 'holiday' : '';

            let iconClass = ``;
            let iconText = ``;
            if (!dailyRecordMap.has(day.fullDate)) {
                //
            } else {
                const hours = dailyRecordMap.get(day.fullDate);
                if (hours >= config.skull) {
                    iconClass = `icon skull`;
                } else if (hours >= config.mad) {
                    iconClass = `icon mad`;
                } else if (hours >= config.frustrated) {
                    iconClass = `icon frustrated`;
                } else if (hours >= config.uncomfortable) {
                    iconClass = `icon uncomfortable`;
                } else if (hours >= config.smile) {
                    iconClass = `icon smile`;
                } else if (hours >= 0) {
                    iconClass = `maru`;
                    iconText = hours.toFixed(1);
                } else {
                    // do nothing
                }
            }
            const iconDom = `<p class="${iconClass}">${iconText}</p>`;

            const dayHtml = `<div class="day ${disabledClass} ${holidayClass}" data-full-date="${day.fullDate}">${day.date}${iconDom}</div>`;
            calendarBody += dayHtml;
        }
        calendarBody += `</div>`;

        this.calendarContainer.innerHTML = calendarHead + calendarBody;
        calendarPage.appendChild(this.calendarContainer);

        this.calendarBody = document.getElementById('calendarBody')!;

        this.activateCallback();

        setTimeout(() => this.showWorkingHoursDetail(), 1000); // panel出現のアニメーション時間を待機
    }

    activateCallback() {
        this.workStatus.onclick = () => this.showWorkingHoursDetail();

        this.calendarBody.onclick = async e => {
            const day = (e.target as HTMLElement).closest<HTMLElement>('.day');
            if (!day) {
                return;
            }

            const worksOfTheDay = await api.searchWorkRecords(day.dataset.fullDate!, day.dataset.fullDate!);

            this.dailyWorkInfo.innerHTML = '';
            this.outputDailyWorkInfo(day.dataset.fullDate!, 50, 200);

            if (worksOfTheDay.length === 0) {
                this.outputDailyWorkInfo('0件です', 200, 300);
                return;
            }

            for (const work of worksOfTheDay) {
                this.outputDailyWorkInfo(
                    `${work.workingHours.toFixed(1)}h, ${appSettings.getWorkProcessName(work.workProcessDetailId)}, ${appSettings.getProjectName(
                        work.boardDetail
                    )}`,
                    40,
                    300
                );
            }
        };
    }

    outputDailyWorkInfo(text: string, speed: number, delay: number) {
        const p = document.createElement('p');
        this.dailyWorkInfo.appendChild(p);
        typewriter(p, text, speed, delay);
    }

    showWorkingHoursDetail() {
        this.dailyWorkInfo.innerHTML = '';

        const totalHour = this.workSummary.reduce((sum, project) => sum + project.hours, 0);

        let html = ``;
        for (const { project, hours } of this.workSummary) {
            if (hours <= 0) {
                continue;
            }

            const percent = ((hours / totalHour) * 100).toFixed();

            html +=
                `<p class="workSummary">` +
                `<span class="workingHoursDetail">${project}</span>` +
                `<span class="workingHoursDetail workingHoursDetailBar" style="background: linear-gradient(to left, var(--color-UI-main) ${percent}%, transparent ${percent}%);"></span>` +
                `<span class="workingHoursDetail workingHoursText">${hours.toFixed(1)}h</span>` +
                `</p>`;
        }

        this.dailyWorkInfo.innerHTML = html;
        // appendからクラスの追加が速すぎるとcssのtransitionが効かないためdelayする。
        setTimeout(() => this.dailyWorkInfo.querySelectorAll('.workSummary').forEach(x => x.classList.add('show')), 100);
    }

    isActive() {
        return this.task.classList.contains('--active') || this.calendarContainer.classList.contains('--active');
    }

    toggle() {
        this.task.classList.toggle('--active');
        this.calendarContainer.classList.toggle('--active');
    }

    hide() {
        this.task.classList.remove('--active');
        this.calendarContainer.classList.remove('--active');
    }

    public static async create(targetDate: DateEx, config: UserConfig.Calendar) {
        const startDate = new DateEx(targetDate).addDays(-28 - targetDate.getDay());
        const endDate = new DateEx(targetDate).addDays(27 - targetDate.getDay());

        const holidays = await api.getHolidays(startDate.toDateString(), endDate.toDateString());

        const workRecords = await api.searchWorkRecords(startDate.toDateString(), endDate.toDateString());

        return new CalendarPage({ config, startDate, endDate, holidays, workRecords });
    }
}

function getDaysArray(start: DateEx, end: DateEx) {
    const arr: { fullDate: string; date: string }[] = [];
    for (const dt = new DateEx(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        const day = { fullDate: dt.toDateString(), date: dt.getDate().toString() };
        arr.push(day);
    }
    return arr;
}

function initialize() {
    async function changeIcon() {
        const config = configManager.config.calendar;
        const icon = configManager.icon;

        const root = document.querySelector(':root') as HTMLElement;

        if (config.useDefaultIcon || !icon) {
            // set default
            root.style.setProperty('--icon-smile', getComputedStyle(root).getPropertyValue('--icon-smileDefault'));
            root.style.setProperty('--icon-uncomfortable', getComputedStyle(root).getPropertyValue('--icon-uncomfortableDefault'));
            root.style.setProperty('--icon-frustrated', getComputedStyle(root).getPropertyValue('--icon-frustratedDefault'));
            root.style.setProperty('--icon-mad', getComputedStyle(root).getPropertyValue('--icon-madDefault'));
            return;
        }

        const smileColor = '#00d0fa';
        const uncomfortableColor = '#FF9900';
        const frustratedColor = '#FF6600';
        const madColor = '#FF4400';
        // const skullColor = '#FF1100';

        const svgs = await api.getSVGs({
            iconName: icon,
            iconColors: [smileColor, uncomfortableColor, frustratedColor, madColor],
        });

        root.style.setProperty('--icon-smile', svgs[0]);
        root.style.setProperty('--icon-uncomfortable', svgs[1]);
        root.style.setProperty('--icon-frustrated', svgs[2]);
        root.style.setProperty('--icon-mad', svgs[3]);
    }

    document.body.addEventListener(appEvent.configChanged, async () => {
        await changeIcon();
    });

    document.body.addEventListener(appEvent.iconChanged, async () => {
        await changeIcon();
    });

    async function reloadCalendarPage() {
        if (calendarPage === null) {
            return;
        }

        const isActive = calendarPage.isActive();
        calendarPage = await CalendarPage.create(new DateEx(), configManager.config.calendar);
        if (isActive) {
            calendarPage.toggle();
        }
    }

    document.body.addEventListener(appEvent.configChanged, async () => {
        await reloadCalendarPage();
    });

    document.body.addEventListener(appEvent.workChanged, async () => {
        await reloadCalendarPage();
    });
}

initialize();

let calendarPage: CalendarPage | null = null;

export const calendar: Page = {
    isActive() {
        if (calendarPage === null) {
            return false;
        }

        return calendarPage.isActive();
    },

    async toggle() {
        if (calendarPage === null) {
            calendarPage = await CalendarPage.create(new DateEx(), configManager.config.calendar);
            await sleep(10);
        }

        calendarPage.toggle();
    },

    hide() {
        if (calendarPage === null) {
            return;
        }

        calendarPage.hide();
    },
};
