-- =====================================================================
-- FiwFan — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20 and username ~ '^[a-z0-9_]+$'),
  display_name text not null check (char_length(display_name) between 2 and 50),
  avatar_url text,
  cover_url text,
  bio text check (char_length(bio) <= 300),
  gender text check (gender in ('male', 'female', 'other')),
  birth_date date,
  height numeric check (height between 50 and 280),
  weight numeric check (weight between 20 and 300),
  province text,
  district text,
  occupation text,
  relationship_status text check (relationship_status in ('single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say')),
  verified boolean not null default false,
  online boolean not null default false,
  premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text check (char_length(caption) <= 2200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null check (char_length(comment) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow', 'message')),
  reference_id uuid,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_likes_post_id on public.likes(post_id);
create index if not exists idx_likes_user_id on public.likes(user_id);
create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_following_id on public.follows(following_id);
create index if not exists idx_chats_sender_receiver on public.chats(sender_id, receiver_id);
create index if not exists idx_chats_receiver_unread on public.chats(receiver_id, is_read);
create index if not exists idx_notifications_user_id on public.notifications(user_id, is_read);
create index if not exists idx_profiles_province on public.profiles(province);
create index if not exists idx_profiles_online on public.profiles(online);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
alter table public.chats enable row level security;
alter table public.notifications enable row level security;

-- profiles: publicly readable (needed for the Discover/Home grid), only the
-- owner can insert/update/delete their own row.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- posts: publicly readable, only authenticated users can create their own,
-- only the owner can update/delete.
drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.posts;
create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- comments: publicly readable, authenticated users can create their own,
-- only the comment owner can delete.
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

drop policy if exists "Authenticated users can comment" on public.comments;
create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- likes: publicly readable, users manage only their own like rows.
drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

drop policy if exists "Authenticated users can like posts" on public.likes;
create policy "Authenticated users can like posts"
  on public.likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own likes" on public.likes;
create policy "Users can remove their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- follows: publicly readable (needed for follower/following counts), users
-- manage only their own follow edges.
drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

drop policy if exists "Authenticated users can follow" on public.follows;
create policy "Authenticated users can follow"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- chats: only the sender or receiver can read/write a message; only the
-- receiver can mark a message as read.
drop policy if exists "Users can view their own conversations" on public.chats;
create policy "Users can view their own conversations"
  on public.chats for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send messages" on public.chats;
create policy "Users can send messages"
  on public.chats for insert
  with check (auth.uid() = sender_id);

drop policy if exists "Receiver can mark messages as read" on public.chats;
create policy "Receiver can mark messages as read"
  on public.chats for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- notifications: only the owner can read or update (mark as read) their
-- own notifications. Inserts happen via the app on the recipient's behalf
-- (e.g. liking someone else's post writes a notification row for them),
-- so insert is allowed for any authenticated user targeting any user_id.
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can create notifications" on public.notifications;
create policy "Authenticated users can create notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.notifications;
