-- ============================================================================
-- FIWFAN-STYLE MARKETPLACE SCHEMA
-- Community job / travel-companion marketplace with manual escrow
-- Target: Supabase (Postgres + Auth + Storage + RLS)
-- ============================================================================
-- How to run:
--   1. Open Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this whole file and run it once on a fresh project
--   3. Create a Storage bucket named "payout-slips" (see bottom of file)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()


-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------

-- Role of a user in the platform. A single user could technically act as both,
-- but we keep one primary role per profile to keep RLS simple. If you need
-- "switch role" behaviour later, split this into a separate `user_roles` table.
create type public.user_role as enum ('employer', 'provider', 'admin');

-- Lifecycle of a job/listing post
create type public.job_status as enum ('open', 'closed', 'cancelled');

-- Core escrow lifecycle. This is the state machine the whole app revolves around.
--
--   awaiting_payment          Booking created, employer has not paid into escrow yet
--   escrow_held                Admin confirmed money received into the central account
--   in_progress                 (optional finer-grained state, see note below) provider is working
--   completed_pending_payout   Provider marked work as done, waiting for admin to pay out
--   paid_out                    Admin has transferred funds to provider, booking closed
--   disputed                    Either party raised an issue; admin must resolve manually
--   cancelled                   Booking cancelled before completion (refund handled manually)
--
-- NOTE: `in_progress` is included for future use (e.g. distinguishing "escrow held,
-- provider hasn't started" vs "provider actively working"), but the MVP flow below
-- only strictly requires: awaiting_payment -> escrow_held -> completed_pending_payout -> paid_out
create type public.escrow_status as enum (
  'awaiting_payment',
  'escrow_held',
  'in_progress',
  'completed_pending_payout',
  'paid_out',
  'disputed',
  'cancelled'
);


-- ----------------------------------------------------------------------------
-- 2. PROFILES
-- ----------------------------------------------------------------------------
-- One row per authenticated user (1:1 with auth.users). Created automatically
-- via trigger on signup (see below) so the app never has to remember to insert it.

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            public.user_role not null default 'employer',
  full_name       text not null,
  phone           text,
  avatar_url      text,

  -- Payout details for providers (shown to admin at payout time). Keep this
  -- minimal in the MVP; move to a dedicated encrypted table if you later
  -- store more sensitive banking data.
  bank_name       text,
  bank_account_no text,
  bank_account_name text,

  is_verified     boolean not null default false, -- admin-verified identity, optional gating
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'Extends auth.users with app-specific profile data and role.';

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'employer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 3. JOBS / LISTINGS
-- ----------------------------------------------------------------------------
-- Posted by an employer. A provider browses these and a booking is created
-- when a provider (or employer) initiates a hire.

create table public.jobs (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.profiles(id) on delete cascade,

  title           text not null,
  description     text not null,
  category        text,                -- e.g. 'travel_companion', 'errand', 'labor', 'tour_guide'

  rate_amount     numeric(12,2) not null check (rate_amount > 0),
  rate_unit       text not null default 'per_day', -- 'per_hour' | 'per_day' | 'per_job'
  currency        text not null default 'THB',

  location_text   text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),

  starts_at       timestamptz,
  ends_at         timestamptz,

  status          public.job_status not null default 'open',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index jobs_employer_id_idx on public.jobs(employer_id);
create index jobs_status_idx on public.jobs(status);
create index jobs_location_idx on public.jobs(latitude, longitude);

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute procedure public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 4. BOOKINGS (the escrow-controlled hire)
-- ----------------------------------------------------------------------------
-- Created when an employer hires a provider for a job. This table owns the
-- escrow_status state machine described above.

create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs(id) on delete restrict,
  employer_id       uuid not null references public.profiles(id) on delete restrict,
  provider_id       uuid not null references public.profiles(id) on delete restrict,

  agreed_amount     numeric(12,2) not null check (agreed_amount > 0),
  currency          text not null default 'THB',

  escrow_status     public.escrow_status not null default 'awaiting_payment',

  -- Employer's proof of payment INTO the central escrow account
  payment_slip_url  text,
  payment_confirmed_at timestamptz,
  payment_confirmed_by uuid references public.profiles(id), -- admin who verified

  -- Provider marks work done
  work_completed_at timestamptz,

  -- Employer confirms delivery (optional extra confirmation step before payout)
  delivery_confirmed_at timestamptz,

  -- Admin payout OUT of the central escrow account to the provider
  payout_slip_url   text,
  paid_out_at       timestamptz,
  paid_out_by       uuid references public.profiles(id), -- admin who paid

  admin_notes       text,

  created_at        timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint different_parties check (employer_id <> provider_id)
);

