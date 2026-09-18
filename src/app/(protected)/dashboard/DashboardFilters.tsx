'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const INTERVALS = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
] as const;

const PERIODS = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
] as const;

export function DashboardFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const interval = searchParams.get('interval') ?? 'day';
    const period = searchParams.get('period') ?? '30d';

    function updateParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);
        router.push(`/dashboard?${params.toString()}`);
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Interval
                <select
                    value={interval}
                    onChange={(e) => updateParam('interval', e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    {INTERVALS.map((i) => (
                        <option key={i.value} value={i.value}>
                            {i.label}
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Period
                <select
                    value={period}
                    onChange={(e) => updateParam('period', e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
