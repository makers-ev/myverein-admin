'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const ROLES = [
    { value: 'all', label: 'All roles' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
] as const;

/**
 * Sibling to SearchBar, same URL-query-param pattern -- only touches its own
 * `role` key and preserves whatever SearchBar/pagination already set.
 *
 * Role-only, not also a status/banned filter: `admin.listUsers`'s filter API
 * takes a single `filterField` -- there's no way to apply two structured
 * filters (role AND banned) in one request without either double-fetching
 * and intersecting client-side (breaks pagination/totals) or a second
 * backend endpoint. Not worth that for a feature that wasn't asked for; the
 * existing "Banned" badge in the table already makes banned users visible
 * at a glance.
 */
export function UserFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role') ?? 'all';

    function updateParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams);
        if (value === 'all') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.delete('page');
        router.push(`/users?${params.toString()}`);
    }

    return (
        <select
            value={role}
            onChange={(e) => updateParam('role', e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
            {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                    {r.label}
                </option>
            ))}
        </select>
    );
}
