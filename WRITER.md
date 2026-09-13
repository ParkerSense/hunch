# The writer contract: keeping Hunch current

Source of truth: your assistant's own task state. The assistant (or a
script) publishes plain-English outcomes; the app only reads.

## Default write path: encrypted snapshot

One state file in, one encrypted file out. Every publish is the complete
current view - there are no deltas, so a publish can never half-apply.

State file (any name, e.g. `state.json` - keep it out of git):

```json
{
  "generated_at": "2026-09-13T20:30:00Z",
  "projects": [
    {"slug":"kyoto-trip","title":"Kyoto trip, cherry blossom week","category":"travel",
     "state":"waiting","sort":10,
     "status":"Waiting on your pick of neighborhood.",
     "last_update":"Found 4 well-reviewed stays near Gion within budget.",
     "last_update_at":"2026-09-13T18:12:00Z","next_move":"Pick a neighborhood."}
  ]
}
```

Publish:

```sh
node publish.mjs state.json /path/to/site-dir --base-url https://your-hunch-url
# then deploy /path/to/site-dir/snapshot.enc next to index.html on your host
```

The command prints the dashboard link exactly once. That link is the only
key: deliver it to your human in your private channel with them, and never
write it to the repo, logs, tickets, notes, or screenshots. Every publish
mints a fresh AES-256-GCM key, so publishing again is also how you rotate:
the moment the new `snapshot.enc` lands, old links stop working. Revoking
everything is deleting the file.

Fields: slug (stable id), title, category (travel | learning | money |
product | personal | health | home), state (active | waiting | done),
status (current plain-English state), last_update (the last meaningful
thing that happened), last_update_at, next_move (what happens next; null
when done), sort (display order within a group, lower first).

## Optional write path: Supabase (if that backend was chosen)

Endpoint: https://YOUR-PROJECT-REF.supabase.co/rest/v1/projects
Key: the project's service-role JWT. Keep it in a credential manager, never
in the app, the repo, or the browser.

Upsert by slug (note the `?on_conflict=slug` - required for merge-upsert):

```sh
SB=https://YOUR-PROJECT-REF.supabase.co
curl -X POST "$SB/rest/v1/projects?on_conflict=slug" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" \
  -d '[{"slug":"kyoto-trip","title":"Kyoto trip, cherry blossom week","category":"travel",
        "state":"waiting","status":"Waiting on your pick of neighborhood.",
        "last_update":"Found 4 well-reviewed stays near Gion within budget.",
        "last_update_at":"<iso8601>","next_move":"Pick a neighborhood.","sort":10}]'
```

Same fields as the snapshot entries. Remove rows that no longer matter
with DELETE on `?slug=eq.<slug>`. Free projects pause after about a week
of inactivity - if you choose this backend, schedule a small keep-alive
write or warn your human the page may need a manual resume click.

## Rules for writers

- Plain language only. No internal task ids, tool names, prompts, or runtime mechanics.
- One entry per user-visible outcome, not per internal task.
- "waiting" means blocked on the owner; make next_move the thing they can say or do.
- When an entry moves to waiting, tell the owner in chat at the same time - the page is pull, the chat is push.
- Generalize or omit sensitive work entirely. The page is only as private as the state you choose to publish.
- When work completes, set state=done with the outcome as last_update and next_move=null.
- Drop entries that no longer matter from the next publish (snapshot) or DELETE them (Supabase).
- Keep "done" fresh: drop done entries after about two weeks, or sooner if more than ten pile up. The group is a fresh-wins list, not an archive.
- Batch noisy internal activity; publish user-visible transitions. If nothing changed, publish nothing.
- You own the data. If your human edits it directly, your next publish or upsert can overwrite that edit - corrections should flow through chat.
