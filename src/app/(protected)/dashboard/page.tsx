import { headers } from 'next/headers';
import { Ban, Repeat, Shield, UserCheck, UserPlus, Users } from 'lucide-react';

import { authClient, backendUrl } from '@/lib/auth-client';
import { BarChart, type BarChartDatum } from '@/components/BarChart';
import { DashboardFilters } from './DashboardFilters';
import { ExportButton } from './ExportButton';

interface ActivitySummaryMetric {
    value: number;
    changePercent: number | null;
}

interface ActivityStatsResponse {
    interval: 'day' | 'week';
    period: string;
    chart: { date: string; newUsers: number; activeUsers: number; retained: number; reactivated: number }[];
    summary: {
        newUsers: ActivitySummaryMetric;
        activeUsers: ActivitySummaryMetric;
        retained: ActivitySummaryMetric;
        reactivated: ActivitySummaryMetric;
    };
}

/** Structural facts (not time-windowed) via the existing admin.listUsers filter API -- see the dashboard's previous version. */
async function getAccountCounts(fetchOptions: { headers: Record<string, string> }) {
    const [total, admins, banned] = await Promise.all([
        authClient.admin.listUsers({ query: { limit: 1 }, fetchOptions }),
        authClient.admin.listUsers({
            query: { limit: 1, filterField: 'role', filterValue: 'admin', filterOperator: 'eq' },
            fetchOptions,
        }),
        authClient.admin.listUsers({
            query: { limit: 1, filterField: 'banned', filterValue: true, filterOperator: 'eq' },
            fetchOptions,
        }),
    ]);

    return {
        total: total.data?.total ?? 0,
        admins: admins.data?.total ?? 0,
        banned: banned.data?.total ?? 0,
    };
}

/** This app's own `GET /admin/activity-stats` (see _template_better-auth-backend) -- not a Better Auth plugin endpoint, so a plain `authClient.$fetch` call against the backend, same cookie-forwarding as everywhere else server-side in this app. */
async function getActivityStats(interval: string, period: string, cookie: string) {
    const { data, error } = await authClient.$fetch<ActivityStatsResponse>(
        `${backendUrl}/admin/activity-stats?interval=${interval}&period=${period}`,
        { headers: { cookie } },
    );
    // `$fetch` resolves to { data: null, error } on a non-2xx response
    // rather than throwing -- without this log, a real 401/403/500 here was
    // indistinguishable from "genuinely no data yet" (both render the same
    // "Could not load activity stats" fallback below), with zero trace of
    // which one actually happened.
    if (error) {
        console.error('[dashboard] GET /admin/activity-stats failed', error);
    }
    return data;
}

function DeltaBadge({ changePercent }: { changePercent: number | null }) {
    if (changePercent === null) return null;
    const isPositive = changePercent >= 0;
    return (
        <span className={`text-xs font-semibold ${isPositive ? 'text-chart-new' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}
            {changePercent}%
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    changePercent,
}: {
    icon: typeof Users;
    label: string;
    value: number;
    changePercent?: number | null;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                {changePercent !== undefined && <DeltaBadge changePercent={changePercent} />}
            </div>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
        </div>
    );
}

const CHART_SERIES = [
    { key: 'newUsers', label: 'New Users', fillClass: 'fill-chart-new', bgClass: 'bg-chart-new' },
    { key: 'retained', label: 'Retained', fillClass: 'fill-chart-retained', bgClass: 'bg-chart-retained' },
    { key: 'reactivated', label: 'Reactivated', fillClass: 'fill-chart-reactivated', bgClass: 'bg-chart-reactivated' },
];

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ interval?: string; period?: string }>;
}) {
    const { interval = 'day', period = '30d' } = await searchParams;
    const incomingHeaders = await headers();
    const cookie = incomingHeaders.get('cookie') ?? '';

    const [accounts, activity] = await Promise.all([
        getAccountCounts({ headers: { cookie } }),
        getActivityStats(interval, period, cookie),
    ]);

    const chartData: BarChartDatum[] =
        activity?.chart.map((bucket) => ({
            label: bucket.date.slice(5), // MM-DD (or week start), drop the year -- consistent width regardless of interval
            values: { newUsers: bucket.newUsers, retained: bucket.retained, reactivated: bucket.reactivated },
        })) ?? [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">User analytics and account overview.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <DashboardFilters />
                    <ExportButton interval={interval} period={period} accounts={accounts} activity={activity} />
                </div>
            </div>

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Accounts</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard icon={Users} label="Total users" value={accounts.total} />
                <StatCard icon={Shield} label="Admins" value={accounts.admins} />
                <StatCard icon={Ban} label="Banned" value={accounts.banned} />
            </div>

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Users</h2>
            {activity ? (
                <>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            icon={UserCheck}
                            label="Active Users"
                            value={activity.summary.activeUsers.value}
                            changePercent={activity.summary.activeUsers.changePercent}
                        />
                        <StatCard
                            icon={UserPlus}
                            label="New Users"
                            value={activity.summary.newUsers.value}
                            changePercent={activity.summary.newUsers.changePercent}
                        />
                        <StatCard
                            icon={Users}
                            label="Retained"
                            value={activity.summary.retained.value}
                            changePercent={activity.summary.retained.changePercent}
                        />
                        <StatCard
                            icon={Repeat}
                            label="Reactivated"
                            value={activity.summary.reactivated.value}
                            changePercent={activity.summary.reactivated.changePercent}
                        />
                    </div>

                    <div className="mt-6 rounded-xl border border-border bg-card p-6">
                        <h3 className="text-sm font-semibold text-foreground">User Activity</h3>
                        <p className="text-xs text-muted-foreground">
                            {interval === 'day' ? 'Daily' : 'Weekly'} breakdown of user cohorts, {period === '7d' ? 'last 7 days' : period === '90d' ? 'last 90 days' : 'last 30 days'}
                        </p>
                        <div className="mt-4">
                            <BarChart data={chartData} series={CHART_SERIES} nonce={incomingHeaders.get('x-nonce') ?? ''} />
                        </div>
                    </div>
                </>
            ) : (
                <p className="mt-3 text-sm text-destructive">Could not load activity stats.</p>
            )}
        </div>
    );
}
