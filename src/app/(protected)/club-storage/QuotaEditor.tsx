'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { adminJson } from '@/lib/adminApi';
import { type QuotaUnit, formatBytes, parseQuota } from '@/lib/clubStorage';

/** Sets or resets (back to the default) the storage quota of one club; the backend writes the audit entry. */
export function QuotaEditor({ clubId, clubName, quotaBytes, customQuota, defaultQuotaBytes }: { clubId: string; clubName: string; quotaBytes: number; customQuota: boolean; defaultQuotaBytes: number }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    const [unit, setUnit] = useState<QuotaUnit>('GB');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save(quota: number | null) {
        setBusy(true);
        setError(null);
        try {
            await adminJson(`/admin/club-storage/${encodeURIComponent(clubId)}`, 'PATCH', { quotaBytes: quota });
            setOpen(false);
            setValue('');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Das Kontingent konnte nicht gespeichert werden.');
        } finally {
            setBusy(false);
        }
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        const bytes = parseQuota(value, unit);
        if (bytes === null) {
            setError('Bitte eine Zahl größer 0 eingeben (höchstens 1 TB).');
            return;
        }
        void save(bytes);
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} aria-label={`Kontingent von ${clubName} ändern`} className="whitespace-nowrap rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                Ändern
            </button>
        );
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    inputMode="decimal"
                    autoFocus
                    placeholder={formatBytes(quotaBytes)}
                    aria-label={`Neues Kontingent für ${clubName}`}
                    className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select value={unit} onChange={(e) => setUnit(e.target.value as QuotaUnit)} aria-label="Einheit" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                </select>
            </div>
            <div className="flex gap-1.5">
                <button type="submit" disabled={busy} className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                    Speichern
                </button>
                {customQuota && (
                    <button type="button" disabled={busy} onClick={() => void save(null)} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50">
                        Standard ({formatBytes(defaultQuotaBytes)})
                    </button>
                )}
                <button type="button" disabled={busy} onClick={() => { setOpen(false); setError(null); }} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                    Abbrechen
                </button>
            </div>
            {error && (
                <span role="alert" className="text-xs text-destructive">
                    {error}
                </span>
            )}
        </form>
    );
}
