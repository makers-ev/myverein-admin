'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';

import { backendUrl } from '@/lib/auth-client';
import { toApiError } from '@/lib/clubRegistrations';

export function RetryJobButton({ id, type }: { id: string; type: string }) {
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleRetry() {
        if (!confirm(`Dead Job "${type}" erneut einplanen?`)) return;
        setIsBusy(true);
        setError(null);
        try {
            const res = await fetch(`${backendUrl}/admin/jobs/${id}/retry`, { method: 'POST', credentials: 'include' });
            if (!res.ok) throw await toApiError(res);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erneutes Einplanen fehlgeschlagen.');
            // 409 (already not dead) -> refresh to show the current state
            router.refresh();
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={() => void handleRetry()}
                disabled={isBusy}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
                <RotateCcw size={13} />
                {isBusy ? 'Plane ein …' : 'Erneut einplanen'}
            </button>
            {error && (
                <span role="alert" className="text-xs text-destructive">
                    {error}
                </span>
            )}
        </div>
    );
}
