import { headers } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { SearchBar } from './SearchBar';
import { UserFilters } from './UserFilters';

const PAGE_SIZE = 20;

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
    const { q, page, role } = await searchParams;
    const pageNum = Math.max(1, Number(page) || 1);
    const incomingHeaders = await headers();

    const { data } = await authClient.admin.listUsers({
        query: {
            limit: PAGE_SIZE,
            offset: (pageNum - 1) * PAGE_SIZE,
            ...(q ? { searchField: 'email' as const, searchOperator: 'contains' as const, searchValue: q } : {}),
            ...(role && role !== 'all'
                ? { filterField: 'role' as const, filterOperator: 'eq' as const, filterValue: role }
                : {}),
        },
        fetchOptions: { headers: { cookie: incomingHeaders.get('cookie') ?? '' } },
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;
    const hasNextPage = pageNum * PAGE_SIZE < total;
    const query = `${q ? `&q=${encodeURIComponent(q)}` : ''}${role && role !== 'all' ? `&role=${role}` : ''}`;

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Users</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{total} total</p>
                </div>
                <Link
                    href="/users/new"
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 transition-colors"
                >
                    <Plus size={16} />
                    Create user
                </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <SearchBar />
                <UserFilters />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                                    <td className="px-4 py-3">
                                        <Link href={`/users/${user.id}`} className="font-medium text-foreground hover:text-primary">
                                            {user.name || '—'}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {user.role ?? 'user'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.banned ? (
                                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                                Banned
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Active</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {(pageNum > 1 || hasNextPage) && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    {pageNum > 1 ? (
                        <Link href={`/users?page=${pageNum - 1}${query}`} className="text-primary hover:brightness-110">
                            ← Previous
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span className="text-muted-foreground">Page {pageNum}</span>
                    {hasNextPage ? (
                        <Link href={`/users?page=${pageNum + 1}${query}`} className="text-primary hover:brightness-110">
                            Next →
                        </Link>
                    ) : (
                        <span />
                    )}
                </div>
            )}
        </div>
    );
}
