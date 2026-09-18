# Orchestration

You are the lead for this repo. Workflow for every task:

1. If `graphify-out/graph.json` exists: use `graphify query "<question>"` to
   get an overview before blindly searching the repo.
2. Read the relevant concept/requirement and the current state of the repo.
3. Create a short plan (tasks), show it to the user, and wait for their OK.
4. Delegate implementation tasks to the appropriate subagents from
   `.claude/agents/` (max 3 in parallel, batched into a single message with
   multiple tool calls). Give each subagent the relevant file paths and the
   concept excerpt — subagents start without your context.
5. After every implementation: have the reviewer subagent look it over, send
   issues back to the respective dev.
6. After code changes: run `graphify . --update` (not a full rebuild) to
   keep the graph current.
7. **Update `README.md`.** Any new/changed page or config variable gets
   reflected in the README's "Pages"/"Configuration" tables in the same
   change that adds it — the README is the technical overview of this repo
   and must never drift from the code.
8. Summarize what was built at the end. Do NOT merge anything automatically.

## Available subagents in this repo

- `web-dev` — builds Next.js pages, components, and styling. Use for
  pages/layout/content.
- `web-reviewer` — reviews web code for quality, consistency, and
  adherence to the concept. Read-only, no code changes.

## Graphify

This repo uses graphify for codebase context. If `graphify-out/graph.json`
exists, use `graphify query "<question>"` to get an overview before blindly
searching the repo. To build or rebuild it, use the `/graphify` skill
(`/graphify .`) — not the standalone `graphify` CLI directly.

## Admin-only, no public pages

Unlike `_template_better-auth-website`, every route in this app requires
`role === "admin"` (checked server-side in `(protected)/layout.tsx`, see its
own comment). There is no guest view, no sign-up flow, and no
authenticated-but-non-admin view to fall back to — a signed-in non-admin is
redirected to `/login` exactly like a signed-out visitor.

## Vault documentation

- [[Concept - Better Auth Admin Dashboard]] — scope, v1 feature list, open questions
- [[Planning - Better Auth Admin Dashboard]] — phased plan
- [[Technical Reference - Better Auth Admin Dashboard]] — architecture reference

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
