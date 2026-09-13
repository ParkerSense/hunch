-- Hunch: one-file setup. Run this whole file in the Supabase SQL editor
-- (SQL Editor > New query > paste > Run).
--
-- It creates the projects table, locks it to a single owner with row-level
-- security, and seeds demo rows so the app has something to show.
--
-- AFTER RUNNING: replace 'YOUR-USER-UUID' in the policy below with your own
-- user id (Authentication > Users > your user > copy UID), then re-run the
-- CREATE POLICY statement (or the whole file - it is idempotent).

create table if not exists public.projects (
  slug text primary key,                  -- stable id used for upserts, e.g. 'kyoto-trip'
  title text not null,                    -- 'Kyoto trip, cherry blossom week'
  category text not null default 'personal', -- travel | learning | money | product | personal | health | home
  state text not null default 'active',   -- active | waiting | done
  status text not null,                   -- current plain-English state
  last_update text not null,              -- the last meaningful thing that happened
  last_update_at timestamptz not null default now(),
  next_move text,                         -- what happens next; null when done
  sort int not null default 50            -- display order within a group
);

alter table public.projects enable row level security;

-- Reads: only your signed-in user can read rows.
-- Replace YOUR-USER-UUID with your own Supabase user id before creating the policy.
drop policy if exists "owner read only" on public.projects;
create policy "owner read only"
  on public.projects for select
  to authenticated
  using (auth.uid() = 'YOUR-USER-UUID');

-- No insert/update/delete policies for authenticated users on purpose:
-- writes happen only with the service-role key (your assistant, server-side),
-- which bypasses RLS. The browser has no write path at all.

-- Demo rows (safe to delete once your assistant is writing real ones).
insert into public.projects (slug, title, category, state, status, last_update, last_update_at, next_move, sort) values
  ('kyoto-trip', 'Kyoto trip, cherry blossom week', 'travel', 'waiting',
   'Waiting on your pick of two ryokan neighborhoods.',
   'Found 4 well-reviewed machiya stays near Gion within budget; two hold sunset views.',
   now() - interval '2 hours', 'Tell your assistant: Gion or Arashiyama.', 10),
  ('half-marathon', 'Half-marathon training', 'health', 'active',
   'Week 6 of 12 underway; long run is tomorrow.',
   'Logged Tuesday intervals and adjusted Sunday''s route to 11 miles.',
   now() - interval '5 hours', 'Your assistant checks in after tomorrow''s run.', 20),
  ('apartment-hunt', 'Apartment hunt, West Village', 'home', 'active',
   'Watching new listings against your must-haves.',
   'Two new 1-beds match on light and budget; tour slots requested for Saturday.',
   now() - interval '26 hours', 'Confirm Saturday tour times when the broker replies.', 30),
  ('passport', 'Passport renewal', 'personal', 'done',
   'Renewed and delivered.',
   'New passport arrived; old one returned separately. Global Entry carried over.',
   now() - interval '3 days', null, 40)
on conflict (slug) do nothing;
