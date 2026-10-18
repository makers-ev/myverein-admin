import { backendUrl } from '@/lib/auth-client';

/**
 * Shapes for the backend's job-queue admin API (`GET /admin/jobs/stats`,
 * `POST /admin/jobs/:id/retry`, see myverein-backend `src/routes/admin-jobs.ts`).
 * `lastError` is already scrubbed by the backend (no addresses/tokens).
 */

export type JobCounts = { queued: number; running: number; done: number; failed: number; dead: number };

export interface JobTypeStats extends JobCounts {
    type: string;
    total: number;
}

export interface JobRow {
    id: string;
    type: string;
    status: string;
    runAt: string;
    overdueSeconds: number;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    finishedAt: string | null;
    createdAt: string;
}

export interface QueueStats {
    generatedAt: string;
    totals: JobCounts;
    types: JobTypeStats[];
    oldestDue: JobRow[];
    dead: JobRow[];
}

/** Server-side call (server component): forwards the admin's cookie, never cached. */
export async function fetchQueueStats(cookie: string): Promise<{ data: QueueStats | null; error: string | null }> {
    try {
        const res = await fetch(`${backendUrl}/admin/jobs/stats`, { headers: { cookie }, cache: 'no-store' });
        if (!res.ok) {
            let message = `Anfrage fehlgeschlagen (${res.status}).`;
            try {
                const body = (await res.json()) as { error?: { message?: string } };
                if (body?.error?.message) message = body.error.message;
            } catch {
                // non-JSON body: keep the generic message
            }
            return { data: null, error: message };
        }
        const body = (await res.json()) as { data: QueueStats };
        return { data: body.data, error: null };
    } catch (err) {
        console.error('[queue] GET /admin/jobs/stats failed', err);
        return { data: null, error: 'Das Backend ist nicht erreichbar.' };
    }
}

export function formatOverdue(seconds: number): string {
    if (seconds < 60) return `${seconds} s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
    return `${Math.floor(seconds / 86400)} d`;
}
