# Lúmina project execution

Blueprint approved by user on 2026-09-30. Resume docs/PROJECT_STATUS.md and docs/TASKS.md; follow sibling ../codex-framework/framework/AGENTS.md and project-lifecycle.md. Do not edit framework or _sources.

Scope: authenticated shared COP app, multiline candle orders with optional product catalog references and free descriptions, clients, products and expenses. No inventory, payment tracking or attachments. Docker PostgreSQL local, Neon production; Neon connected and Vercel deployment authorized and active (2026-10-01).

User-authorized LUM-21 supersedes the invitation/first-owner-only admission policy: public /registro with no activation code, invitation or approval. Every registered account immediately gets activeAccess and all shared business data; user explicitly confirmed this consequence. Better Auth generic signup remains disabled; registration uses narrow SECURITY DEFINER functions, strict canonical origin, atomic credential creation and persistent pre-hash rate limiting. Never create synthetic production accounts. Test multiple owners only in isolated local databases.

User-approved LUM-11: first owner may be created through /configuracion-inicial on the exact configured HTTP loopback origin, or the exact configured HTTPS origin with a server-only INITIAL_SETUP_TOKEN (64 lowercase hex characters) and matching activationCode. Production first-owner registration explicitly requested by user 2026-10-01. Durable database latch and triggers enforce one bootstrap winner and prevent reopening after revocation/deletion. Generic signup remains disabled. Runtime keeps narrow function EXECUTE and no generic user/account write privileges; never import operator credentials into web. Test bootstrap only in guarded isolated databases, never create synthetic owners in lumina.

Architecture/contracts: docs/ARCHITECTURE.md, API_DESIGN.md, DATABASE_DESIGN.md. UX/tokens/logo: docs/UX_PLAN.md. Exact versions: docs/TECHNOLOGY_STACK.md. TypeScript strict, Prisma7 adapter-pg, Better Auth; no custom auth hashing or browser-writable activeAccess. Guards per operation, transactional owner admission, exact monetary strings, optimistic versions, persistent idempotency and append-only audit. Never print .env, passwords, session tokens, full customer payloads or connection URLs. Test data synthetic only.

Use npm.cmd on Windows; this machine's npm.ps1 launcher is broken. Install dependencies only within this project. No global upgrades. Runtime .env excludes operator/migrator credentials; scripts use ignored .runtime env files. Never run QA or restore against Neon production. Docker scope limited to lumina-app project containers/volumes.

Validation scripts: npm run typecheck, lint, test, test:integration, test:e2e, build (created during scaffold). Tests must exercise real domain behavior and isolated DB. Producer → independent code review → fixes → QA before DONE. Complete only with verified requirements/tests/build/reviews/backup restore/docs. Keep task states and evidence accurate.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

User-approved improvements 2026-10-01: IMPROVEMENTS_PLAN.md. Explicit exception to framework non-modification: only imported existing analytics_reporter resource, pinned SOURCE/LICENSE and INVENTORY/SOURCES registration. No _sources edits. All other framework restrictions remain.
