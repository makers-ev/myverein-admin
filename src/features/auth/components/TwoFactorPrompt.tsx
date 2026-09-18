'use client';

import { useState, FormEvent } from 'react';

import { authClient } from '@/lib/auth-client';

interface TwoFactorPromptProps {
    onVerified: () => void;
    onCancel: () => void;
}

/**
 * Shown after signIn.email() returns a "two factor required" result
 * (Better Auth's twoFactor() plugin short-circuits normal session creation).
 * Deliberately minimal: a single code field, no "trust this device" /
 * backup-code UI.
 */
export function TwoFactorPrompt({ onVerified, onCancel }: TwoFactorPromptProps) {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code });

        setIsSubmitting(false);

        if (verifyError) {
            setError(verifyError.message ?? 'Invalid verification code.');
            return;
        }

        onVerified();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Two-factor verification</h3>
                <p className="mt-1 text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
            </div>

            <div>
                <label htmlFor="totp-code" className="block text-sm font-medium text-foreground">
                    Code
                </label>
                <input
                    id="totp-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="000000"
                />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || code.length !== 6}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Verifying…' : 'Verify'}
                </button>
            </div>
        </form>
    );
}
