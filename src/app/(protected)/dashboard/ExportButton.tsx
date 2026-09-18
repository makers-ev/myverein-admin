'use client';

import { Download } from 'lucide-react';

interface ActivitySummaryMetric {
    value: number;
    changePercent: number | null;
}

interface ExportButtonProps {
    interval: string;
    period: string;
    accounts: { total: number; admins: number; banned: number };
    activity: {
        chart: { date: string; newUsers: number; activeUsers: number; retained: number; reactivated: number }[];
        summary: {
            newUsers: ActivitySummaryMetric;
            activeUsers: ActivitySummaryMetric;
            retained: ActivitySummaryMetric;
            reactivated: ActivitySummaryMetric;
        };
    } | null;
}

function csvEscape(value: string | number): string {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: (string | number)[]): string {
    return cells.map(csvEscape).join(',') + '\n';
}

/**
 * Client-side CSV generation + download -- no export endpoint needed, the
 * dashboard already has every number this produces (fetched server-side,
 * passed down as props). Blob + object URL + a clicked anchor is the
 * standard no-dependency browser download pattern.
 */
export function ExportButton({ interval, period, accounts, activity }: ExportButtonProps) {
    function handleExport() {
        const generatedAt = new Date().toISOString();
        let csv = '';

        csv += csvRow(['Admin Dashboard Export']);
        csv += csvRow(['Generated at', generatedAt]);
        csv += csvRow(['Interval', interval]);
        csv += csvRow(['Period', period]);
        csv += '\n';

        csv += csvRow(['Accounts']);
        csv += csvRow(['Metric', 'Value']);
        csv += csvRow(['Total users', accounts.total]);
        csv += csvRow(['Admins', accounts.admins]);
        csv += csvRow(['Banned', accounts.banned]);
        csv += '\n';

        if (activity) {
            csv += csvRow(['Users (current period vs. previous period)']);
            csv += csvRow(['Metric', 'Value', 'Change %']);
            csv += csvRow(['Active Users', activity.summary.activeUsers.value, activity.summary.activeUsers.changePercent ?? '']);
            csv += csvRow(['New Users', activity.summary.newUsers.value, activity.summary.newUsers.changePercent ?? '']);
            csv += csvRow(['Retained', activity.summary.retained.value, activity.summary.retained.changePercent ?? '']);
            csv += csvRow(['Reactivated', activity.summary.reactivated.value, activity.summary.reactivated.changePercent ?? '']);
            csv += '\n';

            csv += csvRow(['Activity by bucket']);
            csv += csvRow(['Date', 'New Users', 'Active Users', 'Retained', 'Reactivated']);
            for (const bucket of activity.chart) {
                csv += csvRow([bucket.date, bucket.newUsers, bucket.activeUsers, bucket.retained, bucket.reactivated]);
            }
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-dashboard-${interval}-${period}-${generatedAt.slice(0, 19).replace(/[:T]/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
            <Download size={15} />
            Export CSV
        </button>
    );
}
