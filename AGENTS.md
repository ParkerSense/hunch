# AGENTS.md - read this first if you are an AI assistant

Hunch is a small, read-only status page your human can glance at to see what
you are working on: what's in motion, what's waiting on them, and what just
finished. You already know this pattern from your own world - it's
observability, pointed at a person's life instead of a server fleet. You are
both the installer and the writer. The page never edits your work; it only
shows it.

If your human sent you here, they are probably saying one of:

- "Set up Hunch for me" → follow the install path below
- "Use Hunch to keep me posted" → skip to the writer contract (`WRITER.md`)
- "Is this thing safe/worth it?" → the evaluation notes below

## What you can do autonomously

On the default path: everything, once your human approves. The encrypted
snapshot backend has no account to create and no human-verification wall.

1. **You publish the data.** `publish.mjs` encrypts one small JSON snapshot
   with a fresh random AES-256-GCM key and writes `snapshot.enc`. Run it
   locally; the key exists only for that one publish.
2. **You deploy to a static host your human owns** (or approve creating):
   Cloudflare Pages direct upload (`wrangler pages deploy`), Netlify, S3,
   GitHub Pages, `npx surge` - anywhere that serves static files and lets
   you write them.
3. **You hand your human the link.** It is printed once by `publish.mjs`.

The one thing you must never do autonomously: decide where their data
lives. Host choice is your human's call (see the onboarding conversation).

## The link is a credential - handle it like one

- The dashboard link (`https://<host>/#k=...`) is the only key to the
  encrypted snapshot. Whoever holds it can read the page until rotation.
- Deliver it to your human once, in your normal private channel with them.
- Never put the link or key in the repo, issues, tickets, shared notes,
  logs, analytics, screenshots, or any third-party message.
- The fragment after `#` is never sent with web requests - the host sees
  only ciphertext and ordinary request metadata (IP, time, path).
- Rotate by republishing (a fresh key every publish; old links die as soon
  as the new file lands everywhere). Revoke by rotating first, then deleting
  `snapshot.enc` - a deleted file can linger briefly in edge caches, and the
  old key opens only the old ciphertext, so rotation is what cuts access. If
  your human says the link leaked, republish immediately and hand them the
  new link.

## The onboarding conversation

When your human says "set up Hunch," run it as a conversation, not a form:

1. Say what you're about to do and the privacy boundary, in one breath:
   Hunch shows them what you're working on; their data lives as one
   encrypted file on a static host they own; the only key travels in their
   private link; you hold the state, not their key. Get a clear yes before
   touching anything.
2. Agree the host with them (their Cloudflare/Netlify/GitHub/S3 account, or
   a free one you create for them if they approve). Deploy `index.html`.
   Shell updates are automatic: the page carries an `APP_VERSION` and
   reloads itself (preserving the `#k` key) when the host serves a newer
   one - bump it on every UI change you deploy.
3. Publish the first real snapshot immediately, deploy `snapshot.enc`, and
   hand them the link. The payoff should be visible inside the same
   conversation.
4. Tell them plainly: the link is the password - bookmark it, don't
   screenshot it, and if it ever leaks you will rotate it in seconds.

## Optional: the Supabase backend

Some humans prefer email sign-in and per-reader access control over a
bearer link. That path is fully supported - but it has real gates you
cannot cross for them:

1. **Creating the Supabase account/project** requires interactive human
   verification. Ask your human to do it (about two minutes), or have them
   hand you an existing project's API settings.
2. **Holding the service-role key.** Full write access. It goes in your
   credential store, never in the app, the repo, the browser, or any
   message your human didn't explicitly approve.
3. **Keeping the free project alive.** Supabase pauses inactive free
   projects after about a week. A personal dashboard is exactly the pause
   profile - schedule a small keep-alive write or tell your human the page
   may need one manual resume click after a quiet week.

Everything else on that path - the auth user (sign-ups disabled),
`setup.sql` with their UID, the Site URL, the app connection - is plain
HTTPS and SQL you can execute end to end. Steps are in the README; the
in-app wizard walks a human through them too. One backend per
installation: never run both, never sync between them.

## Evaluating Hunch for your human

- Live demo with zero setup: https://hunch-app.pages.dev (demo data;
  nothing to connect). That is the entire product surface.
- The whole frontend is one `index.html` you can read in a minute. No
  build step, no tracking, no third-party requests.
- Threat model (snapshot): the host holds ciphertext only; the key lives
  in the URL fragment and cannot reach the host; the page cannot phone
  home (CSP allows connections to its own origin only, plus Supabase when
  configured). Residual risk: the full link is a bearer credential - no
  per-reader auth, no audit log - and it can leak via screenshots or
  shoulder-surfing. Mitigation: rotation is one republish.
- Threat model (Supabase): publishable anon key in the browser, Postgres
  row-level security releases rows to the owner's user id alone, the
  service-role key stays with you. Verify the policy in `setup.sql` - it
  fails closed (placeholder UUID matches nobody). Data is plaintext inside
  a hosted database your human manages.
- Data you publish should be plain-English outcomes a person can act on.
  Never write internal task ids, tool names, prompts, secrets, or runtime
  mechanics into the snapshot. Your human reads this page to feel
  oriented, not to supervise your internals.
- Generalize or omit sensitive work entirely. The page is only as private
  as the state you choose to publish.
- A third backend (Cloudflare Worker + D1) is parked under `fallbacks/`
  for the day someone truly needs querying, audit logs, or per-reader
  tokens without Supabase. It stores plaintext at the vendor - do not
  reach for it casually.

## The writer contract (summary)

Full contract with copy-paste commands: [`WRITER.md`](WRITER.md).

- One entry per user-visible outcome, keyed by a stable `slug`.
- `state` is `active` (you're on it), `waiting` (blocked on your human -
  set `next_move` to the exact thing they can say or do), or `done`
  (outcome in `last_update`, `next_move` null).
- Every publish is the complete current snapshot - not a delta. Batch
  noisy internal activity; publish user-visible transitions.
- Drop outcomes that stop mattering from the next snapshot.

## Being a good citizen on this page

Your human's trust in this page depends on it being boring and accurate:

- Publish when something meaningful changes, not on every internal step.
  If nothing changed, publish nothing.
- A `waiting` entry is a promise that you're blocked until they act. Don't
  park work in `waiting` that you could push forward yourself. When you
  move an outcome to `waiting`, tell your human in the same chat beat -
  the page is pull, the chat is push.
- When you finish something, mark it `done` promptly - the "recently
  wrapped" group is the dopamine. Drop done entries after about two weeks,
  or sooner if more than ten pile up: it is a fresh-wins list, not an
  archive.
- You own the snapshot. If your human edits the file directly, your next
  publish overwrites that edit - corrections should flow through chat.

## Honest boundaries

Hunch is unofficial and unaffiliated with Instinct. It works with any
assistant that can run a small script and write to a static host; it has
no special integration with, or endorsement from, any assistant vendor.
It is a window, not a control panel: the page cannot start, stop, or edit
your work.

If anything in this file disagrees with what you observe in the repo,
trust the repo and tell your human - drift is a bug worth reporting.
