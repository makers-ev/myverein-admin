import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { adminFetchServer, type Registration } from '@/lib/clubRegistrations';
import { RegistrationReview } from './RegistrationReview';

export default async function ClubRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const incomingHeaders = await headers();
    const { data, status, error } = await adminFetchServer<Registration>(
        `/${encodeURIComponent(id)}`,
        incomingHeaders.get('cookie') ?? '',
    );

    if (status === 404) notFound();

    return (
        <div className="max-w-3xl">
            <Link href="/club-registrations" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Zurück zu den Vereinsanträgen
            </Link>
            {data ? (
                <RegistrationReview registration={data} />
            ) : (
                <p role="alert" className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Der Antrag konnte nicht geladen werden: {error}
                </p>
            )}
        </div>
    );
}
