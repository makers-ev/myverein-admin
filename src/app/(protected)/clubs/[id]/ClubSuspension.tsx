'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Dialog } from '@/components/Dialog';
import { adminJson } from '@/lib/adminApi';
import { MAX_NOTE_LENGTH, MAX_SUSPEND_REASON, type ClubStatus, clubErrorText, isStateConflict, validateReason } from '@/lib/adminClubs';

const inputClass = 'min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

/** Suspend / lift the suspension of one club. The reason is mandatory and ends up in the audit log (written by the backend). */
export function ClubSuspension({ clubId, clubName, status }: { clubId: string; clubName: string; status: ClubStatus }) {
    const router = useRouter();
    const suspended = status === 'suspended';
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function close() {
        setOpen(false);
        setReason('');
        setNote('');
        setError(null);
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (busy) return;
        const problem = validateReason(reason);
        if (problem) {
            setError(problem);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await adminJson(`/admin/clubs/${encodeURIComponent(clubId)}/${suspended ? 'unsuspend' : 'suspend'}`, 'POST', suspended ? { reason: reason.trim() } : { reason: reason.trim(), ...(note.trim() ? { note: note.trim() } : {}) });
            close();
            router.refresh();
        } catch (err) {
            setError(clubErrorText(err, 'Die Aktion ist fehlgeschlagen. Bitte erneut versuchen.'));
            if (isStateConflict(err)) router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${suspended ? 'border border-border text-foreground hover:bg-muted' : 'bg-destructive text-white hover:opacity-90'}`}
            >
                {suspended ? 'Sperre aufheben' : 'Verein sperren'}
            </button>
            {open && (
                <Dialog title={suspended ? `Sperre für ${clubName} aufheben?` : `${clubName} sperren?`} onClose={close} busy={busy}>
                    <form onSubmit={onSubmit} noValidate>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {suspended
                                ? 'Mitglieder und Vorstand können den Verein danach wieder normal nutzen.'
                                : 'Solange der Verein gesperrt ist, kann niemand im Verein arbeiten. Mitglieder und Vorstand sehen einen Hinweis mit dem Kontakt zum Support. Die Daten bleiben erhalten.'}
                        </p>
                        <label htmlFor="club-reason" className="mt-4 block text-sm font-medium text-foreground">
                            Interner Grund (Pflicht)
                        </label>
                        <textarea
                            id="club-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            maxLength={MAX_SUSPEND_REASON}
                            required
                            aria-required="true"
                            aria-describedby="club-reason-hint"
                            aria-invalid={error ? true : undefined}
                            className={`mt-1 ${inputClass}`}
                        />
                        <p id="club-reason-hint" className="mt-1 text-xs text-muted-foreground">
                            Wird im Protokoll gespeichert, mindestens 10 Zeichen. Der Verein sieht ihn nicht. Keine Personendaten eintragen.
                        </p>
                        {!suspended && (
                            <>
                                <label htmlFor="club-note" className="mt-4 block text-sm font-medium text-foreground">
                                    Hinweis für Mitglieder (optional)
                                </label>
                                <textarea id="club-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={MAX_NOTE_LENGTH} aria-describedby="club-note-hint" className={`mt-1 ${inputClass}`} />
                                <p id="club-note-hint" className="mt-1 text-xs text-muted-foreground">Dieser Text erscheint in App und Website, z. B. „Bitte meldet euch beim Support.“</p>
                            </>
                        )}
                        {error && (
                            <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </p>
                        )}
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={close} disabled={busy} className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                                Abbrechen
                            </button>
                            <button type="submit" disabled={busy} className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50 ${suspended ? 'bg-primary text-primary-foreground' : 'bg-destructive text-white'}`}>
                                {busy ? 'Wird ausgeführt …' : suspended ? 'Sperre aufheben' : 'Jetzt sperren'}
                            </button>
                        </div>
                    </form>
                </Dialog>
            )}
        </>
    );
}
