# Operating: keeping the dashboard current

Source of truth: your assistant's own task state. The assistant (or a script)
writes plain-English rows into the `projects` table; the app only reads.

## Write path (service role, server-side only)

Endpoint: https://YOUR-PROJECT-REF.supabase.co/rest/v1/projects
Key: the project's service-role JWT. Keep it in a credential manager, never in
the app, the repo, or the browser.

Upsert by slug (note the `?on_conflict=slug` - required for merge-upsert):

  SB=https://YOUR-PROJECT-REF.supabase.co
  curl -X POST "$SB/rest/v1/projects?on_conflict=slug" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" \
    -d '[{"slug":"lisbon-trip","title":"Lisbon trip, Nov 12-16","category":"travel",
          "state":"waiting","status":"Waiting on your pick of neighborhood vibe.",
          "last_update":"Found 3 well-reviewed hotels near Principe Real.",
          "last_update_at":"<iso8601>","next_move":"Pick a vibe.","sort":10}]'

Fields: slug (stable id), title, category (travel|learning|money|product|personal),
state (active|waiting|done), status (current plain-English state),
last_update (the last meaningful thing that happened), last_update_at,
next_move (what happens next; null when done), sort (display order).

## Rules for writers

- Plain language only. No internal task ids, tool names, prompts, or runtime mechanics.
- One row per user-visible outcome, not per internal task.
- When work completes, set state=done with the outcome as last_update.
- Remove rows that no longer matter with DELETE on ?slug=eq.<slug>.
