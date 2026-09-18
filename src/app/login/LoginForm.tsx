'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { authClient } from '@/lib/auth-client';
import { siteConfig } from '@/config/site';
import { TwoFactorPrompt } from '@/features/auth/components/TwoFactorPrompt';
import { resolveCallbackUrl } from '@/lib/resolveCallbackUrl';

function LoginFormInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const callbackUrl = resolveCallbackUrl(searchParams.get('callbackUrl'));

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * A non-admin can still have a valid email/password -- the backend's
     * `admin`-gated routes would reject them, and the (protected) layout's
     * server-side role check would bounce them straight back here anyway.
     * Checking + signing back out here avoids that redirect loop and gives
     * an immediate, specific error instead of a silent bounce.
     */
    async function completeSignIn() {
        const { data: session } = await authClient.getSession();

        if (session?.user.role !== 'admin') {
            await authClient.signOut();
            setError('This account does not have admin access.');
            return;
        }

        router.push(callbackUrl);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { data, error: signInError } = await authClient.signIn.email({ email, password });

        setIsSubmitting(false);

        if (signInError) {
            setError(signInError.message ?? 'Unable to sign in.');
            return;
        }

        // The twoFactor() plugin short-circuits normal sign-in and returns
        // `twoFactorRedirect: true` instead of a session when 2FA is enabled.
        if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
            setNeedsTwoFactor(true);
            return;
        }

        await completeSignIn();
    }

    if (needsTwoFactor) {
        return (
            <TwoFactorPrompt
                onVerified={() => void completeSignIn()}
                onCancel={() => setNeedsTwoFactor(false)}
            />
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black tracking-tight text-foreground">{siteConfig.loginTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{siteConfig.loginSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
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
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </>
    );
}

export function LoginForm() {
    return (
        <Suspense fallback={null}>
            <LoginFormInner />
        </Suspense>
    );
}
