import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { adminGetServer } from '@/lib/adminApi';
import { ACTION_LABELS, type AdminClubDetail, CLUB_STATUS_LABELS, auditLabel, formatDateTime, formatDay, planExpired, loadErrorText, safePortalUrl, byActor } from '@/lib/adminClubs';
import { LEGAL_FORM_LABELS, label } from '@/lib/clubRegistrations';
import { ClubSuspension } from './ClubSuspension';
import { PlanEditor } from './PlanEditor';

export const dynamic = 'force-dynamic';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Field({ name, children }: { name: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-muted-foreground">{name}</dt>
            <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
        </div>
    );
}

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const incomingHeaders = await headers();
    const { body, error: rawError, status } = await adminGetServer<{ data: AdminClubDetail }>(`/admin/clubs/${encodeURIComponent(id)}`, incomingHeaders.get('cookie') ?? '');
    if (status === 404) notFound();
    const error = rawError ? loadErrorText(status) : null;

    const back = (
        <Link href="/clubs" className="flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} aria-hidden="true" />
            Zurück zu den Vereinen
        </Link>
    );

    if (!body) {
        return (
            <div className="max-w-3xl">
                {back}
                <p role="alert" className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Der Verein konnte nicht geladen werden: {error}
                </p>
            </div>
        );
    }

    const club = body.data;
    const suspended = club.status === 'suspended';
    const reg = club.registration;
    const portalUrl = safePortalUrl(club.registerCheck?.portalUrl);

    return (
        <div className="max-w-3xl">
            {back}
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{club.name}</h1>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{club.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${suspended ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
                        {CLUB_STATUS_LABELS[club.status]}
                    </span>
                    <ClubSuspension clubId={club.clubId} clubName={club.name} status={club.status} />
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {suspended && club.suspension && (
                    <div role="status" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-foreground">
                        <p className="font-semibold text-destructive">Dieser Verein ist gesperrt.</p>
                        <p className="mt-1">Grund: {club.suspension.reason}</p>
                        <p className="mt-1 text-muted-foreground">
                            Seit {formatDateTime(club.suspension.suspendedAt)}
                            {byActor(club.suspension.suspendedBy)}.
                        </p>
                        <p className="mt-1">Hinweis für Mitglieder: {club.suspension.note ?? 'keiner'}</p>
                        <p className="mt-3 text-muted-foreground">
                            Support-Hinweis: Mitglieder und Vorstand sehen in App und Website einen Hinweis zur Sperre, der Verein ist nicht mehr öffentlich auffindbar. Prüfe vor dem Aufheben den Grund und die Rückmeldung des Vereins.
                        </p>
                    </div>
                )}

                <Section title="Überblick">
                    <dl className="grid gap-4 sm:grid-cols-3">
                        <Field name="Mitglieder">{club.memberCount.toLocaleString('de-DE')}</Field>
                        <Field name="Gegründet am">{formatDay(club.createdAt)}</Field>
                        <Field name="Letzte Aktivität">{formatDateTime(club.lastActivityAt)}</Field>
                        <Field name="Konten">{club.accountCount.toLocaleString('de-DE')}</Field>
                        <Field name="Öffentliche Seite">{club.publicProfileEnabled ? (club.discoverable ? 'Aktiv und auffindbar' : 'Aktiv, nicht auffindbar') : 'Aus'}</Field>
                    </dl>
                    <p className="mt-4 text-sm">
                        <Link href={`/club-storage?q=${encodeURIComponent(club.slug)}`} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
                            Speicher verwalten
                        </Link>
                    </p>
                </Section>

                <Section title="Gründungsantrag und Registerangaben">
                    {reg ? (
                        <>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <Field name="Rechtsform">{label(LEGAL_FORM_LABELS, reg.legalForm)}</Field>
                                <Field name="Registergericht">{reg.registerCourt ?? '–'}</Field>
                                <Field name="Registernummer">{reg.registerNumber ?? '–'}</Field>
                                <Field name="Ort">{reg.city ?? '–'}</Field>
                                <Field name="Eingereicht am">{formatDateTime(reg.submittedAt)}</Field>
                                <Field name="Geprüft am">{formatDateTime(reg.reviewedAt)}</Field>
                            </dl>
                            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                <Link href={`/club-registrations/${encodeURIComponent(reg.id)}`} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
                                    Gründungsantrag ansehen
                                </Link>
                                <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary hover:underline">
                                    Im Registerportal prüfen
                                    <ExternalLink size={14} aria-hidden="true" />
                                    <span className="sr-only">(öffnet in neuem Tab)</span>
                                </a>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Die Prüfung im Registerportal erfolgt von Hand. Es findet keine automatische Abfrage statt.</p>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">Zu diesem Verein gibt es keinen verknüpften Gründungsantrag (z. B. vor Einführung der Prüfung angelegt).</p>
                    )}
                </Section>

                <Section title="Tarif">
                    {club.plan ? (
                        <p className="mb-4 text-sm text-foreground">
                            Aktuell: <strong>{club.plan.tier}</strong>, gültig {club.plan.validFrom ? `ab ${formatDay(club.plan.validFrom)} ` : ''}bis {club.plan.validUntil ? formatDay(club.plan.validUntil) : 'unbefristet'}, Mitgliederlimit {club.plan.memberLimit != null ? club.plan.memberLimit.toLocaleString('de-DE') : 'keines'}.
                            {planExpired(club.plan) && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">abgelaufen</span>}
                            {club.overMemberLimit && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">Limit erreicht</span>}
                        </p>
                    ) : (
                        <p className="mb-4 text-sm text-muted-foreground">Noch kein Tarif hinterlegt.</p>
                    )}
                    <PlanEditor key={club.plan?.updatedAt ?? 'none'} clubId={club.clubId} plan={club.plan} />
                    <p className="mt-3 text-xs text-muted-foreground">Nur Stammdaten. MyVerein rechnet nicht ab, Rechnungen laufen außerhalb.</p>
                </Section>

                <Section title="Sperr-Verlauf">
                    {club.statusHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Der Verein wurde noch nie gesperrt.</p>
                    ) : (
                        <ol className="space-y-3">
                            {club.statusHistory.map((h, i) => (
                                <li key={`${h.createdAt}-${i}`} className="text-sm">
                                    <p className="font-medium text-foreground">{ACTION_LABELS[h.action]}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDateTime(h.createdAt)}
                                        {byActor(h.actor, ' · ')}
                                    </p>
                                    <p className="mt-0.5 text-foreground">Grund: {h.reason}</p>
                                    {h.note && <p className="text-muted-foreground">Hinweis für Mitglieder: {h.note}</p>}
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>

                <Section title="Protokoll (letzte 20 Einträge)">
                    {club.auditExcerpt.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
                    ) : (
                        <ol className="space-y-2">
                            {club.auditExcerpt.map((a, i) => (
                                <li key={`${a.createdAt}-${i}`} className="flex flex-wrap justify-between gap-2 text-sm">
                                    <span className="text-foreground">{auditLabel(a.eventType)}</span>
                                    <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>
            </div>
        </div>
    );
}
