import { headers } from 'next/headers';
import Link from 'next/link';

import {
    adminFetchServer,
    formatDate,
    label,
    LEGAL_FORM_LABELS,
    QUEUE_FILTERS,
    STATUS_BADGE_CLASSES,
    STATUS_LABELS,
    type Registration,
} from '@/lib/clubRegistrations';

export default async function ClubRegistrationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    const active = QUEUE_FILTERS.find((f) => f.value === status)?.value ?? 'pending';
    const incomingHeaders = await headers();

    const { data, error } = await adminFetchServer<Registration[]>(
        active === 'all' ? '' : `?status=${active}`,
        incomingHeaders.get('cookie') ?? '',
    );
    const rows = data ?? [];

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground">Vereinsanträge</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Eingereichte Anträge auf Vereinsgründung, älteste zuerst. Entwürfe erscheinen hier nicht.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
                {QUEUE_FILTERS.map((f) => (
                    <Link
                        key={f.value}
                        href={f.value === 'pending' ? '/club-registrations' : `/club-registrations?status=${f.value}`}
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
                    Anträge konnten nicht geladen werden: {error}
                </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Verein</th>
                            <th className="px-4 py-3 font-medium">Antragsteller</th>
                            <th className="px-4 py-3 font-medium">Rechtsform</th>
                            <th className="px-4 py-3 font-medium">Ort</th>
                            <th className="px-4 py-3 font-medium">Eingereicht am</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                    {error ? 'Keine Daten.' : 'Keine Anträge in dieser Ansicht.'}
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <td className="px-4 py-3">
                                        <Link href={`/club-registrations/${r.id}`} className="font-medium text-foreground hover:text-primary">
                                            {r.clubName}
                                        </Link>
                                        {r.duplicateHints.length > 0 && (
                                            <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                                                Dublettenhinweis
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {r.applicant ? `${r.applicant.name} (${r.applicant.email})` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{label(LEGAL_FORM_LABELS, r.legalForm)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {[r.postalCode, r.city].filter(Boolean).join(' ') || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.submittedAt)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                STATUS_BADGE_CLASSES[r.status] ?? 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {label(STATUS_LABELS, r.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {rows.length >= 200 && (
                <p className="mt-2 text-xs text-muted-foreground">Es werden maximal 200 Anträge angezeigt.</p>
            )}
        </div>
    );
}
