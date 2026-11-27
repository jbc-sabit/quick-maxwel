# PortfoliooSite

A multi-tenant portfolio platform. Users sign up, manage their content (articles, experience, achievements, services, events) from a dashboard, choose one of six templates, and publish a public site on their own subdomain (`<handle>.<root domain>`).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL · Drizzle ORM · TipTap · JWT sessions (`jose`)

## Quick start

You need Node 22+, pnpm, and a PostgreSQL database you can reach (a free hosted one such as Neon works well; no Docker required).

```bash
cp .env.example .env              # then set DATABASE_URL and JWT_SECRET (openssl rand -base64 48)
pnpm install
pnpm db:migrate                   # create / update the schema
pnpm db:seed                      # 8 demo portfolios, one per profession
pnpm dev                          # http://localhost:3000
```

The seed creates eight demo portfolios, showcased on the landing page under "Built for every discipline":

| Handle | Profession | Template |
|---|---|---|
| `sarah` | Software Engineer | Bento Grid |
| `maya` | Product & Brand Designer | Fancy Creative |
| `amir` | Cardiologist | Simple Professional |
| `elena` | Climate Scientist | Minimal Swiss |
| `daniel` | Structural & Civil Engineer | Aurora Studio |
| `priya` | Data Scientist & ML Engineer | Developer Terminal |
| `lucas` | Photographer & Filmmaker | Fancy Creative |
| `grace` | Marketing & Brand Strategist | Bento Grid |

Each lives in `src/db/demo-data/<handle>.ts`; the list itself (emails, professions, disciplines) is in `src/lib/demo-account.ts`. All demo accounts share one password: `DEMO_USER_PASSWORD` from `.env` (if it is unset, development falls back to `password123`). Sign in with `<handle>@example.com`, e.g. `sarah@example.com`. Public demo portfolios: `http://localhost:3000/<handle>`.

`pnpm db:seed` resets every demo account. To add only the ones that don't exist yet (keeping edits to existing demos), run `pnpm db:seed --missing-only`. To change the shared password without touching any content, edit `DEMO_USER_PASSWORD` and run `pnpm db:seed --passwords-only`.

In production (`NODE_ENV=production`) signing into the demo accounts is refused unless `ALLOW_DEMO_LOGIN=true` is set; their public portfolios stay online either way. Because the demo password is shared, only allow demo login where that is acceptable.

## Templates

`developer_terminal`, `minimal_swiss`, `aurora_studio`, `bento_grid`, `fancy_creative`, `simple_professional`.

Preview any portfolio in another template with `?template=<id>` (persists for 24h via cookie; clear it with `?exit_preview=true`), or open `/preview/<id>` to see the demo user in that template. Switch a user's saved template from the CLI:

```bash
pnpm tsx scripts/set-template.ts sarah aurora_studio ocean
```

## Project layout

| Path | Purpose |
|---|---|
| `src/app/(auth)` | Login / register |
| `src/app/(dashboard)/dashboard` | Authenticated CRUD for all content, profile, theme studio, inbox |
| `src/app/(portfolio)/[handle]` | Public portfolio pages and detail routes |
| `src/actions` | Server Actions (zod-validated, scoped to the signed-in user) |
| `src/db/schema` | Drizzle tables; every content table belongs to a user |
| `src/components/templates` | Template components and per-template subpages |
| `src/proxy.ts` | Route protection and template-preview handling (Next 16 `proxy`) |
| `src/lib/rich-text.ts` | Markdown → HTML conversion and HTML sanitizing for user content |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js dev server, production build, production server |
| `pnpm lint` | ESLint |
| `pnpm db:push` | Sync schema straight to a development database (skips migration history; use `db:migrate` for anything shared) |
| `pnpm db:generate` / `db:migrate` | Generate / apply SQL migrations |
| `pnpm db:seed` | Reset and seed all demo portfolios (`--missing-only` to add just the missing ones) |
| `pnpm db:deploy` | The deployment database step: migrate + add missing demo portfolios |
| `pnpm vercel-build` | What Vercel runs: `db:deploy`, then `next build` |
| `pnpm db:studio` | Drizzle Studio |

## Security notes

- `JWT_SECRET` is required in production (minimum 32 characters); the app refuses to sign or verify sessions without it. Development falls back to an insecure placeholder with a warning.
- All user-authored rich text is sanitized (`sanitize-html`) before rendering, so scripts, event handlers and `javascript:` URLs are stripped.

## Deploying to Vercel

The project deploys to Vercel as a standard Next.js app. Its `vercel-build` script (`package.json`) runs the database step before building, so every production deploy is self-contained:

1. **Migrations**: applies any new files from `src/db/migrations` (idempotent, and guarded by a database lock so simultaneous deploys take turns).
2. **Demo portfolios**: adds any demo account that doesn't exist yet (`pnpm db:seed --missing-only`). It never resets or overwrites existing data.
3. `next build`.

If either of the first two steps fails, the build fails and the previous deployment keeps serving.

### Environment variables (Project → Settings → Environment Variables)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Hosted Postgres; use a pooled URL with `?sslmode=require`. |
| `DATABASE_URL_UNPOOLED` | no | Direct URL used for migrations (falls back to `DATABASE_URL`). |
| `JWT_SECRET` | yes | 32+ characters: `openssl rand -base64 48`. |
| `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | for uploads | S3-compatible storage (avatars, covers, article images, CV). |
| `S3_BUCKET`, `S3_PUBLIC_BASE_URL` | no | Bucket name (default `media`) / public base URL (e.g. a CDN). |
| `DEMO_USER_PASSWORD` | no | Shared demo password set when the demo accounts are first created (random if unset). |
| `ALLOW_DEMO_LOGIN` | no | `true` to allow signing into demo accounts in production. |
| `SKIP_DB_SETUP`, `SKIP_DEMO_SEED`, `DB_SETUP_ON_PREVIEW` | no | See below. |

### Switches

- `SKIP_DEMO_SEED=true`: migrate, but don't add demo portfolios (e.g. for a real production site).
- `SKIP_DB_SETUP=true`: build without touching any database.
- **Preview deployments skip the database step by default.** Previews usually share the production `DATABASE_URL`, and a pull request must not migrate production. Give Previews their own database (for example a Neon branch) and set `DB_SETUP_ON_PREVIEW=true` for the Preview environment to have them migrated and seeded too.

### Running the database step by hand

```bash
pnpm db:deploy        # same as a Vercel build: migrate + add missing demo portfolios
pnpm db:migrate       # migrations only
```

### Changing the schema

Edit `src/db/schema/*`, run `pnpm db:generate` to create a migration file, commit it, and the next deploy applies it.
