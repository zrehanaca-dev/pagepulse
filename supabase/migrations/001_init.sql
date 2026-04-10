-- ============================================================
-- PagePulse — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Profiles (extends auth.users) ──────────────────────────
create table if not exists public.profiles (
  id              uuid references auth.users on delete cascade primary key,
  username        text,
  email           text,
  mood_preferences text[],
  dna_type        text,
  dna_tagline     text,
  created_at      timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Reading Stack ────────────────────────────────────────────
create table if not exists public.reading_stack (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  book_id     text not null,                    -- Google Books volume ID
  lane        text not null check (lane in ('curious','reading','done','loved')),
  title       text not null,
  author      text,
  cover       text,
  genres      text[],
  ai_why      text,
  description text,
  added_at    timestamptz default now(),
  updated_at  timestamptz default now(),

  unique (user_id, book_id)
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_reading_stack_updated_at on public.reading_stack;
create trigger set_reading_stack_updated_at
  before update on public.reading_stack
  for each row execute procedure public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.reading_stack  enable row level security;

-- Profiles: users can read/write only their own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Stack: users can read/write/delete only their own
create policy "stack_select_own" on public.reading_stack for select using (auth.uid() = user_id);
create policy "stack_insert_own" on public.reading_stack for insert with check (auth.uid() = user_id);
create policy "stack_update_own" on public.reading_stack for update using (auth.uid() = user_id);
create policy "stack_delete_own" on public.reading_stack for delete using (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists reading_stack_user_id_idx on public.reading_stack (user_id);
create index if not exists reading_stack_lane_idx     on public.reading_stack (user_id, lane);