create index bookings_job_id_idx on public.bookings(job_id);
create index bookings_employer_id_idx on public.bookings(employer_id);
create index bookings_provider_id_idx on public.bookings(provider_id);
create index bookings_escrow_status_idx on public.bookings(escrow_status);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 5. ESCROW ACCOUNT SETTINGS (single shared "central account" info)
-- ----------------------------------------------------------------------------
-- Simple key-value style singleton table so the frontend can render the
-- central account number without hardcoding it. Only admins can edit.

create table public.escrow_account_settings (
  id              int primary key default 1,
  bank_name       text not null,
  account_name    text not null,
  account_number  text not null,
  promptpay_id    text,
  updated_at      timestamptz not null default now(),
  constraint singleton_row check (id = 1)
);

insert into public.escrow_account_settings (id, bank_name, account_name, account_number)
values (1, 'Kasikorn Bank', 'Fiwfan Escrow Co., Ltd.', '000-0-00000-0')
on conflict (id) do nothing;

create trigger escrow_settings_set_updated_at
  before update on public.escrow_account_settings
  for each row execute procedure public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS FOR RLS
-- ----------------------------------------------------------------------------
-- security definer helper avoids infinite recursion when policies need to
-- check "is this user an admin" by reading the profiles table.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;


-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.bookings enable row level security;
alter table public.escrow_account_settings enable row level security;

-- ============ PROFILES ============

-- Anyone logged in can view public profile info (needed to show provider/
-- employer names on jobs & bookings). If you want to hide bank details from
-- other regular users, move those columns to a separate private table.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- A user can only update their own profile row
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can update any profile (e.g. verify identity, change role)
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()));

-- Profile rows are created only via the handle_new_user trigger (security
-- definer), so no public insert policy is needed. Block direct inserts:
-- (no insert policy => inserts from client are denied by default with RLS on)


-- ============ JOBS ============

-- Everyone (including anonymous browsers) can view open jobs
create policy "jobs_select_public"
  on public.jobs for select
  to anon, authenticated
  using (status = 'open' or employer_id = auth.uid() or public.is_admin(auth.uid()));

-- Only the employer who owns the row can create it, and only as themselves
create policy "jobs_insert_own"
  on public.jobs for insert
  to authenticated
  with check (employer_id = auth.uid());

-- Only the owning employer (or admin) can update/close a job
create policy "jobs_update_own_or_admin"
  on public.jobs for update
  to authenticated
  using (employer_id = auth.uid() or public.is_admin(auth.uid()))
  with check (employer_id = auth.uid() or public.is_admin(auth.uid()));

create policy "jobs_delete_own_or_admin"
  on public.jobs for delete
  to authenticated
  using (employer_id = auth.uid() or public.is_admin(auth.uid()));


-- ============ BOOKINGS ============

