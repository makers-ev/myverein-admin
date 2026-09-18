# Graph Report - .  (2026-09-13)

## Corpus Check
- 10 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 278 nodes · 336 edges · 34 communities (14 shown, 20 thin omitted)
- Extraction: 93% EXTRACTED · 6% INFERRED · 1% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Dashboard Core & Notifications|Admin Dashboard Core & Notifications]]
- [[_COMMUNITY_Auth, Users & Login Flow|Auth, Users & Login Flow]]
- [[_COMMUNITY_Protected Routes (dup ids)|Protected Routes (dup ids)]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Dashboard Analytics & Export|Dashboard Analytics & Export]]
- [[_COMMUNITY_App Shell & Layout|App Shell & Layout]]
- [[_COMMUNITY_Notification Templates & Languages|Notification Templates & Languages]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Website-Admin Bridge Stubs|Website-Admin Bridge Stubs]]
- [[_COMMUNITY_Users Page & Filters|Users Page & Filters]]
- [[_COMMUNITY_Notification Component Stubs|Notification Component Stubs]]
- [[_COMMUNITY_Vault Documentation|Vault Documentation]]
- [[_COMMUNITY_Proxy Config|Proxy Config]]
- [[_COMMUNITY_LPJ Brand Identity|LPJ Brand Identity]]
- [[_COMMUNITY_Next.js Breaking Changes Notes|Next.js Breaking Changes Notes]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_LoginNotFound Stubs|Login/NotFound Stubs]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Activity Stats Endpoint|Activity Stats Endpoint]]
- [[_COMMUNITY_Search & User Filters|Search & User Filters]]
- [[_COMMUNITY_Settings Form|Settings Form]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_ESLint Config (dup)|ESLint Config (dup)]]
- [[_COMMUNITY_Next Config (dup)|Next Config (dup)]]
- [[_COMMUNITY_Package.json (dup)|Package.json (dup)]]
- [[_COMMUNITY_PostCSS Config (dup)|PostCSS Config (dup)]]
- [[_COMMUNITY_TS Config (dup)|TS Config (dup)]]
- [[_COMMUNITY_Dashboard Filters|Dashboard Filters]]
- [[_COMMUNITY_New Notification Page|New Notification Page]]
- [[_COMMUNITY_Settings Page|Settings Page]]
- [[_COMMUNITY_Notification Row|Notification Row]]
- [[_COMMUNITY_Template Row|Template Row]]
- [[_COMMUNITY_Language ID Type|Language ID Type]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `AuthClient` - 16 edges
3. `authClient` - 10 edges
4. `siteConfig` - 7 edges
5. `UserDetail` - 7 edges
6. `TemplateEditor Component` - 7 edges
7. `scripts` - 6 edges
8. `LoginForm` - 6 edges
9. `Navbar Component` - 6 edges
10. `CreateNotificationForm Component` - 6 edges

## Surprising Connections (you probably didn't know these)
- `UserDetail` --references--> `Verification & password-reset emails`  [EXTRACTED]
  src/app/(protected)/users/[id]/UserDetail.tsx → README.md
- `LoginForm` --conceptually_related_to--> `Admin-only, no public pages`  [EXTRACTED]
  src/app/login/LoginForm.tsx → CLAUDE.md
- `README Pages Table` --conceptually_related_to--> `Navbar Component`  [INFERRED]
  README.md → src/components/Navbar.tsx
- `siteConfig` --references--> `Rebranding this template for a new project`  [EXTRACTED]
  src/config/site.ts → README.md
- `Admin-only, no public pages` --semantically_similar_to--> `Protected routes access-control pattern`  [INFERRED] [semantically similar]
  CLAUDE.md → README.md

## Hyperedges (group relationships)
- **Notification Management Flow** — notifications_page_NotificationsPage, create_notification_form_CreateNotificationForm, delete_notification_button, template_editor_TemplateEditor [INFERRED 0.85]
- **Per-Language Title/Body Form Pattern** — create_notification_form_LanguageFields, template_editor_LanguageFields, supported_languages_SUPPORTED_LANGUAGES [INFERRED 0.85]
- **Admin Route Navigation & Documentation** — navbar_Navbar, readme_pages_table, proxy_src_proxy [INFERRED 0.75]

## Communities (34 total, 20 thin omitted)

### Community 0 - "Admin Dashboard Core & Notifications"
Cohesion: 0.07
Nodes (34): ADR-009 (Multi-language Field Convention), Admin-only, no public pages, Rationale: why admin-only gating, CreateNotificationForm Component, LanguageFields Function (Create Form), UserTargetPicker Component, handleSubmit Function, Dashboard Activity Stats Fetch (+26 more)

### Community 1 - "Auth, Users & Login Flow"
Cohesion: 0.09
Nodes (30): authClient, websiteUrl, backend auth.ts (Better Auth instance), backend permissions.ts, POST /admin/send-verification-email, BarChart, CreateUserForm, DashboardPage (+22 more)

### Community 2 - "Protected Routes (dup ids)"
Cohesion: 0.10
Nodes (16): Footer(), NAV_LINKS, Navbar(), ThemeToggle(), SessionData, UserData, UserDetail(), UserDetailProps (+8 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, better-auth, lucide-react, next, next-themes, react, react-dom, devDependencies (+18 more)

### Community 4 - "Dashboard Analytics & Export"
Cohesion: 0.10
Nodes (17): BarChart(), BarChartDatum, BarChartProps, BarChartSeries, CHART_PADDING, DashboardFilters(), INTERVALS, PERIODS (+9 more)

### Community 5 - "App Shell & Layout"
Cohesion: 0.13
Nodes (12): geistMono, geistSans, metadata, NotFound(), ThemeProvider(), TwoFactorPrompt(), TwoFactorPromptProps, siteConfig (+4 more)

### Community 6 - "Notification Templates & Languages"
Cohesion: 0.11
Nodes (16): LanguageId, SUPPORTED_LANGUAGES, CreateNotificationForm(), OPTIONAL_LANGS, REQUIRED_LANGS, TranslationEntry, Translations, UserOption (+8 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Website-Admin Bridge Stubs"
Cohesion: 0.25
Nodes (8): DashboardPage, ExportButton, Website Template (protected)/layout.tsx (external), Website Template proxy.ts (external), ProtectedLayout, proxy() middleware function, RootLayout, RootPage

### Community 9 - "Users Page & Filters"
Cohesion: 0.38
Nodes (3): SearchBar(), ROLES, UserFilters()

### Community 10 - "Notification Component Stubs"
Cohesion: 0.40
Nodes (6): CreateNotificationForm, DeleteNotificationButton, NotificationsPage, users/SearchBar.tsx (unread, referenced), TemplateEditor, NotificationTemplatesPage

### Community 11 - "Vault Documentation"
Cohesion: 0.50
Nodes (4): Orchestration workflow, Concept - Better Auth Admin Dashboard, Planning - Better Auth Admin Dashboard, Technical Reference - Better Auth Admin Dashboard

### Community 13 - "LPJ Brand Identity"
Cohesion: 0.67
Nodes (3): LPJ IT-Solutions (Organization), Minimalist Black/White Brand Identity, LPJ IT-Solutions Logo

## Ambiguous Edges - Review These
- `NotFound page` → `Login page (unread, referenced)`  [AMBIGUOUS]
  src/app/not-found.tsx · relation: references
- `CreateNotificationForm` → `users/SearchBar.tsx (unread, referenced)`  [AMBIGUOUS]
  src/app/(protected)/notifications/new/CreateNotificationForm.tsx · relation: references
- `getTemplates Function` → `Users Page Component`  [AMBIGUOUS]
  src/app/(protected)/notifications/templates/page.tsx · relation: conceptually_related_to

## Knowledge Gaps
- **120 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `NotFound page` and `Login page (unread, referenced)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `CreateNotificationForm` and `users/SearchBar.tsx (unread, referenced)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `getTemplates Function` and `Users Page Component`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `AuthClient` connect `Protected Routes (dup ids)` to `Users Page & Filters`, `Dashboard Analytics & Export`, `App Shell & Layout`, `Notification Templates & Languages`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Navbar Component` connect `Admin Dashboard Core & Notifications` to `Auth, Users & Login Flow`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `authClient` connect `Auth, Users & Login Flow` to `Admin Dashboard Core & Notifications`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _125 weakly-connected nodes found - possible documentation gaps or missing edges._