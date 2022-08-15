import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export const isDebugMode = process.argv.includes('--debug-mode');
export const isDevEnv = process.argv.includes('--develop');

export const appRootPath = isDevEnv ? path.join(__dirname, '../../../') : path.join(app.getPath('exe'), '../');
export const appFolderPath = isDevEnv ? path.join(appRootPath, './AppData') : path.join(app.getPath('userData'), './AppData');

if (!fs.existsSync(appFolderPath)) {
    fs.mkdirSync(appFolderPath);
}
