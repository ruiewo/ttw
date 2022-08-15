import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { log } from './logger';
import { Category, Holiday, AppBoard, WorkProcess, WorkRecord } from '../common/models';
import { TtwWorkRecord } from './achievement/achievementApi';

const dbFileName = 'ttw.db';
const className = 'AppDb';

type searchHolidayCondition = { startDate: string; endDate: string };

export class AppDb {
    private db: sqlite3.Database;

    private constructor(database: sqlite3.Database) {
        this.db = database;
    }

    static async create(folderPath: string) {
        const dbFilePath = path.join(folderPath, dbFileName);
        const db = await connect(dbFilePath);
        if (db === null) {
            throw new Error('initialize database failed.');
        }

        const appDb = new AppDb(db);

        await appDb.confirmDbExist();

        return appDb;
    }

    async confirmDbExist() {
        log.debug(`${className}::confirmDbExist started.`);

        const createBoardTable = `CREATE TABLE IF NOT EXISTS boards(
                id INTEGER PRIMARY KEY,
                boardId INTEGER,
                boardDetail TEXT,
                comment TEXT,
                updated_at TEXT NOT NULL DEFAULT(DATETIME('now', 'localtime')))`;

        const createWorkTable = `CREATE TABLE IF NOT EXISTS works(
                id INTEGER PRIMARY KEY,
                date TEXT,
                workingHours REAL,
                categoryId INTEGER,
                workProcessDetailId INTEGER,
                boardId INTEGER,
                boardDetail TEXT,
                comment TEXT,
                startDateTime TEXT,
                endDateTime TEXT,
                uploaded INTEGER DEFAULT(0) NOT NULL)`;

        const createHolidayTable = `CREATE TABLE IF NOT EXISTS holidays(
                id INTEGER PRIMARY KEY,
                date TEXT NOT NULL UNIQUE,
                name TEXT)`;

        const createCategoryTable = `CREATE TABLE IF NOT EXISTS categories(
                id INTEGER PRIMARY KEY,
                name TEXT)`;

        const createWorkProcessTable = `CREATE TABLE IF NOT EXISTS workProcessList(
                id INTEGER PRIMARY KEY,
                name TEXT,
                details TEXT)`;
        // details is JSON value. workProcessDetails[] are contained.

        this.db.serialize(() => {
            this.db.run(createBoardTable);
            this.db.run(createWorkTable);
            this.db.run(createHolidayTable);
            this.db.run(createCategoryTable);
            this.db.run(createWorkProcessTable);
        });

        log.debug(`${className}::confirmDbExist finished.`);
    }

    close() {
        this.db.close(err => {
            if (err) {
                log.error(err.message);
            }
            log.debug('Close the database connection.');
        });
    }

    async seed({ categories, workProcessList }: { categories: Category[]; workProcessList: WorkProcess[] }) {
        await this.saveCategories(categories);
        await this.saveWorkProcessList(workProcessList);
    }

    // CATEGORY
    async getCategories() {
        log.debug(`${className}::getCategories started.`);

        const rows = await new Promise<Category[]>(resolve => {
            this.db.all(
                `
                SELECT *
                FROM categories
                ORDER BY id ASC`,
                (err, rows) => {
                    if (err) {
                        log.error(err);
                        throw new Error(`${className}::getCategories failed.`);
                    }

                    resolve(rows);
                }
            );
        });

        log.debug(`${className}::getCategories finished.`);
        return rows;
    }

    async saveCategories(categories: Category[]) {
        log.debug(`${className}::saveCategories started.`);

        const query = `INSERT OR REPLACE INTO categories
            (id, name)
            VALUES($id, $name)`;

        return new Promise<void>(resolve => {
            this.db.serialize(() => {
                for (const category of categories) {
                    this.db.run(query, {
                        $id: category.id,
                        $name: category.name,
                    });
                }

                this.db.run(`SELECT 0`, () => {
                    log.debug(`${className}::saveCategories finished.`);
                    resolve();
                });
            });
        });
    }

