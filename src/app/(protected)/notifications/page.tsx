import { headers } from 'next/headers';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';

import { authClient, backendUrl } from '@/lib/auth-client';
import { DeleteNotificationButton } from './DeleteNotificationButton';

interface NotificationRow {
    id: string;
    targetUserId: string | null;
    targetUserEmail: string | null;
    translations: Record<string, { title: string; body: string }>;
    deletable: boolean;
    createdAt: string;
}

/** This app's own `GET /admin/notifications` (see _template_better-auth-backend) -- not a Better Auth plugin endpoint, so a plain `authClient.$fetch` call, same cookie-forwarding as the dashboard's activity stats. */
async function getNotifications(cookie: string) {
    const { data, error } = await authClient.$fetch<{ data: NotificationRow[] }>(`${backendUrl}/admin/notifications`, {
        headers: { cookie },
    });
    if (error) {
        console.error('[notifications] GET /admin/notifications failed', error);
        return [];
    }
    return data?.data ?? [];
}

export default async function NotificationsPage() {
    const incomingHeaders = await headers();
    const notifications = await getNotifications(incomingHeaders.get('cookie') ?? '');

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{notifications.length} total</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/notifications/templates"
                        className="flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                        <FileText size={16} />
                        Message templates
                    </Link>
                    <Link
                        href="/notifications/new"
                        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-colors"
                    >
                        <Plus size={16} />
                        New notification
                    </Link>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Target</th>
                            <th className="px-4 py-3 font-medium">Title (DE)</th>
                            <th className="px-4 py-3 font-medium">Deletable</th>
                            <th className="px-4 py-3 font-medium">Created</th>
                            <th className="px-4 py-3 font-medium" />
                        </tr>
                    </thead>
                    <tbody>
                        {notifications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    No notifications yet.
                                </td>
                            </tr>
                        ) : (
                            notifications.map((n) => {
                                const title = n.translations?.de?.title ?? n.translations?.en?.title ?? '';
                                return (
                                    <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                        <td className="px-4 py-3 text-muted-foreground">{n.targetUserEmail ?? 'Everyone'}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">{title}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    n.deletable ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                                                }`}
                                            >
                                                {n.deletable ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(n.createdAt).toLocaleDateString('de-DE', { timeZone: 'UTC' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DeleteNotificationButton id={n.id} title={title} />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
