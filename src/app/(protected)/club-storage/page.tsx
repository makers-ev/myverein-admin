import { headers } from 'next/headers';
import Link from 'next/link';

import { Pager } from '@/components/Pager';
import { adminGetServer } from '@/lib/adminApi';
import { STORAGE_PAGE_SIZE, type ClubStorageList, formatBytes, usageTone } from '@/lib/clubStorage';
import { QuotaEditor } from './QuotaEditor';

export const dynamic = 'force-dynamic';

// A <progress> instead of a width style: the CSP (nonce-only style-src) blocks inline style attributes.
const TONE_BAR = { ok: 'accent-emerald-500', warn: 'accent-amber-500', over: 'accent-red-600' } as const;

export default async function ClubStoragePage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
    const { q, page } = await searchParams;
    const query = (q ?? '').trim().slice(0, 100);
    const pageNum = Math.max(1, Number(page) || 1);
    const incomingHeaders = await headers();

    const params = new URLSearchParams({ page: String(pageNum), pageSize: String(STORAGE_PAGE_SIZE) });
    if (query) params.set('q', query);
    const { body, error } = await adminGetServer<ClubStorageList>(`/admin/club-storage?${params}`, incomingHeaders.get('cookie') ?? '');
    const rows = body?.data ?? [];
    const overCount = rows.filter((r) => r.overQuota).length;
    const hrefFor = (p: number) => `/club-storage?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) })}`;

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Speicher je Verein</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Verbrauch und Kontingent der Vereine. Nur Kennzahlen, keine Dokumentinhalte.
                {body && <> Standard-Kontingent: {formatBytes(body.defaultQuotaBytes)}.</>}
            </p>

            {overCount > 0 && (
                <p role="status" className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    {overCount} {overCount === 1 ? 'Verein auf dieser Seite hat' : 'Vereine auf dieser Seite haben'} das Kontingent erreicht oder überschritten: neue Dateien werden dort abgelehnt, bestehende bleiben erhalten.
                </p>
            )}

            <form action="/club-storage" className="mt-6 flex max-w-sm gap-2">
                <input type="search" name="q" defaultValue={query} placeholder="Verein suchen …" aria-label="Verein suchen" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    Suchen
                </button>
                {query && (
                    <Link href="/club-storage" className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                        Zurücksetzen
                    </Link>
                )}
            </form>

            {error && (
                <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Speicherdaten konnten nicht geladen werden: {error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Verein</th>
                            <th className="px-4 py-3 text-right font-medium">Verbrauch</th>
                            <th className="px-4 py-3 text-right font-medium">Kontingent</th>
                            <th className="px-4 py-3 font-medium">Auslastung</th>
                            <th className="px-4 py-3 text-right font-medium">Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                    {error ? 'Keine Daten.' : query ? 'Kein Verein gefunden.' : 'Noch keine Vereine.'}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => {
                                const tone = usageTone(r);
                                return (
                                    <tr key={r.clubId} className="border-b border-border last:border-0 align-top hover:bg-muted/40">
                                        <td className="px-4 py-3 text-foreground">
                                            {r.name}
                                            <span className="block font-mono text-xs text-muted-foreground">{r.slug}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatBytes(r.usedBytes)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                                            {formatBytes(r.quotaBytes)}
                                            {r.customQuota && <span className="ml-2 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">angepasst</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <progress max={100} value={Math.min(100, Math.max(0, r.percent))} aria-label={`Auslastung ${r.name}`} className={`h-2 w-28 ${TONE_BAR[tone]}`} />
                                                <span className={`tabular-nums text-xs ${tone === 'over' ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>{r.percent} %</span>
                                                {r.overQuota && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Kontingent erreicht</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <QuotaEditor clubId={r.clubId} clubName={r.name} quotaBytes={r.quotaBytes} usedBytes={r.usedBytes} customQuota={r.customQuota} defaultQuotaBytes={body?.defaultQuotaBytes ?? r.quotaBytes} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {body && <Pager page={pageNum} pageSize={STORAGE_PAGE_SIZE} total={body.total} hrefFor={hrefFor} />}
        </div>
    );
}
