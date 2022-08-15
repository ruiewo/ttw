import { EventEmitter } from 'events';
import { BrowserWindow, app } from 'electron';
import pie from 'puppeteer-in-electron';
import puppeteer from 'puppeteer-core';
import { log } from './logger';
import { ConfigManager } from './configManager';
import { StartOrEnd } from '../common/models';
import { sleep } from './tw/twUtility/twUtility';

let browser: puppeteer.Browser | null = null;
let browser2: puppeteer.Browser | null = null;

let freeeWindow: BrowserWindow | null = null;
let jmottoWindow: BrowserWindow | null = null;

let configManager: ConfigManager;
const eventEmitter = new EventEmitter();

async function initialize() {
    browser = await pie.connect(app, puppeteer);
    browser2 = await pie.connect(app, puppeteer);

    configManager = ConfigManager.getInstance();
}

export const automation = {
    initialize,
    punchInJmotto,
    punchInFreee,
    eventEmitter,
    get freeeWindow() {
        return freeeWindow;
    },
    get jmottoWindow() {
        return jmottoWindow;
    },
};

async function punchInJmotto(startOrEnd: StartOrEnd) {
    log.debug(`punchInJmotto started. args = [${startOrEnd}] `);

    if (jmottoWindow !== null) {
        jmottoWindow.close();

        let retryCount = 0;
        while (jmottoWindow !== null) {
            await sleep(100);
            retryCount++;
            log.debug(`closing jmotto window. retry ${retryCount}`);
            if (retryCount === 10) {
                throw new Error('closeJmottoWindow failed');
            }
        }
    }

    const { x, y } = configManager.getBounds('jmottoWindow');

    jmottoWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        x,
        y,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: true,
    });

    jmottoWindow.on('close', () => {
        configManager.saveBounds('jmottoWindow', jmottoWindow!.getBounds());
    });

    jmottoWindow.on('closed', () => {
        jmottoWindow = null;
    });

    try {
        const url = 'https://www1.j-motto.co.jp/fw/dfw/po80/portal/contents/login.html';
        await jmottoWindow.loadURL(url);

        const page = await pie.getPage(browser!, jmottoWindow);
        log.debug('[jmotto] page loaded');

        await Promise.all([
            page.waitForSelector('#memberID', { timeout: 10000 }),
            page.waitForSelector('#userID'),
            page.waitForSelector('#password'),
            page.waitForSelector('label[for="A"]'),
        ]).catch(error => {
            log.error('[jmotto] go to login page failed.');
            throw error;
        });

        const { memberId, userId, password } = configManager.config.jmotto;
        await page.type('#memberID', memberId);
        await page.type('#userID', userId);
        await page.type('#password', password);
        await page.click('label[for="A"]');

        await Promise.all([
            page.waitForSelector('a[href="ztcard.cgi?cmd=tcardindex"]', {
                timeout: 10000,
            }),
            page.click('.loginSubmit > input'),
        ]).catch(error => {
            log.error('[jmotto] login failed.');
            throw error;
        });
        log.debug('[jmotto] log in succeed');

        await Promise.all([
            page.waitForSelector('input[class="jtcard-btn-stime"]', {
                timeout: 10000,
            }),
            page.waitForSelector('input[class="jtcard-btn-etime"]'),
            page.click('a[href="ztcard.cgi?cmd=tcardindex"]'),
        ]).catch(error => {
            log.error('[jmotto] go to time card page failed.');
            throw error;
        });
        log.debug('[jmotto] go to time card page');

        const targetClass = startOrEnd === 'start' ? 'jtcard-btn-stime' : 'jtcard-btn-etime';
        await page.click(`input[class="${targetClass}"]`).catch(error => {
            log.error('[jmotto] press punch In/Out button failed.');
            throw error;
        });

        log.debug('[jmotto] punch in button clicked');
        log.debug(`[jmotto] punchInJmotto finished.`);
    } catch (error) {
        log.error(`punchInJmotto failed.`);
        log.error(error);

        eventEmitter.emit('error', {
            functionName: 'punchInJmotto',
            message: '[Jmotto] 出退勤処理に失敗しました。',
            startOrEnd: startOrEnd,
        });
    }
}

async function punchInFreee(startOrEnd: StartOrEnd) {
    log.debug(`punchInFreee started. args = [${startOrEnd}] `);

    if (freeeWindow !== null) {
        freeeWindow.close();

        let retryCount = 0;
        while (freeeWindow !== null) {
            await sleep(300);
            retryCount++;
            log.debug(`closing freee window. retry ${retryCount}`);
            if (retryCount === 10) {
                throw new Error('closeFreeeWindow failed');
            }
        }
    }

    const { x, y } = configManager.getBounds('freeeWindow');

    freeeWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        x,
        y,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: true,
    });
    freeeWindow.on('close', () => {
        configManager.saveBounds('freeeWindow', freeeWindow!.getBounds());
    });

    freeeWindow.on('closed', () => {
        freeeWindow = null;
    });

    try {
        const url = 'https://accounts.secure.freee.co.jp/login/hr';
        await freeeWindow.loadURL(url);

        const page = await pie.getPage(browser2!, freeeWindow);
        log.debug('[freee] page loaded');

        await Promise.all([
            page.waitForSelector('#user_email', { timeout: 10000 }),
            page.waitForSelector('input[name="password"]', { timeout: 10000 }),
        ]).catch(error => {
            log.error('[freee] go to login page failed.');
            throw error;
        });

        const { email, password } = configManager.config.freee;
        await page.type('#user_email', email);
        await page.type('input[name="password"]', password);

        const punchButtonSelector = `.vb-loading button.vb-button--appearancePrimary`;
        await Promise.all([page.waitForSelector(punchButtonSelector, { timeout: 10000 }), page.click('input[name="commit"]')]).catch(error => {
            log.error('[freee] go to time card page failed.');
            throw error;
        });
        log.debug('[freee] log in succeed');

        const buttons = await page.$$(punchButtonSelector); // tagがuniqueかどうか判断できないためループする
        log.debug(buttons);
        log.debug(`BUTTONS: ${buttons.length}`);

        let buttonClicked = false;
        for (const button of buttons) {
            const jsHandle = await button.getProperty('textContent');
            const textContent = await jsHandle.jsonValue();
            const targetText = startOrEnd === 'start' ? '出勤する' : '退勤する';
            log.debug(`BUTTON TEXT: ${textContent}`);
            log.debug(`TARGET TEXT: ${targetText}`);
            log.debug(textContent === targetText);

            if (textContent === targetText) {
                await sleep(500); // element.click() は座標判定して該当座標にclickイベントを飛ばしているため、アニメーション等で対象が移動する場合は意図しない座標をクリックする可能性がある。
                await button.click();
                buttonClicked = true;
                break;
            }
        }

        if (buttonClicked) {
            log.debug('[freee] punch in button clicked');
        } else {
            log.error('[freee] click punch in button failed.');
        }

        log.debug(`[freee] punchInFreee finished.`);
    } catch (error) {
        log.error(`punchInFreee failed.`);
        log.error(error);

        eventEmitter.emit('error', {
            functionName: 'punchInFreee',
            message: '[Freee] 出退勤処理に失敗しました。',
            startOrEnd: startOrEnd,
        });
    }
}
