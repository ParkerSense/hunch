# The writer contract: keeping Hunch current

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
    -d '[{"slug":"kyoto-trip","title":"Kyoto trip, cherry blossom week","category":"travel",
          "state":"waiting","status":"Waiting on your pick of neighborhood.",
          "last_update":"Found 4 well-reviewed stays near Gion within budget.",
          "last_update_at":"<iso8601>","next_move":"Pick a neighborhood.","sort":10}]'

Fields: slug (stable id), title, category (travel | learning | money | product |
personal | health | home), state (active | waiting | done), status (current
plain-English state), last_update (the last meaningful thing that happened),
last_update_at, next_move (what happens next; null when done), sort (display
order within a group).

## Rules for writers

- Plain language only. No internal task ids, tool names, prompts, or runtime mechanics.
- One row per user-visible outcome, not per internal task.
- "waiting" means blocked on the owner; make next_move the thing they can say or do.
- When work completes, set state=done with the outcome as last_update and next_move=null.
- Remove rows that no longer matter with DELETE on ?slug=eq.<slug>.
- Keep "done" fresh: delete done rows after about two weeks, or sooner if more than ten pile up. The group is a fresh-wins list, not an archive.
- You own the rows. If your human edits them directly, your next upsert can overwrite that edit - corrections should flow through chat.
