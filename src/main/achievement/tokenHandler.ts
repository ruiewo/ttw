import { ConfigManager } from '../configManager';
import { AppSettingsManager } from '../appSettingsManager';
import { Request } from 'node-fetch';
import { api } from './api';
import { log } from '../logger';
import { isNullOrWhiteSpace } from '../tw/twUtility/twUtility';

const tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiration: string | null;
    refreshTokenExpiration: string | null;
} = {
    accessToken: null,
    refreshToken: null,
    accessTokenExpiration: null,
    refreshTokenExpiration: null,
};

// @ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

export const tokenHandler = (() => {
    return {
        async getToken() {
            const tokens = await getActiveTokens();
            return tokens.accessToken;
        },
    };
})();

async function getActiveTokens() {
    if (
        !isNullOrWhiteSpace(tokens.accessToken) &&
        !isNullOrWhiteSpace(tokens.accessTokenExpiration) &&
        new Date() < new Date(tokens.accessTokenExpiration!)
    ) {
        return tokens; // no need to authorize.
    }

    let tokenResponse: tokenResponse;

    if (
        !isNullOrWhiteSpace(tokens.refreshToken) &&
        !isNullOrWhiteSpace(tokens.refreshTokenExpiration) &&
        new Date() < new Date(tokens.refreshTokenExpiration!)
    ) {
        tokenResponse = await refreshToken(tokens.refreshToken!);
    } else {
        // email == UserName in WebApp, so convert here.
        const {
            achievement: { email: userName, password },
        } = ConfigManager.getInstance().config;

        tokenResponse = await getToken(userName, password);
    }

    tokens.accessToken = tokenResponse.accessToken;
    tokens.refreshToken = tokenResponse.refreshToken;
    tokens.accessTokenExpiration = tokenResponse.accessTokenExpiration;
    tokens.refreshTokenExpiration = tokenResponse.refreshTokenExpiration;

    return tokens;
}

type tokenResponse = ApiResponse & {
    refreshToken: string;
    accessToken: string;
    accessTokenExpiration: string;
    refreshTokenExpiration: string;
};

async function getToken(email: string, password: string) {
    try {
        log.debug('get token started.');
        const request = new Request(`${AppSettingsManager.getInstance().apiUrl}/ttw/token`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userName: email, password }),
        });

        log.debug(JSON.stringify({ userName: email, password }));

        const response = (await api.sendRequest(request)) as tokenResponse;

        return response;
    } catch (error) {
        log.error('get token failed.');
        throw error;
    }
}

async function refreshToken(_refreshToken: string) {
    try {
        const appSettings = AppSettingsManager.getInstance();
        const request = new Request(`${appSettings.apiUrl}/ttw/refresh`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${_refreshToken}`,
            },
            body: JSON.stringify({ clientId: appSettings.clientId, clientSecret: appSettings.clientSecret }),
        });

        const response = (await api.sendRequest(request)) as tokenResponse;

        return response;
    } catch (error) {
        log.error('refresh token failed.');
        throw error;
    }
}
