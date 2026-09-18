import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { authClient } from '@/lib/auth-client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

/**
 * Server-side re-check for the entire admin area, same cookie-forwarding
 * pattern as _template_better-auth-website's (protected)/layout.tsx (Better
 * Auth's cross-origin "separate backend" setup means a server-side
 * `authClient` call does NOT automatically carry the browser's session
 * cookie -- it's a fresh outgoing fetch from the Next.js server -- so the
 * incoming request's `Cookie` header is forwarded manually).
 *
 * Unlike the website template, this ALSO enforces `role === "admin"` here,
 * not just "has a session" -- every route in this app is admin-only, there
 * is no public/authenticated-but-non-admin view to fall back to. A signed-in
 * non-admin is redirected the same as a signed-out visitor; this app never
 * reveals that the account exists or that it's merely missing a role.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const incomingHeaders = await headers();

    const { data: session } = await authClient.getSession({
        fetchOptions: {
            headers: {
                cookie: incomingHeaders.get('cookie') ?? '',
            },
        },
    });

    if (!session || session.user.role !== 'admin') {
        const currentPath = incomingHeaders.get('x-url') ?? '/dashboard';
        redirect(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
            <Footer />
        </div>
    );
}
