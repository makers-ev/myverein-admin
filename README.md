# Better Auth Admin Dashboard Template

Next.js admin dashboard for a Better Auth backend. Talks to
`_template_better-auth-backend`'s Hono server directly from the browser --
this app has no local `/api/auth` route and no session store of its own,
same "separate backend" pattern as `_template_better-auth-website`.

Every route in this app requires `role === "admin"` -- there is no public
page, no sign-up flow, and no non-admin authenticated view. Admin accounts
are provisioned either by the backend's `seed-admin.ts` script (the very
first admin) or from this dashboard's "Create user" page (role `admin`) once
at least one admin can sign in.

Almost none of the backend logic here is new: Better Auth's `admin` plugin
(already registered in `_template_better-auth-backend/src/auth/auth.ts`)
already exposes list/create/ban/unban/delete/set-role/list-sessions/
revoke-session for users. This app is close to 100% frontend against that
existing API surface.

## Table of contents

- [Repo structure](#repo-structure)
- [Pages](#pages)
- [The activity-stats endpoint](#the-activity-stats-endpoint)
- [Verification & password-reset emails](#verification--password-reset-emails)
- [Getting started](#getting-started)
- [Configuration (branding)](#configuration-branding)
- [Docker](#docker)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)
- [License](#license)

## Repo structure

```
_template_better-auth-admin/
├── src/
│   ├── lib/
│   │   ├── auth-client.ts        # createAuthClient() + adminClient() + twoFactorClient()
│   │   └── resolveCallbackUrl.ts # open-redirect guard for the post-login redirect
│   ├── config/
│   │   └── site.ts                # branding/copy -- the one file to edit when reusing this template
│   ├── features/auth/components/
│   │   └── TwoFactorPrompt.tsx    # 2FA challenge step shown mid-login
│   ├── components/
│   │   ├── Navbar.tsx / Footer.tsx / Logo.tsx
│   │   ├── ThemeProvider.tsx / ThemeToggle.tsx
│   │   └── BarChart.tsx           # hand-rolled stacked SVG bar chart, no charting dependency
│   ├── app/
│   │   ├── layout.tsx              # root layout (fonts, ThemeProvider) -- no Navbar/Footer here, login has neither
│   │   ├── page.tsx                 # "/" -> redirects to /dashboard
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── LoginForm.tsx        # sign-in only, no sign-up, 2FA follow-up, admin-role check on success
│   │   └── (protected)/             # route group, session+role check lives in its layout.tsx
│   │       ├── layout.tsx            # THE access-control gate for this whole app
│   │       ├── dashboard/
│   │       │   ├── page.tsx           # KPI cards + activity chart
│   │       │   ├── DashboardFilters.tsx  # Interval/Period <select>s, URL-query-driven
│   │       │   └── ExportButton.tsx      # client-side CSV download, no export endpoint
│   │       ├── users/
│   │       │   ├── page.tsx           # list, search, role filter, pagination
│   │       │   ├── SearchBar.tsx
│   │       │   ├── UserFilters.tsx     # role <select>, same URL-query pattern as SearchBar
│   │       │   ├── new/                # create-user form
│   │       │   └── [id]/                # detail: role, ban/unban, delete, sessions
│   │       └── settings/               # the SIGNED-IN admin's own account (password, 2FA)
│   └── proxy.ts                     # CSP + host-header validation, runs before every request
├── public/
│   └── lpj-its.svg                  # default logo -- swap the file or override NEXT_PUBLIC_LOGO_SRC
├── Dockerfile.admin / Dockerfile.base
└── .env.example
```

## Pages

| Route | Access | Content |
|---|---|---|
| `/login` | public | Sign in, with 2FA follow-up. No sign-up. |
| `/dashboard` | admin only | Account counts (total/admins/banned) + Active/New/Retained/Reactivated KPI cards with %-change, filterable by interval (daily/weekly) and period (7/30/90 days), a stacked activity bar chart, and a CSV export of everything currently shown |
| `/users` | admin only | Searchable, paginated, role-filterable user list |
| `/users/new` | admin only | Create a user (name, email, password, role) |
| `/users/[id]` | admin only | Role change, ban/unban, delete, active sessions + revoke, verified-status badge, manually mark as verified/unverified, resend verification email, send password-reset email |
| `/notifications` | admin only | List of admin-authored notifications (target, DE title, deletable, created), delete per row |
| `/notifications/new` | admin only | Create a notification: broadcast or a specific user (email search), per-language title/body (DE+EN required, any other supported language optional), "recipients can delete" toggle |
| `/notifications/templates` | admin only | Override the per-language title/body of an automated, code-triggered notification (e.g. the welcome message sent on signup) per known key -- one field pair per supported language (`src/lib/supportedLanguages.ts`), DE+EN required, the rest optional; "Reset to default" reverts to the app's built-in text |
| `/settings` | admin only | The signed-in admin's own account: change password, enable/disable 2FA, sign out |
| `404` | public | Not-found page (rendered for any unmatched route) |

Protected routes live under `src/app/(protected)/` -- `(protected)/layout.tsx`
re-checks the session **and** the `admin` role server-side on every request
(the source of truth). A signed-in non-admin is redirected to `/login`
exactly like a signed-out visitor -- this app never reveals that an account
exists or is merely missing the role.

### Adding a protected page

1. Create the route as a new folder under `src/app/(protected)/` -- the
   `(protected)` segment is a route group (doesn't appear in the URL).
2. Any `page.tsx` placed there automatically inherits the session+role check.
3. Server components that need data should forward the incoming request's
   `Cookie` header to `authClient`, same pattern as `dashboard/page.tsx` and
   `users/page.tsx` -- see either for the pattern to copy. Client components
   (mutations: ban, delete, role change, ...) call `authClient.admin.*`
   directly from the browser; the session cookie is attached automatically
   there, no forwarding needed.

## The activity-stats endpoint

`GET /admin/activity-stats?interval=day|week&period=7d|30d|90d` on the
backend (`_template_better-auth-backend/src/routes/admin-stats.ts`) is the
one thing this template needed beyond the `admin` plugin -- there is no
bulk "all sessions in a date range" endpoint on the plugin, only per-user
`listUserSessions`, which doesn't scale to a dashboard query.

**"Active" means "had a session created in the window" -- a login proxy,
not a request-level activity signal** (this backend has no such tracking).
Definitions (`_template_better-auth-backend/src/lib/activity-stats.ts`):

- **New**: signed up within the bucket/period.
- **Active**: had ≥1 session created within the bucket/period.
- **Retained**: active in this bucket/period *and* the previous one.
- **Reactivated**: active now, not active in the previous bucket/period,
  and not new now (came back after a gap, as opposed to showing up for
  the first time).

The KPI cards' %-change is current period vs. the period immediately
before it, same length -- computed by feeding three whole-period windows
through the same classification function used for the chart's per-day/
per-week buckets (see that file's `periodKeyFn`), not a separate code path.

## Getting started

```bash
npm install
cp .env.example .env
# fill in NEXT_PUBLIC_BACKEND_URL etc., and add this app's origin to the
# backend's own trustedOrigins (CORS) -- see _template_better-auth-backend
npm run dev
```

Requires at least one admin account to exist already -- run the backend's
`npm run seed:admin` first if none does.

## Configuration (branding)

Everything that changes when this template is reused for a new project lives
in `src/config/site.ts`, reading from `NEXT_PUBLIC_*` env vars with generic
defaults (see `.env.example`): app name, logo path, tagline, login copy. Swap
`public/lpj-its.svg` (or point `NEXT_PUBLIC_LOGO_SRC` at a different file)
and edit `.env` -- no component hardcodes any of these strings.

`Footer.tsx` is currently a 1:1 structural copy of
`_template_better-auth-website`'s footer (Product/Company/Legal columns,
social icons) -- every link target in it is a placeholder (`/features`,
`/pricing`, `/about`, GitHub/Twitter/LinkedIn `#`, ...) since none of those
routes exist in this admin-only app. Wire real links or delete the unused
columns when adapting this template for a real project.

Color theme lives entirely in `src/app/globals.css` (semantic tokens:
`--background`, `--primary`, `--destructive`, ...), same reskin approach as
`_template_better-auth-website`.

### Rebranding this template for a new project

| What | Where |
|---|---|
| App name, logo, tagline, login copy | `.env`'s `NEXT_PUBLIC_APP_NAME`/`NEXT_PUBLIC_LOGO_SRC`/`NEXT_PUBLIC_APP_TAGLINE`/`NEXT_PUBLIC_LOGIN_TITLE`/`NEXT_PUBLIC_LOGIN_SUBTITLE`, read by `src/config/site.ts` |
| Brand colors | `src/app/globals.css`'s `--primary`/`--background`/`--border`/... tokens (light + dark) |
| Logo file | `public/lpj-its.svg` (or point `NEXT_PUBLIC_LOGO_SRC` elsewhere) |
| Consumer-facing site this app links out to | `.env`'s `NEXT_PUBLIC_WEBSITE_URL` (`websiteUrl` in `src/lib/auth-client.ts`) — the target user's landing page for the "Resend verification email"/"Send password reset email" buttons on `/users/[id]`, see [Verification & password-reset emails](#verification--password-reset-emails) |
| `Footer.tsx`'s placeholder links | See the paragraph above — wire real links or delete the unused columns |

## Docker

`Dockerfile.admin` mirrors the website template's `Dockerfile.website`
(multi-stage build off a shared `Dockerfile.base` image, port 3002 instead
of 3001).

## Security notes

- CSP + host-header validation via `src/proxy.ts`, identical mechanism to
  the website template. **Never "fix" a CSP violation in production by
  adding `'unsafe-inline'`/`'unsafe-eval'`** -- `proxy.ts` already branches
  correctly (relaxed policy in dev only, `'nonce-${nonce}' 'strict-dynamic'`
  in production); a violation there means something isn't reading/applying
  the nonce, not a reason to widen the policy everywhere. `src/app/layout.tsx`
  reads the request's nonce (`headers().get('x-nonce')`) and passes it to
  `ThemeProvider` for exactly this reason -- `next-themes` injects a raw
  inline `<script>` (FOUC prevention) and, mid-session, an inline `<style>`
  (`disableTransitionOnChange`); without the `nonce` prop both get silently
  blocked on *every* page, invisible in dev since dev mode doesn't need a
  nonce at all.
- If this app is deployed on its own subdomain alongside the backend and
  website (e.g. `admin.example.com` / `api.example.com`), see
  `_template_better-auth-backend`'s README ("Operations" -- "Website/admin
  stuck in a login loop in production, across subdomains") for the
  `crossSubDomainCookies` config needed on the backend, and how to verify it
  actually deployed (a code change alone doesn't fix a running container).
- No client-side-only access control: every mutation still goes through the
  backend's own `admin`-plugin role check, the `(protected)/layout.tsx`
  server-side re-check is defense in depth, not the only gate.
- Self-action guards (can't ban/delete/demote your own account) are enforced
  client-side in `UserDetail.tsx` for immediate feedback; the backend itself
  also rejects `YOU_CANNOT_BAN_YOURSELF`/`YOU_CANNOT_REMOVE_YOURSELF`.

## Verification & password-reset emails

`/users/[id]` shows a Verified/Not verified badge and buttons that call
core Better Auth client methods -- not `admin.*` -- for the user being
viewed: `authClient.sendVerificationEmail({ email, callbackURL })` and
`authClient.requestPasswordReset({ email, redirectTo })`. Both work for any
email regardless of who's signed in (same as a logged-out user requesting
either themselves), which is what lets an admin trigger them for someone
else. This app is admin-only (see CLAUDE.md), so both `callbackURL` and
`redirectTo` point at `NEXT_PUBLIC_WEBSITE_URL` (`websiteUrl` in
`src/lib/auth-client.ts`) instead of this app's own origin -- the target
user needs to land somewhere they can actually use, and
`_template_better-auth-website`'s `/verify-email` and `/reset-password`
pages are that landing spot.

One caveat: "Resend verification email" does **not** call
`authClient.sendVerificationEmail` directly. That endpoint requires the
signed-in session's email to match the target (`EMAIL_MISMATCH` otherwise)
-- fine for the website's own self-service prompt, useless from an admin
session. Instead the button calls the backend's `POST
/admin/send-verification-email` (see `_template_better-auth-backend`'s API
reference), which re-enters Better Auth server-side with no session and
sends for any user.

The badge itself doubles as a manual override: "Mark as verified" /
"Mark as unverified" calls `authClient.admin.updateUser({ userId, data:
{ emailVerified } })` to flip the flag directly -- the admin-side equivalent
of the user clicking the e-mail link, for accounts that were provisioned
without going through a verification e-mail (e.g. `admin.createUser`, whose
created accounts are not auto-verified -- see [Known limitations](#known-limitations)).

## Known limitations

- Users created here via `admin.createUser` are **not** auto-verified, unlike
  `seed-admin.ts`'s first-admin bootstrap (which patches `emailVerified`
  directly in the DB -- this app has no DB access). If the backend requires
  email verification, a dashboard-created user must verify before first
  sign-in -- either the user clicks the e-mail ("Resend verification email"
  button on `/users/[id]`) or the admin marks the account verified directly
  ("Mark as verified"), see [Verification & password-reset
  emails](#verification--password-reset-emails).
- Account counts (total/admins/banned) use `admin.listUsers`'s filter/count
  API (`limit: 1` calls); the Active/New/Retained/Reactivated KPIs and chart
  use the backend's own `/admin/activity-stats` endpoint -- see
  [The activity-stats endpoint](#the-activity-stats-endpoint) for what
  "active" actually measures here.
- No organization/team UI, no audit-log viewer, no impersonation UI -- all
  explicitly out of scope for v1, see the Concept doc in the vault.
- Live-tested against a real backend with synthetic cohort data (four
  distinct signup/session patterns: continuously retained, one-off/churned,
  reactivated-after-a-gap, brand new) -- confirmed the dashboard's rendered
  numbers match the planted patterns exactly. Two real bugs found and fixed
  this way that typecheck/build/unit-tests could not have caught: (1) the
  SVG `<title>` tooltip crashed React ("title tags need a single string
  child", not just a document `<head>` restriction), (2) the chart legend
  swatches used `fill-*` (SVG-only) instead of `bg-*`, so they rendered
  colorless. The `/users` role filter was verified the same way (`?role=admin`
  and `?role=user&q=...` both confirmed against the seeded test accounts).

## License

See [LICENSE](./LICENSE) — reuses the same license as the rest of the suite.
