-- Revl — initial schema.
--
-- Mirrors what the app already holds in AsyncStorage (see src/lib/session.ts,
-- StudentProfile) so moving a device from local-only to synced is a straight
-- field-for-field write, not a remodel.
--
-- Auth model (see docs/AUTH.md):
--   google / apple  → auth.users.email is real and already verified
--   momo / orange   → auth.users.phone only; the account has nothing behind it
--                     but a SIM, which is what the onboarding recovery step
--                     exists to fix. The recovery EMAIL is not a text column
--                     here: it goes through auth.updateUser({ email }), so
--                     Supabase sends the confirmation and the address becomes
--                     a genuine second way in rather than a string we hold.

-- Case-insensitive text, so @Ashley and @ashley cannot both be taken.
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  name text not null default '',
  username extensions.citext unique,
  avatar_color text not null default '#E2711D',
  avatar_url text,

  school text not null check (school in ('ub', 'hnd')),
  faculty_id text not null,
  faculty_name text not null,
  department_id text not null,
  department_name text not null,
  level text not null,

  -- "2026/2027". Drives the level-progression prompt each September.
  academic_year text not null,
  -- Derived from the calendar (src/lib/academic.ts), never hand-entered.
  exam_date timestamptz not null,

  auth_provider text check (auth_provider in ('google', 'apple', 'momo', 'orange')),
  -- Apple "Hide My Email" — the address works but is a relay, so it is a poor
  -- thing to display back to the student and a poor username seed.
  email_is_private_relay boolean not null default false,

  -- Second number for momo accounts. Deliberately NOT the sign-in number.
  recovery_phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_department_idx on public.profiles (school, department_id, level);

-- ------------------------------------------------------------ enrollments

create table public.enrollments (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  course_code text not null,

  -- A retake. Constrained elsewhere by the rule that a course is re-sat in the
  -- SAME semester it is taught — a failed first-semester course is written in
  -- next year's first semester, never in a second-semester sitting.
  is_carryover boolean not null default false,
  semester text check (semester in ('S1', 'S2')),
  academic_year text not null,

  created_at timestamptz not null default now(),
  primary key (profile_id, course_code, academic_year)
);

create index enrollments_course_idx on public.enrollments (course_code);

-- ------------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;

create policy "own profile readable" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile writable" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile insertable" on public.profiles
  for insert with check (auth.uid() = id);

create policy "own enrollments readable" on public.enrollments
  for select using (auth.uid() = profile_id);
create policy "own enrollments writable" on public.enrollments
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- ------------------------------------------------------- username lookup
--
-- Onboarding needs "is @handle free?" BEFORE the row exists, and RLS quite
-- correctly hides other people's profiles. A definer function answers the one
-- boolean without opening the table.

create function public.username_available(candidate extensions.citext)
returns boolean
language sql
security definer
set search_path = public, extensions
stable
as $$
  select length(candidate) >= 3
     and not exists (select 1 from public.profiles where username = candidate);
$$;

revoke all on function public.username_available(extensions.citext) from public;
grant execute on function public.username_available(extensions.citext) to anon, authenticated;

-- --------------------------------------------------------- new-user hook
--
-- Creates the shell row on sign-up and carries across whatever the provider
-- gave us. Google sends name + email + picture every time; Apple sends the
-- name ONLY on first authorization, so if it is not captured here it is gone
-- for good — hence reading it at insert rather than on a later save.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id, name, avatar_url, auth_provider, email_is_private_relay,
    school, faculty_id, faculty_name, department_id, department_name,
    level, academic_year, exam_date
  )
  values (
    new.id,
    coalesce(meta ->> 'full_name', meta ->> 'name', ''),
    meta ->> 'avatar_url',
    nullif(new.raw_app_meta_data ->> 'provider', ''),
    coalesce(new.email like '%@privaterelay.appleid.com', false),
    -- Placeholders: onboarding overwrites all of these on its first save. The
    -- row exists from second zero so a crash mid-wizard still has somewhere
    -- to land.
    'ub', '', '', '', '', '', '', now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ updated_at

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
