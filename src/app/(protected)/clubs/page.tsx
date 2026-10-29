import { headers } from 'next/headers';
import Link from 'next/link';

import { Pager } from '@/components/Pager';
import { adminGetServer } from '@/lib/adminApi';
import { STORAGE_PAGE_SIZE, type ClubStorageList, formatBytes } from '@/lib/clubStorage';

export const dynamic = 'force-dynamic';

/**
 * Club list (Wave 14 DS4, preparation for Wave 15). Built on the existing `GET /admin/club-storage` (name, slug, usage): it is the
 * only admin route that lists clubs. Member counts and lifecycle state need a dedicated route (open for Wave 15).
 */
export default async function ClubsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
    const { q, page } = await searchParams;
    const query = (q ?? '').trim().slice(0, 100);
    const pageNum = Math.max(1, Number(page) || 1);
    const incomingHeaders = await headers();

    const params = new URLSearchParams({ page: String(pageNum), pageSize: String(STORAGE_PAGE_SIZE) });
    if (query) params.set('q', query);
    const { body, error } = await adminGetServer<ClubStorageList>(`/admin/club-storage?${params}`, incomingHeaders.get('cookie') ?? '');
    const rows = body?.data ?? [];
    const hrefFor = (p: number) => `/clubs?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Vereine</h1>
            <p className="mt-1 text-sm text-muted-foreground">Alle angelegten Vereine. Neue Vereine entstehen über die Vereinsanträge.</p>

            <form action="/clubs" className="mt-6 flex max-w-sm gap-2">
                <input type="search" name="q" defaultValue={query} placeholder="Verein suchen …" aria-label="Verein suchen" className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" className="min-h-11 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    Suchen
                </button>
                {query && (
                    <Link href="/clubs" className="flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                        Zurücksetzen
                    </Link>
                )}
            </form>

            {error && (
                <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Die Vereine konnten nicht geladen werden: {error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">Vereine</caption>
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-medium">Verein</th>
                            <th scope="col" className="px-4 py-3 font-medium">Kennung</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">Speicher</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                    {error ? 'Keine Daten.' : query ? 'Kein Verein gefunden.' : 'Noch keine Vereine. Sie entstehen, sobald ein Vereinsantrag freigegeben wird.'}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.clubId} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <th scope="row" className="px-4 py-3 font-medium text-foreground">{r.name}</th>
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                                        {formatBytes(r.usedBytes)} von {formatBytes(r.quotaBytes)}
                                        {r.overQuota && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Kontingent erreicht</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/club-storage?q=${encodeURIComponent(r.slug)}`} className="text-sm font-medium text-primary hover:underline">
                                            Speicher verwalten
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {body && <Pager page={pageNum} pageSize={STORAGE_PAGE_SIZE} total={body.total} hrefFor={hrefFor} />}
        </div>
    );
}
