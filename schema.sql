-- Projects dashboard: table + row-level security
-- Run in the Supabase SQL editor, then set YOUR-USER-UUID below
-- (Authentication > Users > your user > copy UID).

create table if not exists public.projects (
  slug text primary key,             -- stable id used for upserts, e.g. 'lisbon-trip'
  title text not null,               -- 'Lisbon trip, Nov 12-16'
  category text not null default 'personal', -- travel | learning | money | product | personal
  state text not null default 'active',      -- active | waiting | done
  status text not null,              -- current plain-English state
  last_update text not null,         -- the last meaningful thing that happened
  last_update_at timestamptz not null default now(),
  next_move text,                    -- what happens next; null when done
  sort int not null default 50       -- display order within a group
);

alter table public.projects enable row level security;

-- Reads: only your signed-in user can read rows.
-- Replace YOUR-USER-UUID with your own Supabase user id.
create policy "owner read only"
  on public.projects for select
  to authenticated
  using (auth.uid() = 'YOUR-USER-UUID');

-- No insert/update/delete policies for authenticated users:
-- writes happen only with the service-role key (server-side writer),
-- which bypasses RLS. The browser has no write path at all.
