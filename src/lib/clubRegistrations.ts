import { backendUrl } from '@/lib/auth-client';

/**
 * Shapes + helpers for the backend's admin review API
 * (`/admin/club-registrations`, see myverein-backend
 * `src/routes/admin-club-registrations.ts`). Not a Better Auth plugin endpoint,
 * so plain `fetch` -- the browser variant sends the session cookie via
 * `credentials: 'include'`, the server components forward the incoming
 * `Cookie` header themselves (see `(protected)/layout.tsx`).
 */

/** Window event fired after a decision so the Navbar badge refetches. */
export const REGISTRATIONS_CHANGED_EVENT = 'club-registrations:changed';

export type RegistrationStatus = 'draft' | 'pending' | 'needs_info' | 'approved' | 'rejected';

export interface RegistrationDocument {
    id: string;
    kind: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
}

export interface DuplicateHint {
    clubId: string;
    name: string;
    city: string | null;
    postalCode: string | null;
}

export interface Registration {
    id: string;
    clubName: string;
    legalForm: string;
    registerCourt: string | null;
    registerNumber: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    websiteUrl: string | null;
    claimedRole: string;
    status: RegistrationStatus;
    reviewNote: string | null;
    slugSuggestion: string | null;
    clubId: string | null;
    clubSlug: string | null;
    submittedAt: string | null;
    createdAt: string;
    documents: RegistrationDocument[];
    applicant: { id: string; name: string; email: string } | null;
    duplicateHints: DuplicateHint[];
}

export const QUEUE_FILTERS = [
    { value: 'pending', label: 'Offen' },
    { value: 'needs_info', label: 'Rückfrage' },
    { value: 'approved', label: 'Freigegeben' },
    { value: 'rejected', label: 'Abgelehnt' },
    { value: 'all', label: 'Alle' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
    draft: 'Entwurf',
    pending: 'Offen',
    needs_info: 'Rückfrage',
    approved: 'Freigegeben',
    rejected: 'Abgelehnt',
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    needs_info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-destructive/10 text-destructive',
};

export const LEGAL_FORM_LABELS: Record<string, string> = {
    e_v: 'Eingetragener Verein (e. V.)',
    nicht_eingetragen: 'Nicht eingetragener Verein',
    sonstige: 'Sonstige',
};

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
    registerauszug: 'Registerauszug',
    satzung: 'Satzung',
    freistellungsbescheid: 'Freistellungsbescheid',
    gruendungsprotokoll: 'Gründungsprotokoll',
    sonstiges: 'Sonstiges',
};

export function label(map: Record<string, string>, key: string): string {
    return map[key] ?? key;
}

export function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Backend error envelope: `{ error: { code, message } }` (see backend `AppError.toJSON`). */
export class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export async function toApiError(res: Response): Promise<ApiError> {
    let message = `Anfrage fehlgeschlagen (${res.status}).`;
    try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body?.error?.message) message = body.error.message;
    } catch {
        // non-JSON body: keep the generic message
    }
    return new ApiError(res.status, message);
}

/** Browser-side call against the admin review API; throws `ApiError` on a non-2xx response. */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${backendUrl}/admin/club-registrations${path}`, {
        ...init,
        credentials: 'include',
        headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
    if (!res.ok) throw await toApiError(res);
    return res;
}

/** Server-side call (server components): forwards the admin's cookie, never cached. */
export async function adminFetchServer<T>(path: string, cookie: string): Promise<{ data: T | null; status: number; error: string | null }> {
    try {
        const res = await fetch(`${backendUrl}/admin/club-registrations${path}`, { headers: { cookie }, cache: 'no-store' });
        if (!res.ok) {
            const err = await toApiError(res);
            return { data: null, status: res.status, error: err.message };
        }
        const body = (await res.json()) as { data: T };
        return { data: body.data, status: res.status, error: null };
    } catch (err) {
        console.error('[club-registrations] backend request failed', err);
        return { data: null, status: 0, error: 'Das Backend ist nicht erreichbar.' };
    }
}
