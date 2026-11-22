'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { adminJson } from '@/lib/adminApi';
import { MAX_MEMBER_LIMIT, MAX_NOTE_LENGTH, MAX_TIER_LENGTH, type ClubPlan, clubErrorText, parsePlanForm } from '@/lib/adminClubs';

const inputClass = 'min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

/** Maintains the plan data of a club (tier, validity, member limit, note). Data only: MyVerein does not bill. */
export function PlanEditor({ clubId, plan }: { clubId: string; plan: (ClubPlan & { note: string | null }) | null }) {
    const router = useRouter();
    const [tier, setTier] = useState(plan?.tier ?? '');
    const [validFrom, setValidFrom] = useState(plan?.validFrom?.slice(0, 10) ?? '');
    const [validUntil, setValidUntil] = useState(plan?.validUntil?.slice(0, 10) ?? '');
    const [limit, setLimit] = useState(plan?.memberLimit != null ? String(plan.memberLimit) : '');
    const [note, setNote] = useState(plan?.note ?? '');
    const [busy, setBusy] = useState(false);
    const inFlight = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);

    const edit = (set: (v: string) => void) => (e: { target: { value: string } }) => {
        set(e.target.value);
        setSaved(null);
    };

    async function run(action: () => Promise<unknown>, done: string, fallback: string) {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError(null);
        try {
            await action();
            setSaved(done);
            router.refresh();
        } catch (err) {
            setError(clubErrorText(err, fallback));
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (busy) return;
        setSaved(null);
        const parsed = parsePlanForm({ tier, validFrom, validUntil, memberLimit: limit, note });
        if (!parsed.ok) {
            setError(parsed.error);
            return;
        }
        void run(() => adminJson(`/admin/clubs/${encodeURIComponent(clubId)}/plan`, 'PUT', parsed.value), 'Gespeichert.', 'Der Tarif konnte nicht gespeichert werden.');
    }

    function onClear() {
        if (busy) return;
        void run(async () => {
            await adminJson(`/admin/clubs/${encodeURIComponent(clubId)}/plan`, 'DELETE');
            setTier('');
            setValidFrom('');
            setValidUntil('');
            setLimit('');
            setNote('');
        }, 'Tarif entfernt.', 'Der Tarif konnte nicht entfernt werden.');
    }

    return (
        <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
            <div>
                <label htmlFor="plan-tier" className="block text-sm font-medium text-foreground">Stufe</label>
                <input id="plan-tier" value={tier} onChange={edit(setTier)} maxLength={MAX_TIER_LENGTH} required aria-required="true" aria-describedby="plan-tier-hint" autoCapitalize="none" className={`mt-1 ${inputClass}`} />
                <p id="plan-tier-hint" className="mt-1 text-xs text-muted-foreground">Kleinbuchstaben, Ziffern, - und _ (z. B. standard)</p>
            </div>
            <div>
                <label htmlFor="plan-limit" className="block text-sm font-medium text-foreground">Mitgliederlimit</label>
                <input id="plan-limit" inputMode="numeric" value={limit} onChange={edit(setLimit)} maxLength={String(MAX_MEMBER_LIMIT).length} aria-describedby="plan-limit-hint" className={`mt-1 ${inputClass}`} />
                <p id="plan-limit-hint" className="mt-1 text-xs text-muted-foreground">Leer = kein Limit</p>
            </div>
            <div>
                <label htmlFor="plan-from" className="block text-sm font-medium text-foreground">Gültig ab</label>
                <input id="plan-from" type="date" value={validFrom} onChange={edit(setValidFrom)} className={`mt-1 ${inputClass}`} />
            </div>
            <div>
                <label htmlFor="plan-until" className="block text-sm font-medium text-foreground">Gültig bis</label>
                <input id="plan-until" type="date" value={validUntil} onChange={edit(setValidUntil)} aria-describedby="plan-until-hint" className={`mt-1 ${inputClass}`} />
                <p id="plan-until-hint" className="mt-1 text-xs text-muted-foreground">Leer = unbefristet</p>
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="plan-note" className="block text-sm font-medium text-foreground">Interne Notiz (optional)</label>
                <textarea id="plan-note" value={note} onChange={edit(setNote)} rows={2} maxLength={MAX_NOTE_LENGTH} className={`mt-1 ${inputClass}`} />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                    {busy ? 'Bitte warten …' : 'Tarif speichern'}
                </button>
                {plan && (
                    <button type="button" onClick={onClear} disabled={busy} className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50">
                        Tarif entfernen
                    </button>
                )}
                {saved && <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{saved}</span>}
                {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
            </div>
        </form>
    );
}
