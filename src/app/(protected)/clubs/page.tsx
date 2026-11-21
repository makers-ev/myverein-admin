import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Pager } from '@/components/Pager';
import { adminGetServer } from '@/lib/adminApi';
import { CLUBS_PAGE_SIZE, CLUB_STATUS_LABELS, STATUS_FILTERS, type AdminClubList, clubsHref, formatDay, formatDateTime, planExpired } from '@/lib/adminClubs';

export const dynamic = 'force-dynamic';

const inputClass = 'min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

/**
 * Club list (Wave 15 A1): search and status filter, member count, founding date, last activity, status and plan.
 * Data from the backend's `GET /admin/clubs`; the admin check happens server-side there and in the layout.
 */
export default async function ClubsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
    const sp = await searchParams;
    const query = (sp.q ?? '').trim().slice(0, 100);
    const status = sp.status === 'active' || sp.status === 'suspended' ? sp.status : '';
    const pageNum = Math.max(1, Number(sp.page) || 1);
    const incomingHeaders = await headers();

    const params = new URLSearchParams({ page: String(pageNum), pageSize: String(CLUBS_PAGE_SIZE) });
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    const { body, error } = await adminGetServer<AdminClubList>(`/admin/clubs?${params}`, incomingHeaders.get('cookie') ?? '');
    // Page number beyond the last page while clubs exist: clamp to the last page instead of showing a misleading empty table.
    if (body && body.total > 0) {
        const lastPage = Math.ceil(body.total / CLUBS_PAGE_SIZE);
        if (pageNum > lastPage) redirect(clubsHref({ q: query, status, page: lastPage }));
    }
    const rows = body?.data ?? [];
    const filtered = Boolean(query || status);
    const hrefFor = (p: number) => clubsHref({ q: query, status, page: p });

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Vereine</h1>
            <p className="mt-1 text-sm text-muted-foreground">Alle angelegten Vereine. Neue Vereine entstehen über die Vereinsanträge.</p>

            <form action="/clubs" className="mt-6 flex flex-wrap items-end gap-3">
                <div>
                    <label htmlFor="club-q" className="block text-xs font-medium text-muted-foreground">Verein</label>
                    <input id="club-q" type="search" name="q" defaultValue={query} placeholder="Name oder Kennung" className={`mt-1 w-56 ${inputClass}`} />
                </div>
                <div>
                    <label htmlFor="club-status" className="block text-xs font-medium text-muted-foreground">Status</label>
                    <select id="club-status" name="status" defaultValue={status} className={`mt-1 ${inputClass}`}>
                        {STATUS_FILTERS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    Filtern
                </button>
                {filtered && (
                    <Link href="/clubs" className="flex min-h-11 items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
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
                            <th scope="col" className="px-4 py-3 font-medium">Status</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">Mitglieder</th>
                            <th scope="col" className="px-4 py-3 font-medium">Gegründet</th>
                            <th scope="col" className="px-4 py-3 font-medium">Letzte Aktivität</th>
                            <th scope="col" className="px-4 py-3 font-medium">Tarif</th>
                            <th scope="col" className="px-4 py-3 text-right font-medium">Aktion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    {error ? 'Keine Daten.' : filtered ? 'Kein Verein gefunden. Suche oder Filter anpassen.' : 'Noch keine Vereine. Sie entstehen, sobald ein Vereinsantrag freigegeben wird.'}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.clubId} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <th scope="row" className="px-4 py-3 font-medium text-foreground">
                                        {r.name}
                                        <span className="block font-mono text-xs font-normal text-muted-foreground">{r.slug}</span>
                                    </th>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'suspended' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
                                            {CLUB_STATUS_LABELS[r.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                                        {r.memberCount.toLocaleString('de-DE')}
                                        {r.plan?.memberLimit != null && <span className="text-muted-foreground"> von {r.plan.memberLimit.toLocaleString('de-DE')}</span>}
                                        {r.overMemberLimit && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Limit erreicht</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDay(r.createdAt)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(r.lastActivityAt)}</td>
                                    <td className="px-4 py-3 text-foreground">
                                        {r.plan ? r.plan.tier : <span className="text-muted-foreground">–</span>}
                                        {planExpired(r.plan) && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">abgelaufen</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/clubs/${encodeURIComponent(r.clubId)}`} aria-label={`Details zu ${r.name}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
                                            Details
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {body && <Pager page={pageNum} pageSize={CLUBS_PAGE_SIZE} total={body.total} hrefFor={hrefFor} />}
        </div>
    );
}
