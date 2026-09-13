<div align="center">

<img src="assets/logo.svg" width="72" alt="Hunch logo">

# Hunch

**What is your AI assistant actually doing right now?**

One private page that answers it in ten seconds:
what's in motion, what's waiting on you, and what just wrapped.

[Live demo](https://hunch.surge.sh) · [Setup](#setup) · [How it works](#how-it-works) · [Security](#security-model)

![Hunch on a phone](assets/screenshot-mobile.png)

[![License: MIT](https://img.shields.io/badge/license-MIT-8a7dff.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-3ecf8e.svg)](#setup)
[![Backend: Supabase](https://img.shields.io/badge/backend-Supabase-5ea2ff.svg)](#setup)

</div>

## Why this exists

Personal AI assistants do real work in the background, but the work lives inside a chat thread. Finding out what's active, what's blocked on you, and what's done means rereading the conversation. Hunch is a window onto that state: the assistant writes short plain-English rows into a tiny database as work happens, and this page renders them. It's a window, not a control panel — nothing in the app edits the work itself.

Built for use with [Instinct](https://instinct.com), a personal AI assistant you text or call. **Hunch is unofficial — not affiliated with or endorsed by Instinct.** The name is a synonym, not a claim.

## The demo

**[hunch.surge.sh](https://hunch.surge.sh)** opens with demo data — no account, no setup. That's the whole product in one glance. When you want your own, "Make it yours" walks you through connecting a backend.

## Setup

Ten minutes, $0, no build step. You need a free [Supabase](https://supabase.com) project and any place to put one static file (or just use the hosted build).

1. **Create a Supabase project** (free) at [supabase.com](https://supabase.com).
2. **Run [`setup.sql`](setup.sql)** in the Supabase SQL editor. It creates the table, locks it to you with row-level security, and seeds demo rows. Put your own user id in the policy where marked.
3. **Add your sign-in user.** In Authentication settings, disable new sign-ups, then add your email as a user.
4. **Connect the app.** Open the hosted build (or your own copy of `index.html` anywhere static), choose *Make it yours*, and paste your project URL + publishable anon key. They live only in your browser's local storage.
5. **Wire up the writer.** Hand your assistant the service-role key and [`WRITER.md`](WRITER.md). It upserts one plain-English row per user-visible outcome as work starts, moves, waits, or completes.

That's it. The publishable key is safe to sit in a browser — row-level security is what guards your rows. The service-role key (full write access) never touches the app, the repo, or the browser.

<details>
<summary>Prefer to self-host the page?</summary>

It's one `index.html` plus the vendored Supabase client. Drop both on any static host — GitHub Pages, Netlify Drop, S3, or `npx surge . your-name.surge.sh`. No bundler, no framework, no environment variables: connection settings are entered in the app, not the code.

</details>

## How it works

```
Your assistant  ── writes plain-English rows (service key, server-side) ──▶  Supabase (Postgres + Auth + RLS)
Your phone      ── reads rows (publishable key, row-level security) ──────▶  one static page (host anywhere)
```

- **Frontend:** one `index.html`. No build step.
- **Backend:** Supabase free tier (Postgres, magic-link email auth, row-level security).
- **Writer:** your assistant, or anything that can POST to a REST endpoint.

Cost to run for one person: **$0** on free plans. (Supabase free projects pause after about a week of inactivity and unpause on the next visit.)

## Security model

- Sign-in is a magic link to your email; no passwords. Sign-ups are disabled, so a stranger's email gets rejected.
- Postgres row-level security releases rows only to your user id — even holding the publishable key, nobody else can read them.
- The service-role key stays server-side with the writer. Never in the page, the repo, or the browser.
- The app is read-only: there is no write path from the browser at all.
- The hosted build at hunch.surge.sh is byte-identical to `index.html` in this repo; your connection settings never leave your browser. Self-host if you'd rather not trust a hosted copy.

## Why "Hunch"?

It's a synonym for instinct — and an honest label for an unofficial companion. As of September 2026, Instinct's own site describes the product as having "no new interfaces," and we found no public project/status view for personal AI assistants. The closest public work is observability tooling for *coding* agents (agent kanban boards, sub-agent dashboards), which is developer tooling, not a personal-life view. If you know of one, open an issue.

## Files

- `index.html` — the whole app (markup, styles, logic, demo mode, setup flow)
- `supabase.min.js` — Supabase JS client (MIT, © Supabase)
- `setup.sql` — table + row-level security + demo rows, in one idempotent file
- `WRITER.md` — the writer contract (how the assistant updates rows)
- `assets/` — logo and screenshots

## License

[MIT](LICENSE). Take it, rename it, make it yours.
