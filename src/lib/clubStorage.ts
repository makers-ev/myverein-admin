/** Shapes and pure helpers for the backend's `GET/PATCH /admin/club-storage` (numbers only, never document content). */

export interface ClubStorageRow {
    clubId: string;
    name: string;
    slug: string;
    usedBytes: number;
    quotaBytes: number;
    customQuota: boolean;
    percent: number;
    overQuota: boolean;
}

export interface ClubStorageList {
    data: ClubStorageRow[];
    page: number;
    pageSize: number;
    total: number;
    defaultQuotaBytes: number;
}

export const STORAGE_PAGE_SIZE = 50;
/** Backend limit of a custom quota: 1 byte to 1 TiB. */
export const MAX_QUOTA_BYTES = 1024 ** 4;

export type QuotaUnit = 'MB' | 'GB';
const UNIT_BYTES: Record<QuotaUnit, number> = { MB: 1024 ** 2, GB: 1024 ** 3 };

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '–';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    const digits = unit === 0 ? 0 : value < 10 ? 1 : 0;
    return `${value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${units[unit]}`;
}

/** Quota input ("2,5" + unit) to bytes; `null` if it is not a positive number within the backend limit. */
export function parseQuota(input: string, unit: QuotaUnit): number | null {
    const value = Number(input.trim().replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) return null;
    const bytes = Math.round(value * UNIT_BYTES[unit]);
    return bytes >= 1 && bytes <= MAX_QUOTA_BYTES ? bytes : null;
}

export type UsageTone = 'ok' | 'warn' | 'over';
export function usageTone(row: Pick<ClubStorageRow, 'percent' | 'overQuota'>): UsageTone {
    return row.overQuota || row.percent >= 100 ? 'over' : row.percent >= 80 ? 'warn' : 'ok';
}
