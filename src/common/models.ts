export type AppBoard = {
    id: number | null;
    boardId: number | null;
    boardDetail: string;
    project: string;
    comment: string;
};

export type WorkRecord = {
    id: number | null;
    date: string;
    workingHours: number;
    categoryId: number;
    workProcessDetailId: number;
    boardId: number | null;
    boardDetail: string;
    comment: string;
    //
    startDateTime: string; // must be iso string.
    endDateTime: string; // must be iso string.
};

export type Holiday = {
    date: string;
    name: string;
};

export namespace UserConfig {
    export type Jmotto = {
        useJmotto: boolean;
        memberId: string;
        userId: string;
        password: string;
        icalPassword: string;
    };
    export type Freee = {
        useFreee: boolean;
        email: string;
        password: string;
    };
    export type Achievement = {
        email: string;
        password: string;
    };
    export type Calendar = {
        useDefaultIcon: boolean;
        smile: number;
        uncomfortable: number;
        frustrated: number;
        mad: number;
        skull: number;
    };
    export type WindowSetting = {
        alwaysOnTop: boolean;
        useDefaultWindowSize: boolean;
        zoomSlider: number;
    };
    export type Color = {
        useDefaultMainColor: boolean;
        mainHueSlider: number;
        useDefaultIconColor: boolean;
        iconHueSlider: number;
    };
    export type WorkInfoPanel = {
        maxBoardListCount: number;
    };
}

export type UserConfig = {
    jmotto: UserConfig.Jmotto;
    freee: UserConfig.Freee;
    achievement: UserConfig.Achievement;
    calendar: UserConfig.Calendar;
    windowSetting: UserConfig.WindowSetting;
    color: UserConfig.Color;
    workInfoPanel: UserConfig.WorkInfoPanel;
};

export type WorkConfig = WorkRecord & {
    isWorking: boolean;
};
export namespace BoundsConfig {
    export type Bounds = {
        x: number;
        y: number;
        width?: number;
        height?: number;
    };
}

export type AppNotification = {
    id: number;
    time: string;
    title: string;
    message: string;
    link: string;
};
export type UnsavedNotification = {
    id: number | null;
    time: string;
    title: string;
    message: string;
    link: string;
};

export type AppConfig = UserConfig & {
    work: WorkConfig;

    workComments: string[];

    notifications: AppNotification[];

    bounds: {
        mainWindow: BoundsConfig.Bounds;
        workListWindow: BoundsConfig.Bounds;
        jmottoWindow: BoundsConfig.Bounds;
        freeeWindow: BoundsConfig.Bounds;
    };
};

export type AppWindow = 'mainWindow' | 'workListWindow' | 'jmottoWindow' | 'freeeWindow';

export type Schedule = {
    type: 'act' | 'notify' | 'event';
    time: string;
    title: string;
    id?: number;
};

export type GetSVGsCond = { iconName: string; iconColors: string[] };

export type ErrorDetail = { message: string; functionName: string; startOrEnd?: StartOrEnd };
export type StartOrEnd = 'start' | 'end';

export type WorkProcess = { id: number; name: string; details: WorkProcessDetail[] };
export type WorkProcessDetail = { id: number; name: string };
export type Category = { id: number; name: string };
export type Board = { id: number; name: string };
