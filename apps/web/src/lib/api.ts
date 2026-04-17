const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

function normalizeBaseUrl(url: string) {
    return url.replace(/\/+$/, '');
}

function resolveEnvBaseUrl() {
    const env = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (env && env.trim()) {
        return env.trim();
    }
    return null;
}

export function getApiBaseUrl() {
    const envBase = resolveEnvBaseUrl();

    if (typeof window === 'undefined') {
        return normalizeBaseUrl(envBase ?? 'http://localhost:4000');
    }

    const hostname = window.location.hostname;

    if (!envBase) {
        return normalizeBaseUrl(`http://${hostname}:4000`);
    }

    try {
        const envUrl = new URL(envBase);
        if (LOCAL_HOSTNAMES.has(envUrl.hostname) && LOCAL_HOSTNAMES.has(hostname)) {
            envUrl.hostname = hostname;
            return normalizeBaseUrl(envUrl.toString());
        }
    } catch {
        // Ignore parse errors and fall back to the provided env value.
    }

    return normalizeBaseUrl(envBase);
}

export const API_BASE_URL = getApiBaseUrl();

export function buildApiUrl(path: string) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const base = getApiBaseUrl();
    if (!path.startsWith('/')) {
        return `${base}/${path}`;
    }
    return `${base}${path}`;
}

function getFallbackBaseUrl(baseUrl: string) {
    try {
        const url = new URL(baseUrl);
        if (url.hostname === 'localhost') {
            url.hostname = '127.0.0.1';
            return normalizeBaseUrl(url.toString());
        }
        if (url.hostname === '127.0.0.1') {
            url.hostname = 'localhost';
            return normalizeBaseUrl(url.toString());
        }
    } catch {
        return null;
    }
    return null;
}

function normalizeThrownError(error: unknown, fallbackMessage: string) {
    if (error instanceof Error) return error;
    if (typeof error === 'string' && error.trim()) return new Error(error);

    try {
        return new Error(JSON.stringify(error));
    } catch {
        return new Error(fallbackMessage);
    }
}

function isRetryableBody(body: RequestInit['body']) {
    if (!body) return true;

    if (typeof body === 'string') return true;

    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return true;
    if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
    if (typeof Blob !== 'undefined' && body instanceof Blob) return true;
    if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return true;

    return false;
}

export async function apiFetch(path: string, options?: RequestInit) {
    const url = buildApiUrl(path);

    try {
        return await fetch(url, options);
    } catch (error) {
        const fallbackBase = getFallbackBaseUrl(getApiBaseUrl());
        const canRetry = isRetryableBody(options?.body);

        if (fallbackBase && canRetry && !path.startsWith('http://') && !path.startsWith('https://')) {
            const fallbackUrl = path.startsWith('/') ? `${fallbackBase}${path}` : `${fallbackBase}/${path}`;
            return await fetch(fallbackUrl, options);
        }

        throw normalizeThrownError(error, 'Network request failed before reaching the API.');
    }
}

export async function safeJson<T = any>(res: Response): Promise<T | null> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}
