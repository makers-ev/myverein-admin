import { headers } from 'next/headers';
import Link from 'next/link';

import { Pager } from '@/components/Pager';
import { adminGetServer } from '@/lib/adminApi';
import { formatDate } from '@/lib/clubRegistrations';
import { RUN_PAGE_SIZE, SCOPE_FILTERS, type RetentionRunList } from '@/lib/retentionRuns';

export const dynamic = 'force-dynamic';

export default async function RetentionRunsPage({ searchParams }: { searchParams: Promise<{ scope?: string; page?: string }> }) {
    const { scope, page } = await searchParams;
    const active = SCOPE_FILTERS.find((f) => f.value === scope)?.value ?? 'platform';
    const pageNum = Math.max(1, Number(page) || 1);
    const incomingHeaders = await headers();

    const { body, error } = await adminGetServer<RetentionRunList>(
        `/admin/retention-runs?scope=${active}&page=${pageNum}&pageSize=${RUN_PAGE_SIZE}`,
        incomingHeaders.get('cookie') ?? '',
    );
    const rows = body?.data ?? [];
    const hrefFor = (p: number) => `/retention-runs?scope=${active}&page=${p}`;

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Löschläufe</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Protokoll der automatischen Aufbewahrungsfristen. Nur Zähler, keine Personendaten. Schreibgeschützt.
            </p>

            {body?.dryRun && (
                <p role="status" className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    Probelauf aktiv: Es wird derzeit nichts wirklich gelöscht, die Läufe zählen nur die betroffenen Einträge.
                </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
                {SCOPE_FILTERS.map((f) => (
                    <Link
                        key={f.value}
                        href={`/retention-runs?scope=${f.value}`}
                        className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                            active === f.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                        {f.label}
                    </Link>
                ))}
            </div>

            {error && (
                <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Löschläufe konnten nicht geladen werden: {error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Gestartet</th>
                            <th className="px-4 py-3 font-medium">Bereich</th>
                            <th className="px-4 py-3 font-medium">Kategorie</th>
                            <th className="px-4 py-3 text-right font-medium">Geprüft</th>
                            <th className="px-4 py-3 text-right font-medium">Betroffen</th>
                            <th className="px-4 py-3 text-right font-medium">Fehler</th>
                            <th className="px-4 py-3 font-medium">Art</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    {error ? 'Keine Daten.' : 'Noch keine Läufe in dieser Ansicht.'}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id} className="border-b border-border last:border-0 align-top hover:bg-muted/40">
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.startedAt)}</td>
                                    <td className="px-4 py-3 text-foreground">{r.clubId ? (r.clubName ?? 'Verein') : 'Plattform'}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-foreground">{r.category}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{r.scanned}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.affected}</td>
                                    <td className={`px-4 py-3 text-right tabular-nums ${r.errors > 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                                        {r.errors}
                                        {r.errorCode && <span className="block font-mono text-xs font-normal">{r.errorCode}</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    r.dryRun ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                }`}
                                            >
                                                {r.dryRun ? 'Probelauf' : 'Echtlauf'}
                                            </span>
                                            {r.notice && (
                                                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                                                    Vorankündigung
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {body && <Pager page={pageNum} pageSize={RUN_PAGE_SIZE} total={body.total} hrefFor={hrefFor} />}
        </div>
    );
}
