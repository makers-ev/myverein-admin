'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

import { adminJson } from '@/lib/adminApi';
import type { DpaVersion, Subprocessor } from '@/lib/dpa';

const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

/** Create a draft (no `version`) or edit/delete/publish an existing draft. Published versions never reach this form. */
export function DpaForm({ version, totalClubs }: { version?: DpaVersion; totalClubs?: number }) {
    const router = useRouter();
    const [title, setTitle] = useState(version?.title ?? '');
    const [body, setBody] = useState(version?.body ?? '');
    const [tomAnnex, setTomAnnex] = useState(version?.tomAnnex ?? '');
    const [requiredFrom, setRequiredFrom] = useState(version?.requiredFrom?.slice(0, 10) ?? '');
    const [subs, setSubs] = useState<Subprocessor[]>(version?.subprocessors ?? []);
    const [busy, setBusy] = useState<'save' | 'delete' | 'publish' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    function updateSub(i: number, key: keyof Subprocessor, value: string) {
        setSubs((list) => list.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
    }

    function payload() {
        return {
            title,
            body,
            subprocessors: subs,
            tomAnnex: tomAnnex.trim() ? tomAnnex : null,
            requiredFrom: requiredFrom || null,
        };
    }

    async function run(kind: 'save' | 'delete' | 'publish', action: () => Promise<void>) {
        setBusy(kind);
        setError(null);
        setNotice(null);
        try {
            await action();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.');
        } finally {
            setBusy(null);
        }
    }

    const save = () =>
        run('save', async () => {
            if (version) {
                await adminJson(`/admin/dpa-versions/${version.id}`, 'PATCH', payload());
                setNotice('Entwurf gespeichert.');
                router.refresh();
            } else {
                const res = await adminJson<{ data: DpaVersion }>('/admin/dpa-versions', 'POST', payload());
                router.push(res ? `/dpa/${res.data.id}` : '/dpa');
            }
        });

    const remove = () =>
        run('delete', async () => {
            if (!version || !confirm(`Entwurf v${version.version} endgültig löschen?`)) return;
            await adminJson(`/admin/dpa-versions/${version.id}`, 'DELETE');
            router.push('/dpa');
            router.refresh();
        });

    const publish = () =>
        run('publish', async () => {
            if (!version) return;
            const ok = confirm(
                `Version ${version.version} veröffentlichen?\n\nSie ist danach unveränderlich und gilt sofort für alle ${totalClubs ?? ''} Vereine. Die Owner werden benachrichtigt. Fehler lassen sich nur durch eine neue Version korrigieren.`,
            );
            if (!ok) return;
            // Persist the form state first so exactly what is on screen gets published.
            await adminJson(`/admin/dpa-versions/${version.id}`, 'PATCH', payload());
            await adminJson(`/admin/dpa-versions/${version.id}/publish`, 'POST');
            router.refresh();
        });

    const disabled = busy !== null;

    return (
        <form
            className="mt-6 space-y-6"
            onSubmit={(e) => {
                e.preventDefault();
                void save();
            }}
        >
            <div>
                <label htmlFor="dpa-title" className="text-sm font-medium text-foreground">
                    Titel
                </label>
                <input id="dpa-title" className={`${inputClass} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={200} required />
            </div>

            <div>
                <label htmlFor="dpa-body" className="text-sm font-medium text-foreground">
                    Vertragstext
                </label>
                <textarea id="dpa-body" className={`${inputClass} mt-1 min-h-64 font-mono`} value={body} onChange={(e) => setBody(e.target.value)} minLength={20} required />
            </div>

            <fieldset>
                <legend className="text-sm font-medium text-foreground">Unterauftragsverarbeiter</legend>
                <div className="mt-2 space-y-3">
                    {subs.length === 0 && <p className="text-sm text-muted-foreground">Keine eingetragen.</p>}
                    {subs.map((s, i) => (
                        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                            <input aria-label="Name" placeholder="Name" className={inputClass} value={s.name} onChange={(e) => updateSub(i, 'name', e.target.value)} maxLength={200} required />
                            <input aria-label="Zweck" placeholder="Zweck" className={inputClass} value={s.purpose} onChange={(e) => updateSub(i, 'purpose', e.target.value)} maxLength={300} required />
                            <input aria-label="Standort" placeholder="Standort" className={inputClass} value={s.location} onChange={(e) => updateSub(i, 'location', e.target.value)} maxLength={200} required />
                            <button
                                type="button"
                                aria-label="Eintrag entfernen"
                                onClick={() => setSubs((list) => list.filter((_, idx) => idx !== i))}
                                className="rounded-md border border-border px-2.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                    {subs.length < 50 && (
                        <button
                            type="button"
                            onClick={() => setSubs((list) => [...list, { name: '', purpose: '', location: '' }])}
                            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            <Plus size={14} />
                            Unterauftragsverarbeiter hinzufügen
                        </button>
                    )}
                </div>
            </fieldset>

            <div>
                <label htmlFor="dpa-tom" className="text-sm font-medium text-foreground">
                    Anlage: Technische und organisatorische Maßnahmen (optional)
                </label>
                <textarea id="dpa-tom" className={`${inputClass} mt-1 min-h-40 font-mono`} value={tomAnnex} onChange={(e) => setTomAnnex(e.target.value)} />
            </div>

            <div>
                <label htmlFor="dpa-from" className="text-sm font-medium text-foreground">
                    Verbindlich ab (optional)
                </label>
                <input id="dpa-from" type="date" className={`${inputClass} mt-1 max-w-48`} value={requiredFrom} onChange={(e) => setRequiredFrom(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Ab diesem Tag läuft die Schonfrist. Leer = Tag der Veröffentlichung.</p>
            </div>

            {error && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            )}
            {notice && (
                <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                    {notice}
                </p>
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={disabled}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-colors disabled:opacity-50"
                >
                    {busy === 'save' ? 'Speichere …' : version ? 'Entwurf speichern' : 'Entwurf anlegen'}
                </button>
                {version && (
                    <>
                        <button
                            type="button"
                            onClick={() => void publish()}
                            disabled={disabled}
                            className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                        >
                            {busy === 'publish' ? 'Veröffentliche …' : 'Veröffentlichen'}
                        </button>
                        <button
                            type="button"
                            onClick={() => void remove()}
                            disabled={disabled}
                            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                            {busy === 'delete' ? 'Lösche …' : 'Entwurf löschen'}
                        </button>
                    </>
                )}
            </div>
        </form>
    );
}
