# Biyahe — PH Toll Cost Tracker

A **Progressive Web App** (React + Vite + MUI) that estimates how much it costs
to travel Philippine **expressways and skyways** (NLEX, SLEX, Skyway, CAVITEX,
CALAX, TPLEX, SCTEX, STAR…). You enter an **origin and destination place** and it
snaps each to the nearest expressway entry/exit and totals the toll — routing
across connected expressways (e.g. **Baguio → Clark** via TPLEX + SCTEX). Prices
are refreshed by an **admin-only crawler** that reads the TRB-approved toll
matrices republished on [expressway.ph](https://www.expressway.ph/toll-matrix).

The public app needs **no password**; only the crawler at `/admin` is protected.

---

## Features

- 🗺️ **Place-to-place estimator** — type a city for origin & destination; the app
  finds the nearest entry and exit interchanges and computes the cheapest tolled
  route across the expressway network (Dijkstra over a junction graph).
- 🧮 **Vehicle classes** — Class 1/2/3 with per-expressway multipliers, per-leg
  breakdown and grand total.
- 📶 **RFID guidance** — each expressway is tagged Easytrip (MPTC) or Autosweep
  (SMC); a trip shows which sticker(s) you need and the **toll subtotal per RFID
  account**, so you know how much to load onto each.
- 🔒 **Admin-only crawler** — `/admin` is **not linked** in the UI (reach it by
  typing the URL) and is protected by a bcrypt-checked password; the session is
  an HttpOnly, signed JWT cookie.
- 🕷️ **Resilient crawler** — pluggable per-operator adapters fetch and parse
  live matrices; a curated **seed dataset** is the always-available fallback, and
  a source only updates when its parsed data matches known interchanges.
- 📴 **Installable PWA** — offline app shell + last-known prices via a service
  worker, manifest, and theming.
- ☁️ **Runs two ways** — a single `npm run dev` locally (the `api/` functions are
  mounted inside Vite), and as real serverless functions on Vercel.

## Quick start

```bash
npm install
cp .env.example .env     # defaults already work for local dev
npm run dev              # http://localhost:5173
```

Open the app → pick **From** (e.g. Baguio City) and **To** (e.g. Clark / Angeles)
→ see the estimated toll. To refresh prices, visit **`/admin`** directly, enter
the admin password (default `admin-2026`, set in `.env`), then **Crawl all
sources now**.

## Scripts

| Script                            | What it does                                    |
| --------------------------------- | ----------------------------------------------- |
| `npm run dev`                     | Vite dev server + in-process API                |
| `npm run build`                   | Type-check then production build to `dist/`     |
| `npm run preview`                 | Preview the production build                    |
| `npm run typecheck`               | `tsc --noEmit`                                   |
| `npm run crawl [-- <id>]`         | Run the crawler from the CLI (e.g. `-- nlex`)   |
| `npm run hash-password -- "<pw>"` | Print a bcrypt hash for `*_PASSWORD_HASH`       |

## Configuration (`.env`)

| Var                          | Purpose                                                   |
| ---------------------------- | --------------------------------------------------------- |
| `JWT_SECRET`                 | Signs the admin session cookie. **Long & random in prod.**|
| `ADMIN_PASSWORD`             | Plaintext admin password (dev). Hashed in memory at boot. |
| `ADMIN_PASSWORD_HASH`        | bcrypt hash; **takes precedence** — use in production.     |
| `SESSION_TTL_HOURS`          | Admin session lifetime (default 12).                      |

Generate a production hash:

```bash
npm run hash-password -- "your-strong-password"
# put the output in ADMIN_PASSWORD_HASH
```

## Architecture

```
shared/toll.ts        Domain model + pricing + routing + zod schemas (client AND server)
api/                  Vercel-style serverless functions
  auth/               admin / session / logout
  tolls.ts            GET dataset (public)
  admin/crawl.ts      POST trigger crawl (admin-gated)
  admin/status.ts     GET source freshness (admin-gated)
  _lib/               auth, env, store, and the crawler
    crawler/          fetch → parse (cheerio) → adapters → orchestrator
    data/seed.ts      curated fallback dataset (fares + coordinates)
src/                  React + MUI PWA
  data/places.ts      offline gazetteer for origin/destination search
  pages/CalculatorPage.tsx   place-to-place route planner
vite.config.ts        Vite + PWA + a plugin that runs api/ locally
```

### Pricing & routing model

Each interchange stores a **cumulative Class-1 toll** from its expressway's
reference origin plus a lat/lng. The Class-1 fare between two interchanges is the
absolute difference of their cumulative values; Class 2/3 multiply by a
per-expressway factor.

`planRoute` snaps the origin/destination to their nearest interchanges, builds a
graph (consecutive interchanges within an expressway + free transfer edges at the
junctions in `CONNECTIONS`), and runs **Dijkstra** to find the cheapest-toll
path — so a trip can span multiple expressways.

### The crawler

`runCrawl()` fetches each expressway's `sourceUrl` (browser-like User-Agent,
bounded timeout, size cap, retry-with-backoff), parses the expressway.ph fare
matrix, and **only** updates interchanges it can confidently match — otherwise
the previous data is kept. It is exposed at `POST /api/admin/crawl` (admin only)
and via `npm run crawl` (optionally `npm run crawl -- <id>`).

Each expressway.ph page is a triangular **entry × exit** grid (three tables for
Class 1/2/3). The parser (`api/_lib/crawler/parse.ts`) reads a single **origin
column** — the fare from that expressway's reference plaza to every exit — which
maps directly onto the cumulative-fare model. The origin plaza per source lives
in `api/_lib/crawler/adapters.ts`. Rows are matched onto interchanges **by name**,
so each interchange `name` in `seed.ts` is spelled exactly as on the page. A
source needs ≥2 matched interchanges to be trusted; matching many but changing
none reports **"already current"** (a success, not a failure).

> The sources sit behind a CDN that rate-limits bursts, so the crawler spaces
> requests and retries transient blocks. SCTEX shares the NLEX page (its
> "Tipo/Subic" column); expressway.ph's CALAX matrix is Laguna-side only and its
> Skyway matrix is a flat two-tier grid — both are modelled with the plazas the
> source publishes.

> **⚠️ Resetting after a seed change:** the crawler reads and writes the
> persisted store (`data/tolls.store.json`), which **shadows `seed.ts`** once it
> exists. After editing `seed.ts` (URLs, names, fares), delete
> `data/tolls.store.json` so the new seed is loaded — otherwise the crawl keeps
> operating on the old stored dataset.

## Deploying to Vercel

The repo is Vercel-ready (`vercel.json`): the SPA builds to `dist/` and every
file under `api/**/*.ts` becomes a function. Set `JWT_SECRET`,
`SITE_PASSWORD_HASH`, and `ADMIN_PASSWORD_HASH` as project env vars.

> **Note on persistence:** the crawl store (`api/_lib/store.ts`) writes JSON to
> disk locally and to `/tmp` on serverless (ephemeral). For durable crawled
> prices in production, back `readStore`/`writeStore` with a KV/DB — the seam is
> intentionally isolated to that one file.

## Disclaimer

Toll figures are **estimates for trip planning**. Always confirm the exact fare
at the toll plaza. Rates come from the **Toll Regulatory Board (TRB)** approved
matrices, republished in fetchable form on
[expressway.ph](https://www.expressway.ph/toll-matrix) and linked in the app.
The shipped seed values are indicative until an admin crawl refreshes them.
