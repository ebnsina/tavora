import { request } from '../web/src/lib/shared';

export * from '../web/src/lib/shared';

const base = process.env.EXPO_PUBLIC_API_URL;
if (!base) throw new Error('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.');

export const api = <T>(path: string, init?: RequestInit) => request<T>(base, path, init);
