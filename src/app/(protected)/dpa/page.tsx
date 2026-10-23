import { headers } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Pager } from '@/components/Pager';
import { adminGetServer } from '@/lib/adminApi';
import { ACCEPTANCE_PAGE_SIZE, formatDay, type DpaAcceptanceList, type DpaVersionList } from '@/lib/dpa';

export const dynamic = 'force-dynamic';

const STATE_FILTERS = [
    { value: '', label: 'Alle' },
    { value: 'accepted', label: 'Akzeptiert' },
    { value: 'missing', label: 'Fehlt' },
] as const;

export default async function DpaPage({ searchParams }: { searchParams: Promise<{ versionId?: string; state?: string; page?: string }> }) {
    const { versionId, state, page } = await searchParams;
    const pageNum = Math.max(1, Number(page) || 1);
    const activeState = STATE_FILTERS.find((f) => f.value === state)?.value ?? '';
    const cookie = (await headers()).get('cookie') ?? '';

    const versions = await adminGetServer<DpaVersionList>('/admin/dpa-versions', cookie);
    const published = (versions.body?.data ?? []).filter((v) => v.status === 'published');
    // Only a known published version id is forwarded; otherwise the backend picks the current one.
    const selected = published.find((v) => v.id === versionId)?.id;
    const query = new URLSearchParams({ page: String(pageNum), pageSize: String(ACCEPTANCE_PAGE_SIZE) });
    if (selected) query.set('versionId', selected);
    if (activeState) query.set('state', activeState);
    const acceptances = await adminGetServer<DpaAcceptanceList>(`/admin/dpa-acceptances?${query}`, cookie);

    const filterHref = (over: { versionId?: string; state?: string; page?: number }) => {
        const q = new URLSearchParams();
        const v = over.versionId ?? selected;
        const s = over.state ?? activeState;
        if (v) q.set('versionId', v);
        if (s) q.set('state', s);
        if (over.page && over.page > 1) q.set('page', String(over.page));
        const str = q.toString();
        return str ? `/dpa?${str}` : '/dpa';
    };
    const pill = (active: boolean) =>
        `rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
        }`;
    const gate = versions.body?.gate ?? acceptances.body?.gate;
    const shownVersion = acceptances.body?.version;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">AV-Verträge</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Versionen des Auftragsverarbeitungsvertrags. Veröffentlichte Versionen sind unveränderlich, Änderungen erfordern eine neue Version.
                    </p>
                </div>
                <Link
                    href="/dpa/new"
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-colors"
                >
                    <Plus size={16} />
                    Neuer Entwurf
                </Link>
            </div>

            {gate && (
                <p role="status" className="mt-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    {gate.required
                        ? `Sperre aktiv: Vereine ohne Annahme der aktuellen Version werden nach ${gate.graceDays} Tagen Schonfrist für Schreibaktionen gesperrt.`
                        : 'Sperre nicht aktiv: Die Annahme wird angezeigt, blockiert aber keine Aktionen.'}
                </p>
            )}

            {versions.error && (
                <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Versionen konnten nicht geladen werden: {versions.error}
                </p>
            )}

            <h2 className="mt-8 text-lg font-semibold text-foreground">Versionen</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Version</th>
                            <th className="px-4 py-3 font-medium">Titel</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Verbindlich ab</th>
                            <th className="px-4 py-3 font-medium">Veröffentlicht</th>
                            <th className="px-4 py-3 text-right font-medium">Angenommen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(versions.body?.data ?? []).length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                    {versions.error ? 'Keine Daten.' : 'Noch keine Version angelegt.'}
                                </td>
                            </tr>
                        ) : (
                            versions.body!.data.map((v) => (
                                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <td className="px-4 py-3 tabular-nums text-foreground">v{v.version}</td>
                                    <td className="px-4 py-3">
                                        <Link href={`/dpa/${v.id}`} className="font-medium text-foreground hover:text-primary">
                                            {v.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                v.status === 'published' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            }`}
                                        >
                                            {v.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDay(v.requiredFrom)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDay(v.publishedAt)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                        {v.status === 'published' ? `${v.acceptedClubs} / ${versions.body!.totalClubs}` : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <h2 className="mt-8 text-lg font-semibold text-foreground">
                Annahme durch die Vereine{shownVersion ? ` (Version ${shownVersion.version})` : ''}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
                {STATE_FILTERS.map((f) => (
                    <Link key={f.value} href={filterHref({ state: f.value })} className={pill(activeState === f.value)}>
                        {f.label}
                    </Link>
                ))}
                {published.length > 1 && (
                    <span className="ml-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Version:
                        {published.map((v) => (
                            <Link key={v.id} href={filterHref({ versionId: v.id })} className={pill(shownVersion?.id === v.id)}>
                                v{v.version}
                            </Link>
                        ))}
                    </span>
                )}
            </div>

            {acceptances.error && (
                <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Annahmen konnten nicht geladen werden: {acceptances.error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Verein</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Angenommen am</th>
                            <th className="px-4 py-3 font-medium">Unterzeichner</th>
                            <th className="px-4 py-3 font-medium">Frist</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(acceptances.body?.data ?? []).length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    {acceptances.error
                                        ? 'Keine Daten.'
                                        : acceptances.body?.version
                                          ? 'Keine Vereine in dieser Ansicht.'
                                          : 'Noch keine veröffentlichte Version.'}
                                </td>
                            </tr>
                        ) : (
                            acceptances.body!.data.map((a) => (
                                <tr key={a.clubId} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <td className="px-4 py-3 font-medium text-foreground">{a.clubName}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                a.accepted ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : a.blocked ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            }`}
                                        >
                                            {a.accepted ? 'Akzeptiert' : a.blocked ? 'Fehlt, gesperrt' : 'Fehlt'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDay(a.acceptedAt)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{a.signerName ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {a.accepted || !a.deadline
                                            ? '—'
                                            : `${formatDay(a.deadline)}${a.daysLeft !== null ? ` (${a.daysLeft >= 0 ? `noch ${a.daysLeft} Tage` : 'abgelaufen'})` : ''}`}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {acceptances.body && (
                <Pager page={pageNum} pageSize={ACCEPTANCE_PAGE_SIZE} total={acceptances.body.total} hrefFor={(p) => filterHref({ page: p })} />
            )}
        </div>
    );
}
