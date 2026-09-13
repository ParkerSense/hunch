# Contributing

Small, focused contributions are welcome. The project is deliberately tiny:
one `index.html`, one publisher script, no build step, no framework, no
runtime dependencies. Contributions that keep it that way are the ones that
get merged.

## Ground rules

- **No build step and no dependencies.** The app must keep working as a
  single static file on any dumb host. `supabase.min.js` is the one vendored
  exception, used only by the optional backend.
- **Privacy is a feature.** No analytics, trackers, or third-party requests.
  New network calls beyond the owner's own backend will not be merged.
- **Read-only stays read-only.** The page never edits the work it shows.
- **The agent contract is real.** `AGENTS.md` and `WRITER.md` are read and
  acted on by AI assistants setting up and writing to Hunch. Changes to
  data shape, snapshot format, or publish flow must update both.

## Working on it

- Edit `index.html` directly - it is markup, styles, and logic in one file.
- Bump `APP_VERSION` in `index.html` on any user-visible change: installed
  copies reload themselves when the host serves a newer shell.
- Run the checks before opening a PR: `npm test` (or `node --test
  'test/*.test.mjs'`). They cover the encrypted publish round-trip, key
  rotation, and failure behavior of `publish.mjs`.
- Screenshots and the social card live in `assets/`; refresh them when the
  design changes.

## Bugs and ideas

Open an issue. For security problems, use [SECURITY.md](SECURITY.md)
instead - never a public issue.
