/**
 * Shapes and pure helpers for the backend's platform club API (`GET /admin/clubs`, `GET /admin/clubs/:id`,
 * `POST /admin/clubs/:id/suspend|unsuspend`, `PUT /admin/clubs/:id/plan`). The plan is data only, there is no billing.
 */

export type ClubStatus = 'active' | 'suspended';

export interface ClubPlan {
    tier: string;
    /** `YYYY-MM-DD` or `null`. */
    validFrom: string | null;
    /** `YYYY-MM-DD`, `null` = unlimited. */
    validUntil: string | null;
    /** `null` = no limit. */
    memberLimit: number | null;
}

export interface AdminClubRow {
    clubId: string;
    name: string;
    slug: string;
    createdAt: string;
    memberCount: number;
    accountCount: number;
    status: ClubStatus;
    suspendedAt: string | null;
    lastActivityAt: string | null;
    plan: ClubPlan | null;
    overMemberLimit: boolean;
    publicProfileEnabled: boolean;
    discoverable: boolean;
}

export interface AdminClubList {
    data: AdminClubRow[];
    page: number;
    pageSize: number;
    total: number;
}

export interface AdminClubDetail extends AdminClubRow {
    registration: { id: string; status: string; legalForm: string; registerCourt: string | null; registerNumber: string | null; city: string | null; submittedAt: string | null; reviewedAt: string | null } | null;
    registerCheck: { portalUrl: string; court: string | null; number: string | null } | null;
    suspension: { suspendedAt: string; reason: string; note: string | null; suspendedBy: { userId: string; name: string } | null } | null;
    statusHistory: Array<{ action: 'suspend' | 'unsuspend'; reason: string; note: string | null; actor: { userId: string; name: string } | null; createdAt: string }>;
    plan: (ClubPlan & { note: string | null; updatedAt: string }) | null;
    auditExcerpt: Array<{ eventType: string; createdAt: string }>;
}

export const CLUBS_PAGE_SIZE = 50;
export const MIN_SUSPEND_REASON = 10;
export const MAX_SUSPEND_REASON = 1000;
export const MAX_NOTE_LENGTH = 500;
export const MAX_TIER_LENGTH = 40;
export const MAX_MEMBER_LIMIT = 1_000_000;

