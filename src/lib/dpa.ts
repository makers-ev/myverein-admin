/** Shapes for the backend's AV-Vertrag admin API (`/admin/dpa-versions`, `/admin/dpa-acceptances`). */

export interface Subprocessor {
    name: string;
    purpose: string;
    location: string;
}

export interface DpaVersion {
    id: string;
    version: number;
    title: string;
    body: string;
    subprocessors: Subprocessor[];
    tomAnnex: string | null;
    sha256: string;
    requiredFrom: string | null;
    publishedAt: string | null;
    publishedBy: string | null;
    createdAt: string;
    status: 'draft' | 'published';
    acceptedClubs: number;
}

export interface DpaVersionList {
    data: DpaVersion[];
    totalClubs: number;
    gate: { required: boolean; graceDays: number };
}

export interface DpaAcceptanceRow {
    clubId: string;
    clubName: string;
    accepted: boolean;
    acceptedAt: string | null;
    signerName: string | null;
    acceptedBy: string | null;
    deadline: string | null;
    daysLeft: number | null;
    blocked: boolean;
}

export interface DpaAcceptanceList {
    data: DpaAcceptanceRow[];
    page: number;
    pageSize: number;
    total: number;
    version: { id: string; version: number; publishedAt: string | null } | null;
    gate: { required: boolean; graceDays: number };
}

export const ACCEPTANCE_PAGE_SIZE = 25;

export function formatDay(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium' });
}