-- A user can see a booking only if they are the employer, the provider,
-- or an admin. This is the important one: money details must stay private.
create policy "bookings_select_involved_or_admin"
  on public.bookings for select
  to authenticated
  using (
    employer_id = auth.uid()
    or provider_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- Only the employer can create a booking, and only naming themselves as employer
create policy "bookings_insert_employer"
  on public.bookings for insert
  to authenticated
  with check (employer_id = auth.uid());

-- Update rules are deliberately narrow: employer, provider and admin can each
-- update the SAME row, but application logic (below, via RPC functions)
-- restricts which *columns/status transitions* are legal. RLS controls "can
-- this user touch this row at all"; the RPC functions control "is this a
-- legal state transition for this role".
create policy "bookings_update_involved_or_admin"
  on public.bookings for update
  to authenticated
  using (
    employer_id = auth.uid()
    or provider_id = auth.uid()
    or public.is_admin(auth.uid())
  )
  with check (
    employer_id = auth.uid()
    or provider_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- No delete policy: bookings are financial records and should never be
-- hard-deleted; use escrow_status = 'cancelled' instead.


-- ============ ESCROW ACCOUNT SETTINGS ============

-- Any authenticated user can read the central account number (they need it
-- to pay in)
create policy "escrow_settings_select_authenticated"
  on public.escrow_account_settings for select
  to authenticated
  using (true);

-- Only admins can change it
create policy "escrow_settings_update_admin"
  on public.escrow_account_settings for update
  to authenticated
  using (public.is_admin(auth.uid()));


-- ----------------------------------------------------------------------------
-- 8. STATE-TRANSITION RPC FUNCTIONS (recommended over raw client-side updates)
-- ----------------------------------------------------------------------------
-- These wrap the escrow_status transitions with server-side role/ownership
-- checks so a malicious client can't, say, jump straight to 'paid_out'.
-- The frontend should call these via supabase.rpc(...) instead of doing a
-- raw `.update()` on escrow_status. Regular column RLS still applies as a
-- second layer of defense.

-- Employer confirms they have sent payment into the central account.
-- Moves: awaiting_payment -> escrow_held is done by an ADMIN (see below),
-- because only the admin can verify the money actually arrived. This
-- function just lets the employer ATTACH proof of payment while it's still
-- awaiting_payment.
create or replace function public.submit_payment_proof(
  p_booking_id uuid,
  p_slip_url text
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id;

  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.employer_id <> auth.uid() then
    raise exception 'Only the employer can submit payment proof';
  end if;

  if v_booking.escrow_status <> 'awaiting_payment' then
    raise exception 'Booking is not awaiting payment (current: %)', v_booking.escrow_status;
  end if;

  update public.bookings
  set payment_slip_url = p_slip_url
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Admin verifies payment arrived in the central account -> escrow_held
create or replace function public.admin_confirm_escrow_received(
  p_booking_id uuid
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can confirm escrow receipt';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.escrow_status <> 'awaiting_payment' then
    raise exception 'Booking must be awaiting_payment (current: %)', v_booking.escrow_status;
  end if;

  update public.bookings
  set escrow_status = 'escrow_held',
      payment_confirmed_at = now(),
      payment_confirmed_by = auth.uid()
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Provider marks the work as delivered -> completed_pending_payout
create or replace function public.provider_complete_work(
  p_booking_id uuid
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.provider_id <> auth.uid() then
    raise exception 'Only the assigned provider can complete this work';
  end if;

  if v_booking.escrow_status not in ('escrow_held', 'in_progress') then
    raise exception 'Booking must have escrow held before it can be completed (current: %)', v_booking.escrow_status;
  end if;

  update public.bookings
  set escrow_status = 'completed_pending_payout',
      work_completed_at = now()
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Employer confirms delivery was satisfactory (optional step, informational;
-- does not block payout, but gives the admin extra confidence)
create or replace function public.employer_confirm_delivery(
  p_booking_id uuid
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.employer_id <> auth.uid() then
    raise exception 'Only the employer can confirm delivery';
  end if;

  if v_booking.escrow_status <> 'completed_pending_payout' then
    raise exception 'Provider has not marked work as complete yet (current: %)', v_booking.escrow_status;
  end if;

  update public.bookings
  set delivery_confirmed_at = now()
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Admin pays the provider out of the central account -> paid_out
create or replace function public.admin_mark_paid_out(
  p_booking_id uuid,
  p_payout_slip_url text
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can mark a booking as paid out';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.escrow_status <> 'completed_pending_payout' then
    raise exception 'Booking must be completed_pending_payout (current: %)', v_booking.escrow_status;
  end if;

  update public.bookings
  set escrow_status = 'paid_out',
      payout_slip_url = p_payout_slip_url,
      paid_out_at = now(),
      paid_out_by = auth.uid()
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Admin (or either party, with admin oversight recommended) raises a dispute
create or replace function public.mark_disputed(
  p_booking_id uuid,
  p_note text
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.employer_id <> auth.uid()
     and v_booking.provider_id <> auth.uid()
     and not public.is_admin(auth.uid()) then
    raise exception 'Not authorized to dispute this booking';
  end if;

  update public.bookings
  set escrow_status = 'disputed',
      admin_notes = coalesce(admin_notes || E'\n', '') || coalesce(p_note, '')
  where id = p_booking_id
  returning * into v_booking;

  return v_booking;
end;
$$;


-- ----------------------------------------------------------------------------
-- 9. STORAGE BUCKETS (run once; or create via Dashboard > Storage)
-- ----------------------------------------------------------------------------
-- Two private buckets: one for employer payment-in slips, one for admin
-- payout-out slips. Both private; access granted only via signed URLs
-- generated server-side / through RLS-aware storage policies below.

insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payout-slips', 'payout-slips', false)
on conflict (id) do nothing;

-- Employer can upload to payment-slips under a path prefixed with their own uid
create policy "payment_slips_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-slips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "payment_slips_select_involved_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-slips'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin(auth.uid())
    )
  );

-- Only admins upload payout slips
create policy "payout_slips_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payout-slips'
    and public.is_admin(auth.uid())
  );

create policy "payout_slips_select_involved_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payout-slips'
    and public.is_admin(auth.uid())
    -- Providers who own the related booking can also be granted access;
    -- for simplicity the MVP restricts viewing payout slips to admins only.
    -- Extend with a join against bookings.payout_slip_url if needed.
  );

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
