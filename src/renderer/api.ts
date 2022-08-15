import {
    Holiday,
    AppBoard,
    WorkRecord,
    UnsavedNotification,
    AppConfig,
    GetSVGsCond,
    UserConfig,
    ErrorDetail,
    WorkConfig,
    StartOrEnd,
    Schedule,
    AppNotification,
    Category,
    WorkProcess,
    Board,
} from '../common/models';
import { ElectronWindow } from './ElectronWindow';
declare let window: ElectronWindow;

export type SaveBoardCallback = (board: AppBoard) => void;

export const api = (() => {
    async function initializeWithWebApp(email: string, password: string) {
        await window.api.invoke('initializeWithWebApp', { email, password });
    }

    async function getCategories() {
        const categories = (await window.api.invoke('getCategories')) as Category[];

        return categories;
    }

    async function getWorkProcessList() {
        const workProcessList = (await window.api.invoke('getWorkProcessList')) as WorkProcess[];

        return workProcessList;
    }

    async function getHolidays(startDate: string, endDate: string) {
        const holidays = (await window.api.invoke('getHolidays', { startDate, endDate })) as Holiday[];

        return holidays;
    }

    async function searchWorkRecords(startDate: string, endDate: string) {
        const workRecords = (await window.api.invoke('searchWorkRecords', { startDate, endDate })) as WorkRecord[];

        return workRecords;
    }

    async function getJmottoEvents() {
        const schedules = (await window.api.invoke('getJmottoEvents')) as Schedule[];

        return schedules;
    }

    async function deleteNotification(id: number) {
        const succeed = (await window.api.invoke('deleteNotification', { id })) as boolean;

        return succeed;
    }

    async function saveNotification(notification: UnsavedNotification) {
        const updatedNotification = (await window.api.invoke('saveNotification', { notification })) as AppNotification;

        return updatedNotification;
    }

    async function getSVG({ iconName, iconColor }: { iconName: string; iconColor: string }) {
        const svg = (await window.api.invoke('getSVG', { iconName, iconColor })) as string;

        return svg;
    }

    async function getSVGs(cond: GetSVGsCond) {
        const svgs = (await window.api.invoke('getSVGs', cond)) as string[];

        return svgs;
    }

    async function getConfig(callback: (config: AppConfig) => void) {
        const config = (await window.api.invoke('getConfig', null)).config as AppConfig;
        callback(config);
    }

    async function saveConfig(config: UserConfig) {
        const succeed = (await window.api.invoke('saveConfig', config)) as boolean;

        return succeed;
    }

    async function searchBoardList(projectName: string) {
        const boardList = (await window.api.invoke('searchBoardList', { projectName })) as Board[];
        return boardList;
    }

    async function getBoardList(count: number) {
        const boardList = (await window.api.invoke('getBoardList', { count })) as AppBoard[];
        return boardList;
    }

    async function saveBoard(board: AppBoard, callback: SaveBoardCallback) {
        const savedBoard = (await window.api.invoke('saveBoard', board)) as AppBoard;
        callback(savedBoard);
    }

    function startWork({ usePunchIn, work }: { usePunchIn: boolean; work: WorkConfig }) {
        window.api.invoke('startOrEndWork', {
            startOrEnd: 'start',
            usePunchIn,
            work,
        });
    }
    function endWork({ usePunchIn, work }: { usePunchIn: boolean; work: WorkConfig }) {
        window.api.invoke('startOrEndWork', {
            startOrEnd: 'end',
            usePunchIn,
            work,
        });
    }

    function punchIn(target: string, startOrEnd: StartOrEnd) {
        window.api.invoke('punchIn', { target, startOrEnd });
    }

    function setWindowSize(zoom: number) {
        window.api.send('setWindowSize', { zoom });
    }

    async function showWorkListWindow() {
        window.api.send('showWorkListWindow');
    }

    return {
        initializeWithWebApp,
        getCategories,
        getWorkProcessList,
        getHolidays,
        searchWorkRecords,
        getJmottoEvents,
        deleteNotification,
        saveNotification,
        getSVG,
        getSVGs,
        getConfig,
        saveConfig,
        searchBoardList,
        getBoardList,
        saveBoard,
        startWork,
        endWork,
        punchIn,
        setWindowSize,
        showWorkListWindow,
    };
})();

export const apiEvent = (() => {
    function workChanged(callback: () => void) {
        window.api.on('workChanged', () => {
            callback();
        });
    }

    function errorOccurred(callback: (detail: ErrorDetail) => void) {
        window.api.on('errorOccurred', (detail: ErrorDetail) => {
            callback(detail);
        });
    }

    return {
        workChanged,
        errorOccurred,
    };
})();
