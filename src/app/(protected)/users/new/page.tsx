import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { CreateUserForm } from './CreateUserForm';

export default function NewUserPage() {
    return (
        <div className="max-w-md">
            <Link href="/users" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={14} />
                Back to users
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Create user</h1>
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <CreateUserForm />
            </div>
        </div>
    );
}
