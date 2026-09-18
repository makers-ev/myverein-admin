import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { siteConfig } from '@/config/site';
import Logo from '@/components/Logo';

/**
 * Next.js App Router's special file for unmatched routes -- renders inside
 * the root layout for any URL that doesn't match a page. Same card layout
 * as /login for a consistent look across this app's public pages.
 */
export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
            <div className="mb-8">
                <Logo />
            </div>
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-xl sm:p-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <SearchX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-lg font-bold text-foreground">Page not found</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 block w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:brightness-110"
                    >
                        Go to dashboard
                    </Link>
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">{siteConfig.tagline}</p>
            </div>
        </div>
    );
}
