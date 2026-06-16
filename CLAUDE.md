# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

NextReach is a B2B SaaS that sells e-commerce analytics dashboards. This repo replaces
its landing page's "Contact Sales" form with a chatbot: it interviews the visitor,
decides for itself when it has gathered enough information, and writes a structured
lead to Postgres. A password-gated `/admin` view lets the sales team triage incoming
leads. `README.md` covers stack rationale and current known gaps — read it before
making product-level decisions.

## Commands

```bash
npm run dev         # dev server at localhost:3000
npm run build        # production build (also runs the TypeScript check)
npm run lint          # ESLint (flat config, includes React Compiler rules)
npx prisma generate     # regenerate the Prisma client after editing schema.prisma
npx prisma migrate dev   # create + apply a migration against DATABASE_URL
docker compose up -d      # optional local Postgres, matches .env.example's DATABASE_URL
```

There is no test suite yet (noted as a known gap in `README.md`).

Required env vars (see `.env.example`): `DATABASE_URL` (Postgres), `ANTHROPIC_API_KEY`,
`ADMIN_SECRET` (the `/admin` shared password).

## Next.js / Prisma version gotchas

This project pins **Next.js 16** and **Prisma 7** — both newer than typical training
data, with breaking changes from the conventions you may expect:

- Next.js renamed Middleware to **Proxy**: the file is `src/proxy.ts` (not
  `middleware.ts`), exporting a `proxy` function instead of `middleware`. Functionality
  is the same. If something about App Router seems off, check
  `node_modules/next/dist/docs/` before assuming pre-16 behavior.
- Prisma 7's generator uses `provider = "prisma-client"` (not `prisma-client-js`) and
  writes the client to `src/generated/prisma` (gitignored — run `prisma generate` after
  pulling or editing `prisma/schema.prisma`). `PrismaClient` now requires a driver
  adapter; see `src/lib/prisma.ts` (`@prisma/adapter-pg`).
- **Don't import from `@/generated/prisma/client` in a client component.** That file
  runs Node-only init code (`node:process`, `node:path`) at module scope and breaks the
  client bundle (Turbopack: "chunking context does not support external modules"). For
  client-side type/enum needs, import the type from
  `@/generated/prisma/models/<Model>` (type-only, erased at compile time) and enum
  value objects from `@/generated/prisma/enums` (pure literals, no Node deps). See
  `src/components/admin/LeadList.tsx` for the working pattern.

## Architecture

**Conversation flow.** `ChatWidget.tsx` (client) owns the full message history in
React state and POSTs the entire transcript to `/api/chat` on every turn — the server
holds no session state between requests. The route (`src/app/api/chat/route.ts`) calls
Claude with a system prompt and a single tool, `submit_lead` (both defined in
`src/lib/chat.ts`). The model itself decides when it has gathered enough — there's no
app-side "is this lead complete" logic — by calling `submit_lead` with structured
arguments instead of replying with text. The route validates those arguments with Zod,
writes a `Lead` row (transcript stored as JSON), and returns the model's own closing
message. If the model doesn't call the tool, the route just relays its text reply and
the conversation continues. A turn-count nudge and a hard message cap
(`NUDGE_AFTER_USER_TURNS`, `MAX_MESSAGES_PER_CONVERSATION` in `src/lib/chat.ts`) keep
an indecisive or adversarial conversation from running forever.

**Two-file split for chat constants.** `src/lib/chatShared.ts` has no imports beyond
plain constants — safe for client components. `src/lib/chat.ts` imports the Anthropic
SDK and Zod and holds the system prompt, tool schema, and request validators — server
only. If you add something a client component needs (e.g. a UI string), put it in
`chatShared.ts`; anything touching the model or persistence belongs in `chat.ts`.

**Anti-abuse is layered, not a single gate.** A hidden honeypot field
(`ChatWidget.tsx`), an open-to-first-message timing check, a per-IP in-memory rate
limiter (`src/lib/rateLimit.ts` — process-local, resets on cold start/redeploy, not a
distributed guarantee), and message/conversation length caps. Suspicious conversations
are flagged (`Lead.flagged`) and hidden by default in the admin list, not deleted — the
sales team can still unhide them.

**Admin auth is a single shared secret, not a user system** — there are no accounts
anywhere in this app. `src/proxy.ts` gates everything under `/admin/*` by checking a
cookie against `sha256(ADMIN_SECRET)`; the login form (`src/app/admin/login/`) is a
Server Action that sets that cookie.

**Admin view** (`src/app/admin/page.tsx`) is a Server Component that queries Prisma
directly and hands the rows to `src/components/admin/LeadList.tsx` (client) for
filtering, the detail panel, and status changes. Status updates go through a Server
Action (`src/app/admin/actions.ts`) followed by `revalidatePath("/admin")` — there's no
client-side fetch/refetch cycle for that.
