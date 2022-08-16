import * as path from 'path';
import { configure, getLogger } from 'log4js';
import { appFolderPath, isDebugMode } from './appManager';

configure({
    appenders: {
        console: { type: 'stdout' },
        file: { type: 'file', filename: path.join(appFolderPath, 'ttw.log') },
    },
    categories: {
        debug: { appenders: ['file', 'console'], level: 'debug' },
        default: { appenders: ['file'], level: 'info' },
    },
});

export const log = getLogger(isDebugMode ? 'debug' : 'default');
