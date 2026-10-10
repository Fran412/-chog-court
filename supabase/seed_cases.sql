-- Generated from cases.js. Re-run after changing cases or outcomes.
insert into public.cases (id, outcome) values
  ('c01','not guilty'),
  ('c02','guilty'),
  ('c03','guilty'),
  ('c04','not guilty'),
  ('c05','guilty'),
  ('c06','not guilty'),
  ('c07','guilty'),
  ('c08','guilty'),
  ('c09','not guilty'),
  ('c10','not guilty'),
  ('c11','guilty'),
  ('c12','not guilty'),
  ('c13','guilty'),
  ('c14','not guilty')
on conflict (id) do update set outcome = excluded.outcome;
