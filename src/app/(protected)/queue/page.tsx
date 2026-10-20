import { headers } from 'next/headers';

import { formatDate } from '@/lib/clubRegistrations';
import { fetchQueueStats, formatOverdue, type JobRow } from '@/lib/jobQueue';
import { RetryJobButton } from './RetryJobButton';

export const dynamic = 'force-dynamic';

const STATUS_COLUMNS = [
    { key: 'queued', label: 'Wartend' },
    { key: 'running', label: 'Läuft' },
    { key: 'failed', label: 'Fehlgeschlagen' },
    { key: 'dead', label: 'Dead' },
] as const;

function JobTable({ rows, emptyText, showRetry }: { rows: JobRow[]; emptyText: string; showRetry: boolean }) {
    return (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 font-medium">Jobtyp</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Fällig seit</th>
                        <th className="px-4 py-3 font-medium">Versuche</th>
                        <th className="px-4 py-3 font-medium">Letzter Fehler</th>
                        {showRetry && <th className="px-4 py-3 font-medium" />}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={showRetry ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        rows.map((j) => (
                            <tr key={j.id} className="border-b border-border last:border-0 align-top hover:bg-muted/40">
                                <td className="px-4 py-3 font-mono text-xs text-foreground">{j.type}</td>
                                <td className="px-4 py-3 text-muted-foreground">{j.status}</td>
                                <td className="px-4 py-3 text-muted-foreground" title={formatDate(j.runAt)}>
                                    {j.overdueSeconds > 0 ? formatOverdue(j.overdueSeconds) : formatDate(j.runAt)}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {j.attempts}/{j.maxAttempts}
                                </td>
                                <td className="max-w-md break-words px-4 py-3 text-muted-foreground">{j.lastError ?? '—'}</td>
                                {showRetry && (
                                    <td className="px-4 py-3 text-right">
                                        <RetryJobButton id={j.id} type={j.type} />
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default async function QueuePage() {
    const incomingHeaders = await headers();
    const { data, error } = await fetchQueueStats(incomingHeaders.get('cookie') ?? '');

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Warteschlange</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Hintergrund-Jobs (Versand, Erinnerungen, Aufräumarbeiten). Fehlermeldungen enthalten keine Personendaten.
                {data && <> Stand: {formatDate(data.generatedAt)}</>}
            </p>

            {error && (
                <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Warteschlange konnte nicht geladen werden: {error}
                </p>
            )}

            {data && (
                <>
                    {data.totals.dead > 0 && (
                        <p role="status" className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                            {data.totals.dead} Job(s) sind endgültig fehlgeschlagen (dead) und können unten erneut eingeplant werden.
                        </p>
                    )}

                    <h2 className="mt-8 text-lg font-semibold text-foreground">Jobs je Typ</h2>
                    <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Jobtyp</th>
                                    {STATUS_COLUMNS.map((c) => (
                                        <th key={c.key} className="px-4 py-3 text-right font-medium">
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.types.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Noch keine Jobs vorhanden.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {data.types.map((t) => (
                                            <tr key={t.type} className="border-b border-border hover:bg-muted/40">
                                                <td className="px-4 py-3 font-mono text-xs text-foreground">{t.type}</td>
                                                {STATUS_COLUMNS.map((c) => (
                                                    <td
                                                        key={c.key}
                                                        className={`px-4 py-3 text-right tabular-nums ${
                                                            t[c.key] > 0 && (c.key === 'dead' || c.key === 'failed')
                                                                ? 'font-semibold text-destructive'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {t[c.key]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/30 font-medium">
                                            <td className="px-4 py-3 text-foreground">Gesamt</td>
                                            {STATUS_COLUMNS.map((c) => (
                                                <td key={c.key} className="px-4 py-3 text-right tabular-nums text-foreground">
                                                    {data.totals[c.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <h2 className="mt-8 text-lg font-semibold text-foreground">Älteste fällige Jobs</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Wartend oder im Wiederholversuch, Fälligkeit bereits erreicht (max. 20).</p>
                    <JobTable rows={data.oldestDue} emptyText="Nichts überfällig – die Warteschlange ist abgearbeitet." showRetry={false} />

                    <h2 className="mt-8 text-lg font-semibold text-foreground">Dead Jobs</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Die letzten 20 Jobs, die alle Versuche verbraucht haben.</p>
                    <JobTable rows={data.dead} emptyText="Keine Dead Jobs." showRetry />
                </>
            )}
        </div>
    );
}