    // WORK PROCESS
    async getWorkProcessList() {
        log.debug(`${className}::getWorkProcessList started.`);

        const rows = await new Promise<WorkProcess[]>(resolve => {
            this.db.all(
                `
                SELECT *
                FROM workProcessList
                ORDER BY id ASC`,
                (err, rows) => {
                    if (err) {
                        log.error(err);
                        throw new Error(`${className}::getWorkProcessList failed.`);
                    }
                    const workProcessList = rows.map(row => {
                        return { id: row.id, name: row.name, details: JSON.parse(row.details) } as WorkProcess;
                    });

                    resolve(workProcessList);
                }
            );
        });

        log.debug(`${className}::getWorkProcessList finished.`);
        return rows;
    }

    async saveWorkProcessList(workProcessList: WorkProcess[]) {
        log.debug(`${className}::saveWorkProcessList started.`);

        const query = `INSERT OR REPLACE INTO workProcessList
            (id, name, details)
            VALUES($id, $name, $details)`;

        return new Promise<void>(resolve => {
            this.db.serialize(() => {
                for (const workProcess of workProcessList) {
                    this.db.run(query, {
                        $id: workProcess.id,
                        $name: workProcess.name,
                        $details: JSON.stringify(workProcess.details),
                    });
                }

                this.db.run(`SELECT 0`, () => {
                    log.debug(`${className}::saveWorkProcessList finished.`);
                    resolve();
                });
            });
        });
    }

    // QUOTE NUMBER
    async getBoardList(count: number) {
        log.debug(`${className}::getBoardList started.`);

        const rows = await new Promise<AppBoard[]>(resolve => {
            this.db.all(
                `SELECT *
                    FROM boards
                    ORDER BY updated_at DESC
                    LIMIT ${count}`,
                (err, rows) => {
                    if (err) {
                        log.error(err);
                        throw new Error(`${className}::getBoardList failed.`);
                    }

                    resolve(rows);
                }
            );
        });

        log.debug(`${className}::getBoardList finished.`);
        return rows;
    }

    async saveBoard(board: AppBoard) {
        log.debug(`${className}::saveBoard started.`);

        const insertQuery = `INSERT OR REPLACE INTO boards
            (id, boardId, boardDetail, comment)
            VALUES($id, $boardId, $boardDetail, $comment)`;

        const getSavedBoardQuery = `SELECT * 
                FROM boards
                WHERE boards.boardId = ${board.boardId}
                    AND boards.comment = '${board.comment}'
                `;

        return await new Promise<AppBoard>(resolve => {
            this.db.serialize(() => {
                this.db.run(insertQuery, {
                    $id: board.id,
                    $boardId: board.boardId,
                    $boardDetail: board.boardDetail,
                    $comment: board.comment,
                });

                this.db.get(getSavedBoardQuery, (err, row) => {
                    if (err) {
                        log.error(err);
                        throw new Error(`${className}::saveBoard failed.`);
                    }

                    log.debug(`${className}::saveBoard finished.`);
                    resolve(row as AppBoard);
                });
            });
        });
    }

    // WORK DATA
    async getNotUploadedWorkData() {
        log.debug(`${className}::getNotUploadedWorkData started.`);

        const rows = await new Promise<TtwWorkRecord[]>(resolve => {
            this.db.all(
                `SELECT
                        works.id as ttwId,
                        works.date as date,
                        works.workingHours as workingHours,
                        works.categoryId as categoryId,
                        works.workProcessDetailId as workProcessDetailId,
                        works.boardId as boardId,
                        '' as boardDetail,
                        works.comment as comment,
                        works.startDateTime as startDateTime,
                        works.endDateTime as endDateTime
                    FROM works
                    WHERE uploaded = false`,
                (err, rows) => {
                    if (err) {
                        log.error(err);
                        throw new Error(`${className}::getNotUploadedWorkData failed.`);
                    }

                    resolve(rows);
                }
            );
        });

        log.debug(`${className}::getNotUploadedWorkData finished.`);
        return rows;
    }

    async insertWorkData(work: WorkRecord) {
        log.debug(`${className}::insertWorkData started.`);

        const query = `INSERT OR REPLACE INTO works
            (date, workingHours,categoryId, workProcessDetailId, boardId, boardDetail, comment, startDateTime, endDateTime)
            VALUES($date, $workingHours, $categoryId, $workProcessDetailId, $boardId, $boardDetail, $comment, $startDateTime, $endDateTime)`;

        return new Promise<void>(resolve => {
            this.db.run(
                query,
                {
                    $date: work.date,
                    $workingHours: work.workingHours,
                    $categoryId: work.categoryId,
                    $workProcessDetailId: work.workProcessDetailId,
                    $boardId: work.boardId,
                    $boardDetail: work.boardDetail,
                    $comment: work.comment,
                    $startDateTime: work.startDateTime,
                    $endDateTime: work.endDateTime,
                },
                err => {
                    if (err) {
                        log.error(err);
                        throw new Error(`${className}::insertWorkData failed.`);
                    }

                    log.debug(`${className}::insertWorkData finished.`);
                    resolve();
                }
            );
        });
    }

