import fetch, { Response, Request } from 'node-fetch';
import { log } from '../logger';
import { tokenHandler } from './tokenHandler';
import { AppSettingsManager } from '../appSettingsManager';

const errorCode = {
    network: 8,
    unknown: 9,
};

export class ApiError extends Error {
    public errorResponse: ApiErrorResponse;

    constructor(_errorResponse: ApiErrorResponse) {
        super('API error occurred.');
        this.errorResponse = _errorResponse;
    }
}

async function get(path: string) {
    const url = `${AppSettingsManager.getInstance().apiUrl}/${path}`;
    const token = await tokenHandler.getToken();

    const request = new Request(url, {
        method: 'GET',
        headers: {
            Authorization: token ? `Bearer ${token}` : '',
        },
    });

    return await sendRequest(request);
}

async function post(path: string, data: any) {
    const url = `${AppSettingsManager.getInstance().apiUrl}/${path}`;
    const token = await tokenHandler.getToken();

    const request = new Request(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
    });

    return await sendRequest(request);
}

async function postFromData(path: string, formData: FormData) {
    const token = await tokenHandler.getToken();

    const request = new Request(path, {
        method: 'POST',
        headers: {
            // 'Content-Type': 'multipart/form-data',
            Authorization: token ? `Bearer ${token}` : '',
        },
        // body: formData,
    });

    return await sendRequest(request);
}

async function sendRequest(request: Request) {
    let response: Response;

    try {
        response = await fetch(request);
    } catch (error: any) {
        const apiError: ApiErrorDetail = { code: errorCode.network, message: 'network error occurred.' };
        throw handleApiError(new ApiError({ errors: [apiError] }));
    }

    if (!response.ok) {
        throw await createApiError(response);
    }

    const result = (await response.json()) as ApiResponse;
    result.statusCode = response.status;

    log.debug(result);
    return result;
}

async function createApiError(response: Response): Promise<Error> {
    log.error(`error occurred. StatusCode = [ ${response.status} ]`);
    const contentType = response.headers.get('content-type');
    //problem+json
    if (contentType == null) {
        const text = await response.text();

        const apiError: ApiErrorDetail = {
            code: errorCode.unknown,
            message: `Unknown error occurred. StatusCode = [ ${response.status} ]` + `\n\n${text}`,
        };

        log.error(response);
        return handleApiError(new ApiError({ statusCode: response.status, errors: [apiError] }));
    }

    const errorResponse = (await response.json()) as ApiErrorResponse;
    errorResponse.statusCode = response.status;

    log.error(errorResponse);
    return handleApiError(new ApiError(errorResponse));
}

/**
 * todo refactoring!!!
 * just convert to message. because this error passed to renderer.
 */
function handleApiError(error: ApiError) {
    const response = error.errorResponse;

    // eslint-disable-next-line no-prototype-builtins
    if (!Array.isArray(response.errors) || response.hasOwnProperty('traceId')) {
        // this is framework error.
        // todo Framework error response. such as validation etc.
        return new Error(`Message: ${(response as ApiAspErrorResponse).title}`);
    }

    const errorMessage = response.errors.map(x => `Error Code: ${x.code}\nMessage: ${x.message}`).join('\n');

    console.log('errorMessage');
    console.log(errorMessage);

    return new Error(error.message + '\n' + errorMessage);
}

const api = { get, post, postFromData, sendRequest, handleApiError };

export { api };
