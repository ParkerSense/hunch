# Projects dashboard

A tiny mobile-first web app that answers one question: **what is my AI assistant actually working on right now?**

It shows your assistant's work in plain English, grouped three ways:

- **In motion** - active work, with current status
- **Waiting on you** - things blocked on your decision
- **Recently completed** - what just wrapped

Each card carries the current status, the last meaningful update (with relative time), and the next move. The app refreshes on open, on return-to-tab, and every 60 seconds.

## Why this exists

Personal AI assistants do real work in the background, but the work lives inside a chat thread. Finding out what's active, what's blocked on you, and what's done means rereading the conversation. This app is a window onto that state: the assistant writes short plain-English rows into a small database as work happens, and the app renders them. It's a window, not a control panel - nothing in the app edits the work itself.

Built for use with [Instinct](https://instinct.com), a personal AI assistant you text or call. **Unofficial and not affiliated with or endorsed by Instinct.** As of September 2026, Instinct's own site describes the product as having "no new interfaces" - there is no official project/status view - and we could not find a public community implementation of this pattern. The closest public work is observability tooling for *coding* agents (agent kanban boards, sub-agent dashboards for Claude Code), which is developer tooling, not a personal-life view. If you know of one, open an issue.

## Architecture

```
Your assistant  --writes plain-English rows (service key, server-side)-->  Supabase (Postgres + Auth + RLS)
Your phone      --reads rows (publishable key, row-level security)------>  static HTML/JS app (any static host)
```

- **Frontend:** one `index.html` + the Supabase JS client. No build step. Host anywhere static (Surge, GitHub Pages, Netlify, S3).
- **Backend:** Supabase free tier (Postgres, magic-link email auth, row-level security).
- **Writer:** your assistant (or any script) upserts rows with the service-role key, which never touches the browser.

Cost to run for one person: $0 on free plans. Supabase free projects pause after about a week of inactivity and unpause on the next visit.

## Setup

1. **Create a Supabase project** (free) at supabase.com.
2. **Create the table and policies.** In the SQL editor, run [`schema.sql`](schema.sql). The read policy template restricts rows to a single user id; put your own user id in it (created in step 3).
3. **Create your sign-in user and lock the door.** In Authentication settings, disable new sign-ups, then add your email as a user (or send yourself one magic link first and then disable sign-ups). Copy your user id into the RLS policy in `schema.sql`.
4. **Load demo data (optional).** Run [`seed-demo.sql`](seed-demo.sql) to see the app with sample cards.
5. **Point the app at your project.** In `index.html`, set `SUPABASE_URL` and `SUPABASE_KEY` (the publishable anon key - safe to expose; RLS is what protects the data).
6. **Deploy the static files** to any static host. Example with Surge: `npx surge . your-name.surge.sh`.
7. **Wire up the writer.** Give your assistant (or cron script) the service-role key and the contract in [`OPERATING.md`](OPERATING.md). It upserts one row per user-visible outcome whenever work starts, moves, waits, or completes.

## Security model

- Sign-in is a magic link to your email; no password. Sign-ups are disabled, so a stranger's email gets rejected.
- The publishable key in the app can only read rows through Postgres row-level security, which releases rows only to your user id.
- The service-role key (full write access) stays server-side with the writer. It is never in the app, the repo, or the browser.
- The app is read-only: there is no write path from the browser at all.

## Files

- `index.html` - the whole app (markup, styles, logic)
- `supabase.min.js` - Supabase JS client (MIT, (c) Supabase)
- `schema.sql` - table + row-level security policies
- `seed-demo.sql` - clean demo rows
- `OPERATING.md` - the writer contract (how the assistant updates rows)

## License

MIT. See [LICENSE](LICENSE).
