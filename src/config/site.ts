/**
 * Single source of truth for everything that changes when this template is
 * reused for a new project: app name, logo, tagline, login copy. Every
 * component reads from here instead of hardcoding text/paths -- swapping to
 * a new project means editing this one file (and dropping a new logo into
 * `public/`), not hunting through components. Values fall back to sane
 * generic defaults, but the NEXT_PUBLIC_* env vars let a deployment override
 * them without a code change at all.
 *
 * NEXT_PUBLIC_* vars are inlined into the JS bundle at build time by
 * Next.js/Webpack, same caveat as `backendUrl`/`websiteUrl` in auth-client.ts --
 * change one and rebuild, a running server won't pick it up live.
 */
export const siteConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "MyVerein Admin",
  /** Path under /public. Swap the file at that path, or override this to point elsewhere. */
  logoSrc: process.env.NEXT_PUBLIC_LOGO_SRC ?? "/logo.svg",
  logoAlt: process.env.NEXT_PUBLIC_APP_NAME ?? "MyVerein Admin",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE ?? "User & access management",
  loginTitle: process.env.NEXT_PUBLIC_LOGIN_TITLE ?? "Sign in",
  loginSubtitle: process.env.NEXT_PUBLIC_LOGIN_SUBTITLE ?? "Admin access only.",
} as const;
