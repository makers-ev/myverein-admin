import { backendUrl } from '@/lib/auth-client';
import { toApiError } from '@/lib/clubRegistrations';

/** Server-side GET against an `/admin/...` backend route: forwards the admin's cookie, never cached. */
export async function adminGetServer<T>(path: string, cookie: string): Promise<{ body: T | null; error: string | null }> {
    try {
        const res = await fetch(`${backendUrl}${path}`, { headers: { cookie }, cache: 'no-store' });
        if (!res.ok) return { body: null, error: (await toApiError(res)).message };
        return { body: (await res.json()) as T, error: null };
    } catch (err) {
        console.error(`[admin] GET ${path} failed`, err);
        return { body: null, error: 'Das Backend ist nicht erreichbar.' };
    }
}

/** Browser-side JSON call against the backend; throws `ApiError` on a non-2xx response, returns null for 204. */
export async function adminJson<T>(path: string, method: string, payload?: unknown): Promise<T | null> {
    const res = await fetch(`${backendUrl}${path}`, {
        method,
        credentials: 'include',
        headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    if (!res.ok) throw await toApiError(res);
    if (res.status === 204) return null;
    return (await res.json()) as T;
}
