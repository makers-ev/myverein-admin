import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { UserDetail } from './UserDetail';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const incomingHeaders = await headers();
    const cookie = incomingHeaders.get('cookie') ?? '';
    const fetchOptions = { headers: { cookie } };

    const [{ data: user }, { data: sessionsData }, { data: currentSession }] = await Promise.all([
        authClient.admin.getUser({ query: { id }, fetchOptions }),
        authClient.admin.listUserSessions({ userId: id, fetchOptions }),
        authClient.getSession({ fetchOptions }),
    ]);

    if (!user) {
        notFound();
    }

    return (
        <div className="max-w-2xl">
            <Link href="/users" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Back to users
            </Link>
            <h1 className="mt-4 mb-6 text-2xl font-bold text-foreground">User detail</h1>
            <UserDetail
                user={user}
                sessions={sessionsData?.sessions ?? []}
                currentUserId={currentSession?.user.id ?? ''}
            />
        </div>
    );
}
