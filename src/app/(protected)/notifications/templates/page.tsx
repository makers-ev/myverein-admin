import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { authClient, backendUrl } from '@/lib/auth-client';
import { TemplateEditor } from './TemplateEditor';

export interface TemplateRow {
    translationKey: string;
    translations: Record<string, { title: string; body: string }> | null;
    updatedAt: string | null;
}

/** This app's own `GET /admin/notification-templates` (see _template_better-auth-backend) -- not a Better Auth plugin endpoint, so a plain `authClient.$fetch` call, same cookie-forwarding as the rest of this app's server components. */
async function getTemplates(cookie: string) {
    const { data, error } = await authClient.$fetch<{ data: TemplateRow[] }>(`${backendUrl}/admin/notification-templates`, {
        headers: { cookie },
    });
    if (error) {
        console.error('[notification-templates] GET /admin/notification-templates failed', error);
        return [];
    }
    return data?.data ?? [];
}

export default async function NotificationTemplatesPage() {
    const incomingHeaders = await headers();
    const templates = await getTemplates(incomingHeaders.get('cookie') ?? '');

    return (
        <div className="max-w-2xl">
            <Link href="/notifications" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Back to notifications
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Message templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Override the text of an automated, code-triggered notification (e.g. the welcome message sent on signup).
                Leave a key untouched and it keeps using each app&apos;s built-in translation.
            </p>

            <div className="mt-6 space-y-4">
                {templates.map((template) => (
                    <TemplateEditor key={template.translationKey} template={template} />
                ))}
            </div>
        </div>
    );
}
