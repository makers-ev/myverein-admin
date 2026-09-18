import { connection } from 'next/server';

import { LoginForm } from './LoginForm';
import { siteConfig } from '@/config/site';
import Logo from '@/components/Logo';

export default async function LoginPage() {
    // Forces dynamic rendering so src/proxy.ts's per-request CSP nonce is
    // actually applied to this page's scripts (see the website template's
    // identical login page comment for the full explanation).
    await connection();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
            <div className="mb-8">
                <Logo />
            </div>
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card p-8 shadow-xl sm:p-10">
                    <LoginForm />
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">{siteConfig.tagline}</p>
            </div>
        </div>
    );
}
