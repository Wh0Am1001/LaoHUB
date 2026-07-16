# FiwFan

A modern social creator/community platform. Build a profile, share photos, follow creators, and chat in real time.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS · React Router · React Hook Form + Zod · Supabase (Auth, Postgres, Storage, Realtime)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/storage.sql`.
3. In **Authentication → Providers**, enable Email, and optionally Google (set the redirect URL to `<your-site-url>/home`).
4. In **Authentication → URL Configuration**, add `<your-site-url>/reset-password` as a redirect URL (for the forgot-password flow).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project's API settings.

### 4. Run the dev server

```bash
npm run dev
```

### Other scripts

```bash
npm run build     # type-check + production build
npm run lint       # ESLint
npm run format     # Prettier
npm run preview    # preview the production build locally
```

## Deployment

- **Frontend:** deploy to [Vercel](https://vercel.com) — connect the repo, set the two `VITE_SUPABASE_*` environment variables in the Vercel project settings, and deploy. `vercel.json` is already configured for SPA client-side routing.
- **Backend:** Supabase is already your backend; no separate deploy step beyond running the SQL migrations above.

## Project structure

```
src/
  components/   # reusable UI, layout, and feature components
  pages/        # route-level views
  layouts/      # MainLayout (authenticated shell) and AuthLayout
  hooks/        # useAuth, useToast, useDebounce, useInfiniteScroll, ...
  contexts/     # AuthContext, ToastContext
  services/     # Supabase data-access functions, grouped by domain
  lib/          # Supabase client singleton + Zod schemas
  types/        # database types + app-level types
  utils/        # formatting/calculation helpers
  constants/    # provinces, storage bucket names, page sizes, ...
supabase/
  schema.sql    # tables, indexes, triggers, RLS policies
  storage.sql   # storage buckets + policies
```

## Notes on scope

This is a complete, working implementation of everything in the spec except the items explicitly listed under **Future Features** (premium membership, profile boosts, stories, video upload, live streaming, payments, booking, admin dashboard, user verification workflow, report/block users, push notifications, multi-language support) — those are product surface area beyond a single build and are left as follow-up work. A couple of settings-page toggles (private account) are wired in the UI but call out in code comments what backend support they still need (a `private` column + matching RLS policy).
