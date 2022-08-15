import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv';
import * as iconv from 'iconv-lite';

import { log } from './logger';
import { appFolderPath } from './appManager';
import { AppDb } from './database';
import { Holiday } from '../common/models';
import { DateEx } from './tw/twUtility/twUtility';

const csvUrl = `https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv`;

let database: AppDb;
let holidayCsvFilePath: string;

function initialize(_database: AppDb) {
    database = _database;
    holidayCsvFilePath = path.join(appFolderPath, 'holiday.csv');
}

export const holiday = {
    initialize,
    UpdateHolidaysIfNeeded,
};

async function UpdateHolidaysIfNeeded() {
    if (database == null) {
        throw new Error('holiday module is not initialized yet.');
    }

    const year = new Date().getFullYear();
    const lastHoliday = await database.getLatestHoliday();
    const holidayYear = lastHoliday ? new Date(lastHoliday.date).getFullYear() : new Date().getFullYear();

    if (holidayYear - year < 1) {
        loadHolidayCsv(lastHoliday);
    }
}

async function loadHolidayCsv(lastHoliday: Holiday) {
    log.debug('[loadHolidayCsv] started');

    const parser = csv.parse({ from_line: 2 }, async (error, rows: string[]) => {
        const holidays: Holiday[] = [];
        for (const row of rows) {
            const date = new DateEx(row[0]).toDateString();
            if (lastHoliday && date < lastHoliday.date) {
                continue;
            }

            const holiday: Holiday = {
                date: date,
                name: row[1],
            };
            holidays.push(holiday);
        }

        await database.saveHolidays(holidays);
    });

    const saveFile = fs.createWriteStream(holidayCsvFilePath);
    https
        .get(csvUrl, response => {
            response.pipe(saveFile);
            response.pipe(iconv.decodeStream('SJIS')).pipe(iconv.encodeStream('UTF-8')).pipe(parser);
        })
        .on('error', e => {
            log.error(e);
        });

    log.debug('[loadHolidayCsv] finished');
}
