declare module '*.scss';
declare module '*.html';
declare module '*.json';
declare module '*.svg';
declare module '*.csv';

type ApiResponse = { message: string; statusCode?: number; errors?: ApiErrorDetail[]; [key: string]: any };
type ApiErrorResponse = { statusCode?: number; errors: ApiErrorDetail[] };
type ApiErrorDetail = { code: number; message: string };

type ApiAspErrorResponse = { statusCode?: number; errors: any[]; status: number; title: string; traceId: string; type: string };
