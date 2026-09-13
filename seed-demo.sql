-- Clean demo rows so you can see the app before wiring up a writer.
insert into public.projects (slug, title, category, state, status, last_update, last_update_at, next_move, sort) values
  ('lisbon-trip', 'Lisbon trip, Nov 12-16', 'travel', 'waiting',
   'Waiting on your pick of neighborhood vibe.',
   'Found 3 well-reviewed hotels near Principe Real within budget.',
   now() - interval '3 hours', 'Tell your assistant which vibe you want.', 10),
  ('learn-spanish', 'Learning Spanish', 'learning', 'active',
   'Daily practice is underway; streak is alive.',
   'This morning''s drill covered restaurant phrases.',
   now() - interval '26 hours', 'Next practice arrives tomorrow morning.', 20),
  ('tax-filing', 'Tax filing paperwork', 'money', 'done',
   'Filed and confirmed.',
   'Return accepted; refund expected in 2-3 weeks.',
   now() - interval '5 days', null, 30),
  ('garage-gym', 'Garage gym setup', 'personal', 'active',
   'Comparing rack options across three brands.',
   'Price tracking set up on the two finalists.',
   now() - interval '8 hours', 'Your assistant flags it when either drops below $400.', 40)
on conflict (slug) do nothing;
