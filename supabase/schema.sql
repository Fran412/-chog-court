-- Chog Court shared records. Run in the Supabase SQL editor, then run seed_cases.sql.
--
-- Reads are public (anyone can see a Chog's record). Writes are NOT allowed from the browser:
-- only the submit-ruling edge function inserts rows, using the service role, after it has verified
-- the wallet signature and that the signer owns the token.

create table if not exists public.cases (
  id      text primary key,
  outcome text not null check (outcome in ('guilty', 'not guilty'))
);

create table if not exists public.rulings (
  id         bigint generated always as identity primary key,
  contract   text    not null,               -- lowercase NFT contract address
  token_id   text    not null,
  case_id    text    not null references public.cases (id),
  vote       text    not null check (vote in ('guilty', 'not guilty')),
  correct    boolean not null,               -- computed server-side from cases.outcome
  note       text    check (char_length(note) <= 240),
  ruled_by   text    not null,               -- wallet that owned the token when it ruled
  created_at timestamptz not null default now(),
  unique (contract, token_id, case_id)       -- one ruling per Chog per case, ever
);

create index if not exists rulings_token_idx on public.rulings (contract, token_id);

alter table public.cases   enable row level security;
alter table public.rulings enable row level security;

-- Public read only. No insert/update/delete policies exist, so the anon key cannot write.
drop policy if exists "cases are public"   on public.cases;
drop policy if exists "rulings are public" on public.rulings;
create policy "cases are public"   on public.cases   for select using (true);
create policy "rulings are public" on public.rulings for select using (true);

-- Leaderboard source: per-token totals. Runs with the view owner's rights so anon can read totals.
create or replace view public.token_stats as
  select contract, token_id, count(*)::int as cases, count(*) filter (where correct)::int as correct
  from public.rulings
  group by contract, token_id;

grant select on public.token_stats to anon, authenticated;
