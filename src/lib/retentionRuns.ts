/** Shape for the backend's `GET /admin/retention-runs` (read-only run log, counters only). */

export interface RetentionRun {
    id: string;
    clubId: string | null;
    clubName: string | null;
    category: string;
    dryRun: boolean;
    notice: boolean;
    scanned: number;
    affected: number;
    errors: number;
    errorCode: string | null;
    startedAt: string;
    finishedAt: string | null;
}

export interface RetentionRunList {
    data: RetentionRun[];
    page: number;
    pageSize: number;
    total: number;
    dryRun: boolean;
}

export const RUN_PAGE_SIZE = 50;

export const SCOPE_FILTERS = [
    { value: 'platform', label: 'Plattform' },
    { value: 'club', label: 'Vereine' },
    { value: 'all', label: 'Alle' },
] as const;
