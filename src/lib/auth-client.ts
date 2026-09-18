import { createAuthClient } from "better-auth/react";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";

/**
 * This app is a client of the backend's Better Auth instance (see
 * _template_better-auth-backend/src/auth/auth.ts) — it is NOT a second
 * identity provider. `adminClient()` matches the backend's already-registered
 * `admin()` plugin (roles: admin/user, see src/auth/permissions.ts there) and
 * is what gives this app `authClient.admin.listUsers/createUser/banUser/...`
 * — every one of those already exists server-side, this client just infers
 * the matching API shape. `twoFactorClient()` <-> the backend's `twoFactor()`
 * plugin, needed because sign-in can short-circuit into a 2FA challenge.
 */
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

// The consumer-facing site's origin (_template_better-auth-website or
// whatever it's replaced with) -- this app is admin-only (see CLAUDE.md,
// "Admin-only, no public pages"), so an admin-triggered verification/
// password-reset email must land the *target user* on a page they can
// actually use, not here. Used as the callbackURL/redirectTo for
// sendVerificationEmail/requestPasswordReset in users/[id]/UserDetail.tsx.
export const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: backendUrl,
  plugins: [adminClient(), twoFactorClient()],
});

export type AuthClient = typeof authClient;
export type Session = typeof authClient.$Infer.Session;
