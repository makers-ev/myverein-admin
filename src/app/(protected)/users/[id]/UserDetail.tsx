'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Ban,
    Trash2,
    ShieldCheck,
    LogOut as RevokeIcon,
    MailCheck,
    KeyRound,
    BadgeCheck,
    BadgeX,
} from 'lucide-react';

import { authClient, backendUrl, websiteUrl } from '@/lib/auth-client';

interface UserData {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    banned?: boolean | null;
    banReason?: string | null;
    emailVerified?: boolean | null;
    createdAt: string | Date;
}

interface SessionData {
    id: string;
    token: string;
    createdAt: string | Date;
    userAgent?: string | null;
}

interface UserDetailProps {
    user: UserData;
    sessions: SessionData[];
    /** The signed-in admin's own user id -- disables self-ban/self-delete, mirroring the backend's own YOU_CANNOT_BAN_YOURSELF / YOU_CANNOT_REMOVE_YOURSELF guards with immediate UI feedback instead of a round-trip error. */
    currentUserId: string;
}

export function UserDetail({ user, sessions, currentUserId }: UserDetailProps) {
    const router = useRouter();
    const isSelf = user.id === currentUserId;

    const [role, setRole] = useState<'user' | 'admin'>(user.role === 'admin' ? 'admin' : 'user');
    const [banReason, setBanReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    async function withBusy(action: () => Promise<void>) {
        setError(null);
        setNotice(null);
        setIsBusy(true);
        try {
            await action();
            router.refresh();
        } finally {
            setIsBusy(false);
        }
    }

    async function handleRoleChange(newRole: 'user' | 'admin') {
        setRole(newRole);
        await withBusy(async () => {
            const { error: roleError } = await authClient.admin.setRole({ userId: user.id, role: newRole });
            if (roleError) setError(roleError.message ?? 'Unable to change role.');
        });
    }

    async function handleBanToggle() {
        await withBusy(async () => {
            const { error: banError } = user.banned
                ? await authClient.admin.unbanUser({ userId: user.id })
                : await authClient.admin.banUser({ userId: user.id, banReason: banReason || undefined });
            if (banError) setError(banError.message ?? 'Unable to update ban status.');
        });
    }

    async function handleDelete() {
        if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
        await withBusy(async () => {
            const { error: deleteError } = await authClient.admin.removeUser({ userId: user.id });
            if (deleteError) {
                setError(deleteError.message ?? 'Unable to delete user.');
                return;
            }
            router.push('/users');
        });
    }

    async function handleRevokeSession(sessionToken: string) {
        await withBusy(async () => {
            const { error: revokeError } = await authClient.admin.revokeUserSession({ sessionToken });
            if (revokeError) setError(revokeError.message ?? 'Unable to revoke session.');
        });
    }

    // Sending a verification email for a *different* user can't go through
    // `authClient.sendVerificationEmail` -- that endpoint requires the
    // signed-in session's email to match the target (EMAIL_MISMATCH
    // otherwise), which is fine for the website's own self-service prompt
    // but never works from here. Instead this goes to the backend's
    // `POST /admin/send-verification-email`, which re-enters Better Auth
    // server-side with no session (the anonymous path) and works for any
    // user. `requestPasswordReset` has no such session-email check, so the
    // password-reset button below still calls it directly.
    async function handleResendVerification() {
        await withBusy(async () => {
            const { data, error } = await authClient.$fetch<{ status: boolean }>(
                `${backendUrl}/admin/send-verification-email`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        callbackURL: `${websiteUrl}/verify-email`,
                    }),
                },
            );
            // `$fetch` resolves to { data: null, error } on a non-2xx response
            // rather than throwing -- without this log, a real 401/403/500
            // here was indistinguishable from a silent success.
            if (error) {
                console.error('[user-detail] POST /admin/send-verification-email failed', error);
                setError(error.message ?? 'Unable to send verification email.');
                return;
            }
            if (data?.status) setNotice('Verification email sent.');
        });
    }

    async function handleSendPasswordReset() {
        await withBusy(async () => {
            const { error: resetError } = await authClient.requestPasswordReset({
                email: user.email,
                redirectTo: `${websiteUrl}/reset-password`,
            });
            if (resetError) {
                setError(resetError.message ?? 'Unable to send password reset email.');
                return;
            }
            setNotice('Password reset email sent.');
        });
    }

    async function handleEmailVerificationToggle() {
        await withBusy(async () => {
            const { error: toggleError } = await authClient.admin.updateUser({
                userId: user.id,
                data: { emailVerified: !user.emailVerified },
            });
            if (toggleError) {
                setError(toggleError.message ?? 'Unable to update verification status.');
                return;
            }
            setNotice(user.emailVerified ? 'User marked as not verified.' : 'User marked as verified.');
        });
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{user.name || '—'}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Joined{' '}
                            {new Date(user.createdAt).toLocaleDateString('de-DE', { timeZone: 'UTC' })}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={
                                user.emailVerified
                                    ? 'rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400'
                                    : 'rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400'
                            }
                        >
                            {user.emailVerified ? 'Verified' : 'Not verified'}
                        </span>
                        {user.banned && (
                            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                                Banned{user.banReason ? `: ${user.banReason}` : ''}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-foreground">
                            Role
                        </label>
                        <select
                            id="role"
                            value={role}
                            disabled={isBusy || isSelf}
                            onChange={(e) => void handleRoleChange(e.target.value as 'user' | 'admin')}
                            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        {isSelf && <p className="mt-1 text-xs text-muted-foreground">You can&apos;t change your own role.</p>}
                    </div>
                </div>

                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                {notice && !error && <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                    {!user.emailVerified && (
                        <>
                            <button
                                onClick={() => void handleResendVerification()}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                <MailCheck size={15} />
                                Resend verification email
                            </button>
                            <button
                                onClick={() => void handleEmailVerificationToggle()}
                                disabled={isBusy}
                                className="flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:brightness-110 transition-colors disabled:opacity-50"
                            >
                                <BadgeCheck size={15} />
                                Mark as verified
                            </button>
                        </>
                    )}
                    {user.emailVerified && (
                        <button
                            onClick={() => void handleEmailVerificationToggle()}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            <BadgeX size={15} />
                            Mark as unverified
                        </button>
                    )}
                    <button
                        onClick={() => void handleSendPasswordReset()}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <KeyRound size={15} />
                        Send password reset email
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                    {!user.banned && (
                        <input
                            type="text"
                            placeholder="Ban reason (optional)"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            disabled={isSelf}
                            className="flex-1 min-w-[10rem] rounded-md border border-border bg-background px-3 py-1.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        />
                    )}
                    <button
                        onClick={() => void handleBanToggle()}
                        disabled={isBusy || isSelf}
                        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        {user.banned ? <ShieldCheck size={15} /> : <Ban size={15} />}
                        {user.banned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                        onClick={() => void handleDelete()}
                        disabled={isBusy || isSelf}
                        className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:brightness-110 transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={15} />
                        Delete
                    </button>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground">Active sessions</h3>
                {sessions.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No active sessions.</p>
                ) : (
                    <div className="mt-3 space-y-2">
                        {sessions.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between rounded-lg border border-dashed border-border p-3"
                            >
                                <div className="min-w-0 flex-1 pr-3">
                                    <p className="truncate text-sm text-foreground">{s.userAgent ?? s.id}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(s.createdAt).toLocaleString('de-DE', { timeZone: 'UTC' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => void handleRevokeSession(s.token)}
                                    disabled={isBusy}
                                    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                    <RevokeIcon size={13} />
                                    Revoke
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