export const STATUS_FILTERS = [
    { value: '', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
    { value: 'suspended', label: 'Gesperrt' },
] as const;

export const CLUB_STATUS_LABELS: Record<ClubStatus, string> = { active: 'Aktiv', suspended: 'Gesperrt' };

export const AUDIT_EVENT_LABELS: Record<string, string> = {
    'admin.club_suspend': 'Verein gesperrt',
    'admin.club_unsuspend': 'Sperre aufgehoben',
    'admin.club_plan_set': 'Tarif gesetzt',
    'admin.club_plan_clear': 'Tarif entfernt',
    'admin.club_storage_quota': 'Speicher-Kontingent geändert',
};

export const ACTION_LABELS = { suspend: 'Verein gesperrt', unsuspend: 'Sperre aufgehoben' } as const;

/** Fallback for the register portal link if the backend sends none. */
export const REGISTER_PORTAL_URL = 'https://www.handelsregister.de/rp_web/erweitertesuche.xhtml';

/** Texts for backend error codes (the backend message is never shown). */
export function clubErrorText(err: unknown, fallback: string): string {
    const e = err as { code?: string | null; detailsCode?: string | null; status?: number } | null;
    switch (e?.detailsCode) {
        case 'club_already_suspended': return 'Dieser Verein ist bereits gesperrt. Die Seite wird aktualisiert.';
        case 'club_not_suspended': return 'Dieser Verein ist nicht gesperrt. Die Seite wird aktualisiert.';
    }
    if (e?.status === 401 || e?.status === 403) return 'Dafür fehlt die Berechtigung. Bitte neu anmelden.';
    if (e?.status === 404) return 'Der Verein wurde nicht gefunden.';
    if (e?.status === 422) return 'Die Eingaben sind ungültig. Bitte prüfen.';
    if (e?.status === 429) return 'Zu viele Anfragen. Bitte kurz warten.';
    return fallback;
}

/** The two 409 conflicts mean the page is stale: refresh instead of leaving the admin stuck. */
export function isStateConflict(err: unknown): boolean {
    const c = (err as { detailsCode?: string | null } | null)?.detailsCode;
    return c === 'club_already_suspended' || c === 'club_not_suspended';
}

export function auditLabel(eventType: string): string {
    return AUDIT_EVENT_LABELS[eventType] ?? eventType;
}

export function formatDay(iso: string | null): string {
    if (!iso) return '–';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '–' : d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium' });
}

export function formatDateTime(iso: string | null): string {
    if (!iso) return '–';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '–' : d.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
}

/** True once a plan's end date lies before `now` (the day itself still counts as valid). */
export function planExpired(plan: ClubPlan | null, now: Date = new Date()): boolean {
    if (!plan?.validUntil) return false;
    const end = new Date(`${plan.validUntil.slice(0, 10)}T23:59:59.999Z`);
    return !Number.isNaN(end.getTime()) && end.getTime() < now.getTime();
}

export function validateReason(input: string): string | null {
    const reason = input.trim();
    if (reason.length < MIN_SUSPEND_REASON) return `Bitte einen Grund mit mindestens ${MIN_SUSPEND_REASON} Zeichen angeben.`;
    if (reason.length > MAX_SUSPEND_REASON) return `Der Grund darf höchstens ${MAX_SUSPEND_REASON} Zeichen lang sein.`;
    return null;
}

export type PlanInput = { tier: string; validFrom: string | null; validUntil: string | null; memberLimit: number | null; note: string | null };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Form strings to the plan payload, or an error message in German. */
export function parsePlanForm(f: { tier: string; validFrom: string; validUntil: string; memberLimit: string; note: string }): { ok: true; value: PlanInput } | { ok: false; error: string } {
    const tier = f.tier.trim();
    if (!/^[a-z0-9_-]{1,40}$/.test(tier)) return { ok: false, error: 'Die Stufe darf nur Kleinbuchstaben, Ziffern, Bindestrich und Unterstrich enthalten (höchstens 40 Zeichen).' };
    const from = f.validFrom.trim();
    const until = f.validUntil.trim();
    if ((from && !DAY.test(from)) || (until && !DAY.test(until))) return { ok: false, error: 'Bitte gültige Daten wählen.' };
    if (from && until && until < from) return { ok: false, error: '„Gültig bis“ darf nicht vor „Gültig ab“ liegen.' };
    const limitText = f.memberLimit.trim();
    let limit: number | null = null;
    if (limitText) {
        const n = Number(limitText);
        if (!Number.isInteger(n) || n < 1 || n > MAX_MEMBER_LIMIT) return { ok: false, error: `Das Mitgliederlimit muss eine ganze Zahl von 1 bis ${MAX_MEMBER_LIMIT.toLocaleString('de-DE')} sein.` };
        limit = n;
    }
    const note = f.note.trim();
    if (note.length > MAX_NOTE_LENGTH) return { ok: false, error: `Die Notiz darf höchstens ${MAX_NOTE_LENGTH} Zeichen lang sein.` };
    return { ok: true, value: { tier, validFrom: from || null, validUntil: until || null, memberLimit: limit, note: note || null } };
}

/** The `/clubs` URL for the given filters (empty values and page 1 are omitted). */
export function clubsHref(f: { q?: string; status?: string; page?: number }): string {
    const p = new URLSearchParams();
    if (f.q) p.set('q', f.q);
    if (f.status) p.set('status', f.status);
    if (f.page && f.page > 1) p.set('page', String(f.page));
    const s = p.toString();
    return s ? `/clubs?${s}` : '/clubs';
}
