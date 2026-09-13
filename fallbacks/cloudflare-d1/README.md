# Parked fallback: Cloudflare Worker + D1 backend

A working third backend, kept for the day someone truly needs querying,
audit logs, or per-reader bearer tokens without Supabase. Not part of the
default product.

- `worker.js` - GET /projects behind a read token, POST /projects upsert
  behind a separate write token; tokens travel in the Authorization header
  only; no-store + nosniff responses. API-tested on the real workerd
  runtime (local `wrangler dev` + local D1): auth rejections, inert JSON,
  read-token-cannot-write, upsert/readback, SQL export, row delete.
- Local dev needs no Cloudflare account: `npm i wrangler`, apply the
  schema with `wrangler d1 execute --local`, run `wrangler dev --local`.
- Remote provisioning is scriptable once an account and API token exist:
  `wrangler d1 create`, `wrangler deploy`, `wrangler secret put`.

Honest caveat: D1 stores plaintext at the vendor - the same trust position
as Supabase, worse than the encrypted snapshot. Prefer the snapshot; use
this only when its query/audit properties are a real requirement.
