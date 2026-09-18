'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

/**
 * Own-account settings for the signed-in admin -- password + 2FA. Adapted
 * from _template_better-auth-website's pageContent/Settings.tsx (same
 * Better Auth calls, same interaction pattern), minus profile-name editing
 * and the intro-replay button (no onboarding modal in this app). Deleting
 * your own admin account is intentionally NOT offered here -- unlike the
 * website template's end users, an admin deleting themselves via self-service
 * has no recovery path if they're the only admin left; that's a `removeUser`
 * call another admin makes from /users/[id], not a self-service danger zone.
 */
export function SettingsForm() {
    const router = useRouter();
    const { data: session, refetch: refetchSession } = authClient.useSession();
    const [saved, setSaved] = useState<string | null>(null);

    useEffect(() => {
        if (!saved) return;
        const timeout = setTimeout(() => setSaved(null), 3000);
        return () => clearTimeout(timeout);
    }, [saved]);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    async function handleChangePassword(e: FormEvent) {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSubmitting(true);

        const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });

        setPasswordSubmitting(false);

        if (error) {
            setPasswordError(error.message ?? 'Unable to change password.');
            return;
        }

        setCurrentPassword('');
        setNewPassword('');
        setShowPasswordForm(false);
        setSaved('Password changed');
    }

    const twoFactorEnabled = session?.user.twoFactorEnabled ?? false;
    const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'enable' | 'verify' | 'disable'>('idle');
    const [twoFactorPassword, setTwoFactorPassword] = useState('');
    const [totpUri, setTotpUri] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState('');
    const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
    const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

    function resetTwoFactorFlow() {
        setTwoFactorStep('idle');
        setTwoFactorPassword('');
        setTotpUri(null);
        setTotpCode('');
        setTwoFactorError(null);
    }

    async function startTwoFactorEnable(e: FormEvent) {
        e.preventDefault();
        setTwoFactorError(null);
        setTwoFactorSubmitting(true);

        const { data, error } = await authClient.twoFactor.enable({ password: twoFactorPassword });

        setTwoFactorSubmitting(false);

        if (error) {
            setTwoFactorError(error.message ?? 'Unable to enable two-factor authentication.');
            return;
        }

        // `enable` can also return an OTP-only result (`{ method: "otp" }`,
        // no `totpURI`) depending on backend twoFactor() config -- this
        // template's backend only configures TOTP, but the client type
        // covers both, so narrow before reading the field.
        setTotpUri(data && 'totpURI' in data ? data.totpURI : null);
        setTwoFactorPassword('');
        setTwoFactorStep('verify');
    }

    async function verifyTwoFactor(e: FormEvent) {
        e.preventDefault();
        setTwoFactorError(null);
        setTwoFactorSubmitting(true);

        const { error } = await authClient.twoFactor.verifyTotp({ code: totpCode });

        setTwoFactorSubmitting(false);

        if (error) {
            setTwoFactorError(error.message ?? 'Invalid code. Please try again.');
            return;
        }

        resetTwoFactorFlow();
        await refetchSession();
        setSaved('Two-factor authentication enabled');
    }

    async function disableTwoFactor(e: FormEvent) {
        e.preventDefault();
        setTwoFactorError(null);
        setTwoFactorSubmitting(true);

        const { error } = await authClient.twoFactor.disable({ password: twoFactorPassword });

        setTwoFactorSubmitting(false);

        if (error) {
            setTwoFactorError(error.message ?? 'Unable to disable two-factor authentication.');
            return;
        }

        resetTwoFactorFlow();
        await refetchSession();
        setSaved('Two-factor authentication disabled');
    }

    async function handleSignOut() {
        await authClient.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Security</h2>
                <p className="text-sm text-muted-foreground">Manage your password and two-factor authentication.</p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Change password */}
                    <div className="rounded-lg border border-dashed border-border p-4">
                        <div className="font-medium text-foreground">Change password</div>
                        <div className="text-sm text-muted-foreground">Update your password regularly.</div>

                        {!showPasswordForm ? (
                            <button
                                onClick={() => setShowPasswordForm(true)}
                                className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-foreground hover:bg-border transition-colors"
                            >
                                Change
                            </button>
                        ) : (
                            <form onSubmit={handleChangePassword} className="mt-3 space-y-2">
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    required
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <input
                                    type="password"
                                    placeholder="New password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={passwordSubmitting}
                                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50"
                                    >
                                        {passwordSubmitting ? 'Saving…' : 'Save password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordError(null);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                        }}
                                        className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Two-factor authentication */}
                    <div className="rounded-lg border border-dashed border-border p-4">
                        <div className="font-medium text-foreground">Two-factor authentication</div>
                        <div className="text-sm text-muted-foreground">
                            {twoFactorEnabled ? 'Enabled' : 'Not enabled'} — protect this account with an extra step.
                        </div>

                        {twoFactorStep === 'idle' && (
                            <button
                                onClick={() => setTwoFactorStep(twoFactorEnabled ? 'disable' : 'enable')}
                                className={`mt-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                    twoFactorEnabled
                                        ? 'bg-muted text-foreground hover:bg-border'
                                        : 'bg-primary text-primary-foreground hover:brightness-110'
                                }`}
                            >
                                {twoFactorEnabled ? 'Disable' : 'Enable'}
                            </button>
                        )}

                        {twoFactorStep === 'enable' && (
                            <form onSubmit={startTwoFactorEnable} className="mt-3 space-y-2">
                                <p className="text-xs text-muted-foreground">Confirm your password to start setup.</p>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    autoComplete="current-password"
                                    value={twoFactorPassword}
                                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {twoFactorError && <p className="text-sm text-destructive">{twoFactorError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={twoFactorSubmitting}
                                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50"
                                    >
                                        {twoFactorSubmitting ? 'Please wait…' : 'Continue'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetTwoFactorFlow}
                                        className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {twoFactorStep === 'verify' && (
                            <form onSubmit={verifyTwoFactor} className="mt-3 space-y-2">
                                <p className="text-xs text-muted-foreground">
                                    Add this key to your authenticator app, then enter the 6-digit code it shows.
                                </p>
                                {totpUri && <code className="block break-all rounded bg-muted p-2 text-xs">{totpUri}</code>}
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    required
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-center text-sm tracking-[0.3em] shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {twoFactorError && <p className="text-sm text-destructive">{twoFactorError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={twoFactorSubmitting || totpCode.length !== 6}
                                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50"
                                    >
                                        {twoFactorSubmitting ? 'Verifying…' : 'Verify & enable'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetTwoFactorFlow}
                                        className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {twoFactorStep === 'disable' && (
                            <form onSubmit={disableTwoFactor} className="mt-3 space-y-2">
                                <p className="text-xs text-muted-foreground">Confirm your password to disable two-factor authentication.</p>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    autoComplete="current-password"
                                    value={twoFactorPassword}
                                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {twoFactorError && <p className="text-sm text-destructive">{twoFactorError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={twoFactorSubmitting}
                                        className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:brightness-110 transition-colors disabled:opacity-50"
                                    >
                                        {twoFactorSubmitting ? 'Please wait…' : 'Disable'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetTwoFactorFlow}
                                        className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Session</h2>
                <p className="text-sm text-muted-foreground">Signed in as {session?.user.email}.</p>
                <button
                    onClick={() => void handleSignOut()}
                    className="mt-3 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                    Sign out
                </button>
            </div>

            {saved && (
                <div className="fixed right-6 bottom-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
                    {saved}
                </div>
            )}
        </div>
    );
}
