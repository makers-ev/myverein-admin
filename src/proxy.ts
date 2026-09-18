import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Same proxy.ts pattern as _template_better-auth-website (Next.js 16 renamed
 * `middleware.ts` -> `proxy.ts`). Responsibilities kept deliberately narrow:
 *  1. Host header validation (anti-SSRF / anti-host-injection / cache poisoning).
 *  2. A per-request nonce-based Content-Security-Policy header.
 *
 * Session/role enforcement for protected routes is intentionally NOT done
 * here -- it lives in `src/app/(protected)/layout.tsx`, which talks to the
 * real backend session endpoint AND checks `role === "admin"`. Proxy only
 * ever sees cookies, never a verified session/role, so it should only be
 * used for optimistic checks.
 */

if (!process.env.ALLOWED_HOSTS) {
    console.error('[SECURITY] ALLOWED_HOSTS env var is not set — all requests will be rejected.');
}

const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().replace(/^https?:\/\//, ''))
    .filter(Boolean);

export function proxy(request: NextRequest) {
    const host = request.headers.get('host');

    if (!host || !ALLOWED_HOSTS.includes(host)) {
        return new NextResponse('Invalid Host', { status: 400 });
    }

    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const isDev = process.env.NODE_ENV === 'development';

    // The backend's origin must be reachable from `connect-src` since the
    // Better Auth client (src/lib/auth-client.ts) fetches it directly from
    // the browser.
    const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL ?? "'self'";

    const cspHeader = `
        default-src 'self';
        script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : `'nonce-${nonce}' 'strict-dynamic'`};
        style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
        img-src 'self' blob: data:;
        font-src 'self';
        connect-src 'self' ${backendOrigin};
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        ${isDev ? '' : 'upgrade-insecure-requests;'}
    `;
    const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
    // Forward the current path so the (protected) layout can build a
    // callbackUrl without needing a client-side hook.
    requestHeaders.set('x-url', request.nextUrl.pathname + request.nextUrl.search);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });

    response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
