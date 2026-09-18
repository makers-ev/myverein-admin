'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { authClient, backendUrl } from '@/lib/auth-client';

export function DeleteNotificationButton({ id, title }: { id: string; title: string }) {
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);

    async function handleDelete() {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        setIsBusy(true);
        const { error } = await authClient.$fetch(`${backendUrl}/admin/notifications/${id}`, { method: 'DELETE' });
        setIsBusy(false);
        if (error) {
            console.error('[notifications] DELETE /admin/notifications failed', error);
            alert(error.message ?? 'Unable to delete notification.');
            return;
        }
        router.refresh();
    }

    return (
        <button
            onClick={() => void handleDelete()}
            disabled={isBusy}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        >
            <Trash2 size={13} />
            Delete
        </button>
    );
}
