# Security policy

Hunch is a privacy-sensitive project: the whole point is that a page full of
personal context stays private. Reports are taken seriously.

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

- Preferred: use GitHub's private vulnerability reporting on this repository
  (Security tab -> Report a vulnerability).
- If that is unavailable to you, open a minimal public issue saying you have
  a security report to share, without details, and we will open a private
  channel.

Please include: the affected backend (encrypted snapshot, Supabase, or the
D1 fallback), the file or flow involved, and a way to reproduce what you
found. Synthetic data only - never someone else's live dashboard link or
snapshot in a report.

## Scope notes

- The demo at hunch-app.pages.dev contains fictional data only.
- The `#k` dashboard link is a bearer credential by design; that tradeoff is
  documented in the README's security model. Reports about *weakening* that
  model (e.g. the key leaking somewhere it should not) are in scope; the
  existence of the bearer-link design itself is a documented decision.
- `snapshot.enc` is ciphertext at rest on the host by design.

## What to expect

An acknowledgement within a few days, a plain-English assessment, and a fix
or a documented decision. Credit in the release notes if you want it.
