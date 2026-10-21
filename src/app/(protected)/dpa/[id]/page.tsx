import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { adminGetServer } from '@/lib/adminApi';
import { formatDay, type DpaVersionList } from '@/lib/dpa';
import { formatDate } from '@/lib/clubRegistrations';
import { DpaForm } from '../DpaForm';

export const dynamic = 'force-dynamic';

export default async function DpaVersionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { body, error } = await adminGetServer<DpaVersionList>('/admin/dpa-versions', (await headers()).get('cookie') ?? '');
    const version = body?.data.find((v) => v.id === id);
    if (body && !version) notFound();

    return (
        <div className="max-w-3xl">
            <Link href="/dpa" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Zurück zu den AV-Verträgen
            </Link>
            {!version ? (
                <p role="alert" className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Die Version konnte nicht geladen werden: {error}
                </p>
            ) : version.status === 'draft' ? (
                <>
                    <h1 className="mt-4 text-2xl font-bold text-foreground">
                        Entwurf v{version.version}
                    </h1>
                    <DpaForm version={version} totalClubs={body!.totalClubs} />
                </>
            ) : (
                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-foreground">
                        {version.title} (v{version.version})
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Veröffentlicht am {formatDate(version.publishedAt)} · verbindlich ab {formatDay(version.requiredFrom ?? version.publishedAt)} · {version.acceptedClubs} von{' '}
                        {body!.totalClubs} Vereinen haben angenommen. Diese Version ist unveränderlich.
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">SHA-256: {version.sha256}</p>
                    <section className="mt-6 rounded-xl border border-border bg-card p-5">
                        <h2 className="text-base font-semibold text-foreground">Vertragstext</h2>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{version.body}</p>
                    </section>
                    <section className="mt-6 rounded-xl border border-border bg-card p-5">
                        <h2 className="text-base font-semibold text-foreground">Unterauftragsverarbeiter ({version.subprocessors.length})</h2>
                        {version.subprocessors.length === 0 ? (
                            <p className="mt-3 text-sm text-muted-foreground">Keine eingetragen.</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-border text-sm">
                                {version.subprocessors.map((s, i) => (
                                    <li key={i} className="py-2">
                                        <span className="font-medium text-foreground">{s.name}</span>
                                        <span className="text-muted-foreground"> · {s.purpose} · {s.location}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                    {version.tomAnnex && (
                        <section className="mt-6 rounded-xl border border-border bg-card p-5">
                            <h2 className="text-base font-semibold text-foreground">Anlage: Technische und organisatorische Maßnahmen</h2>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{version.tomAnnex}</p>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
