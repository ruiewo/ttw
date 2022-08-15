import * as ical from 'node-ical';
import fetch from 'node-fetch';
import { log } from './logger';
import { ConfigManager } from './configManager';
import { Schedule } from '../common/models';
import { isNullOrWhiteSpace, DateEx } from './tw/twUtility/twUtility';
import { AppSettingsManager } from './appSettingsManager';

async function getJmottoEvents() {
    log.debug('[getJmottoEvents] started');
    const configManager = ConfigManager.getInstance();
    const jmottoConfig = configManager.config.jmotto;
    const userId = jmottoConfig.userId;
    const icalPassword = jmottoConfig.icalPassword;
    const memberId = jmottoConfig.memberId;
    if (isNullOrWhiteSpace(userId) || isNullOrWhiteSpace(icalPassword) || isNullOrWhiteSpace(memberId)) {
        return [];
    }
    try {
        const serverUrl = AppSettingsManager.getInstance().jmottoServerUrl;
        const url = `${serverUrl}/cgi-bin/${memberId}/dneoical/dneoical.cgi?userid=${userId}&_word=${icalPassword}&from=0&to=1`;
        const method = 'GET';

        const response = await fetch(url, { method });

        if (!response.ok) {
            throw new Error(`Execute jmotto api failed. url = [${url}]`);
        }

        const icalText = await response.text();
        const events = (await ical.async.parseICS(icalText)) as Record<string, ical.VEvent>;

        const today = new DateEx().toDateString();

        const todayEvents = Object.values(events)
            .filter(x => new DateEx(x.start).toDateString() == today)
            .map(x => ({ type: 'event', title: x.summary, time: new DateEx(x.start.toString()).toTimeString() })) as Schedule[];

        log.debug('[getJmottoEvents] finished.');
        return todayEvents;
    } catch (error) {
        log.error('[getJmottoEvents] failed.');
        log.error(error);
        throw error;
    }
}

export const jmotto = {
    getJmottoEvents,
};
