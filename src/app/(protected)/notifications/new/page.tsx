import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { CreateNotificationForm } from './CreateNotificationForm';

export default function NewNotificationPage() {
    return (
        <div className="max-w-md">
            <Link href="/notifications" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Back to notifications
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-foreground">New notification</h1>
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <CreateNotificationForm />
            </div>
        </div>
    );
}
