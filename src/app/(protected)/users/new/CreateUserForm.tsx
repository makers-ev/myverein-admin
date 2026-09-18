'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

/**
 * Uses `admin.createUser`, same server endpoint `seed-admin.ts` calls for
 * the very first admin. Unlike that script, this form has no direct DB
 * access -- it cannot patch `emailVerified` to `true` afterwards the way
 * `seed-admin.ts` does. If the backend has `requireEmailVerification: true`
 * (src/auth/auth.ts), a user created here needs to verify their email
 * before they can sign in. Known limitation, see the vault's Technical
 * Reference for this template.
 */
export function CreateUserForm() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { data, error: createError } = await authClient.admin.createUser({ name, email, password, role });

        setIsSubmitting(false);

        if (createError) {
            setError(createError.message ?? 'Unable to create user.');
            return;
        }

        router.push(`/users/${data?.user.id ?? ''}`);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Name
                </label>
                <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground">
                    Role
                </label>
                <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-colors"
            >
                {isSubmitting ? 'Creating…' : 'Create user'}
            </button>
        </form>
    );
}
