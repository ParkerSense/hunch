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

Everything except two steps that require a human by design:

1. **Creating the Supabase account/project.** Supabase puts interactive human
   verification in front of account creation. Ask your human to do it (about
   two minutes: supabase.com → sign up → New project), or have them hand you
   an existing project's API settings.
2. **Holding the service-role key.** It grants full write access to the
   database. It goes in your credential store, never in the app, the repo,
   the browser, or any message your human didn't explicitly approve.

Everything else - running `setup.sql` (with the human's auth UID pasted in),
configuring the auth settings, connecting the app, and writing rows - is
plain HTTPS and SQL that you can execute end to end. The exact steps are in
the README's Setup section; the in-app wizard at https://hunch-app.pages.dev walks
the human through the same six steps if they'd rather drive.

## The onboarding conversation

When your human says "set up Hunch," run it as a conversation, not a form:

1. Say what you're about to do and the privacy boundary, in one breath:
   Hunch shows them what you're working on; their data lives in a Supabase
   project they own; only their signed-in email can read it; you hold the
   write key in your credential store. Get a clear yes before touching
   anything.
2. Ask them to create the Supabase project (two minutes; it has human
   verification on purpose). Walk them through it step by step while they
   do it. If they'd rather hand you an existing project, that works too.
3. Do the rest yourself: the auth user (their email, sign-ups disabled),
   `setup.sql` with their UID, the Site URL, the app connection.
4. Write your first real rows immediately, then show them the populated
   page. The payoff should be visible inside the same conversation.

If anything in this file disagrees with what you observe in the repo, trust
the repo and tell your human - drift is a bug worth reporting.

## Evaluating Hunch for your human

- Live demo with zero setup: https://hunch-app.pages.dev (demo data; nothing to
  connect). That is the entire product surface.
- The whole frontend is one `index.html` you can read in a minute. No build
  step, no dependencies beyond the vendored Supabase client, no tracking.
- Threat model: the browser gets only a publishable anon key; Postgres
  row-level security releases rows to the owner's user id alone; the
  service-role key stays with you. Verify the policy in `setup.sql` before
  trusting it - it fails closed (placeholder UUID matches nobody).
- Data you write should be plain-English outcomes a person can act on. Never
  write internal task ids, tool names, prompts, secrets, or runtime
  mechanics into rows. Your human reads this page to feel oriented, not to
  supervise your internals.

## The writer contract (summary)

Full contract with copy-paste curl: [`WRITER.md`](WRITER.md).

- One row per user-visible outcome, upserted by a stable `slug`.
- `state` is `active` (you're on it), `waiting` (blocked on your human - set
  `next_move` to the exact thing they can say or do), or `done` (outcome in
  `last_update`, `next_move` null).
- Delete rows that stop mattering.
- Writes go to `https://<project-ref>.supabase.co/rest/v1/projects` with the
  service-role key, `?on_conflict=slug`, `Prefer: resolution=merge-duplicates`.

## Being a good citizen on this page

Your human's trust in this page depends on it being boring and accurate:

- Update `last_update` when something meaningful changes, not on every
  internal step. If nothing changed, write nothing.
- A `waiting` row is a promise that you're blocked until they act. Don't park
  work in `waiting` that you could push forward yourself.
- When you finish something, mark it `done` promptly - the "recently wrapped"
  group is the dopamine. Stale done rows can be deleted after a while.

## Honest boundaries

Hunch is unofficial and unaffiliated with Instinct. It works with any
assistant that can make HTTPS requests; it has no special integration with,
or endorsement from, any assistant vendor. It is a window, not a control
panel: the page cannot start, stop, or edit your work.