    async setUploaded(ids: number[]) {
        log.debug(`${className}::setUploaded started.`);

        const query = ` UPDATE works SET uploaded = true WHERE id IN (${ids.join(',')})`;

        return new Promise<void>(resolve => {
            this.db.run(query, err => {
                if (err) {
                    log.error(err);
                    throw new Error(`${className}::setUploaded failed.`);
                }

                log.debug(`${className}::setUploaded finished.`);
                resolve();
            });
        });
    }

    async saveWorks(works: WorkRecord[]) {
        log.debug(`${className}::saveWorks started.`);

        const query = `INSERT OR REPLACE INTO works
            (date, workingHours,categoryId, workProcessDetailId, boardId, boardDetail, comment, startDateTime, endDateTime)
            VALUES($date, $workingHours, $categoryId, $workProcessDetailId, $boardId, $boardDetail, $comment, $startDateTime, $endDateTime)`;

        return new Promise<void>(resolve => {
            this.db.serialize(() => {
                for (const work of works) {
                    this.db.run(query, {
                        $id: work.id,
                        $date: work.date,
                        $workingHours: work.workingHours,
                        $categoryId: work.categoryId,
                        $workProcessDetailId: work.workProcessDetailId,
                        $boardId: work.boardId,
                        $boardDetail: work.boardDetail,
                        $comment: work.comment,
                        $startDateTime: work.startDateTime,
                        $endDateTime: work.endDateTime,
                    });
                }

                this.db.run(`SELECT 0`, () => {
                    log.debug(`${className}::saveWorks finished.`);
                    resolve();
                });
            });
        });
    }

    async deleteWorks(ids: number[]) {
        log.debug(`${className}::deleteWorks started.`);

        return new Promise<void>(resolve => {
            this.db.run(`DELETE FROM works WHERE id in (${ids})`, () => {
                log.debug(`${className}::deleteWorks finished.`);
                resolve();
            });
        });
    }

    // HOLIDAY
    async getLatestHoliday() {
        log.debug(`${className}::getLatestHoliday started.`);

        const getQuery = 'SELECT * FROM holidays ORDER BY id DESC LIMIT 1';

        const holiday = await new Promise<Holiday>((resolve, reject) => {
            this.db.get(getQuery, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        log.debug(`${className}::getLatestHoliday finished.`);
        return holiday;
    }

    async getHolidays(condition: searchHolidayCondition) {
        log.debug(`${className}::getHolidays started.`);

        let getQuery = `SELECT date, name FROM holidays`;

        const whereConditions: string[] = [];
        if (condition.startDate) {
            whereConditions.push(`date >= '${condition.startDate}'`);
        }
        if (condition.endDate) {
            whereConditions.push(`date <= '${condition.endDate}'`);
        }

        if (whereConditions.length > 0) {
            getQuery += '\nWhere ';
            getQuery += whereConditions.join('\nAND ');
        }

        const holidays = await new Promise<Holiday[]>((resolve, reject) => {
            this.db.all(getQuery, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        log.debug(`${className}::getHolidays finished.`);
        return holidays;
    }

    async saveHolidays(holidays: Holiday[]) {
        log.debug(`${className}::saveHolidays started.`);

        let insertQuery = `INSERT INTO holidays
            (date, name)
            VALUES
            `;

        insertQuery += holidays
            .map(holiday => {
                let values = `(`;
                values += `'${holiday.date}', `;
                values += `'${holiday.name}'`;
                values += `)`;
                return values;
            })
            .join(',');

        return await new Promise<void>(resolve => {
            this.db.run(insertQuery, () => {
                log.debug(`${className}::saveHolidays finished.`);
                resolve();
            });
        });
    }
}

async function connect(dbFilePath: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbFilePath, err => {
            if (err) {
                log.error(err.message);
                reject(null);
            }

            log.debug(`Connected to database. path = [ ${dbFilePath} ]`);
            resolve(db);
        });
    });
}
