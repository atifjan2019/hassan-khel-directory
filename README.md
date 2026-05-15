# Hassan Khel Village Directory

A production-ready, bilingual (Urdu / English) public directory for the people
of **Hassan Khel** village, Charsadda, Khyber Pakhtunkhwa, Pakistan.

It records families and their patrilineal lineage, professions and
qualifications, village news, a village map, and event photo galleries —
built mobile-first for cheap Android phones on slow rural networks.

> Built by the community, for the community. No tracking, no ads.
> Phone numbers and emails are **never** shown publicly.

---

## Features

- **Registration with admin approval** — anyone can submit a profile (multi-step
  form with father autocomplete and a map pin); it stays `pending` until an
  admin approves it. The admin is emailed on each new submission.
- **Directory** — searchable, filterable card grid (profession, city, house
  area, qualification); full profile pages. Phone/email never exposed.
- **Family tree** — interactive React Flow tree of the patrilineal lineage;
  tap a person to highlight their line back to the eldest ancestor.
- **Village map** — Leaflet + OpenStreetMap with a pin per member.
- **News / announcements** — deaths, weddings, jirga decisions, schemes;
  Gregorian **and** Hijri dates; pinned posts.
- **Photo gallery** — albums with a mobile, swipeable lightbox.
- **Admin dashboard** — pending approvals, member management, news editor,
  album manager, reports (with CSV export).
- **Auth** — Supabase email/password + Google OAuth; users edit their own
  profile, admins edit anyone.
- **Bilingual** — full Urdu (RTL, Noto Nastaliq) + English with a header
  toggle; defaults to Urdu, with browser-language detection.

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Supabase (Postgres + Auth +
Storage) · Tailwind CSS · next-intl · @xyflow/react · React-Leaflet ·
React Hook Form + Zod · deploy on Vercel.

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- (Optional) the [Supabase CLI](https://supabase.com/docs/guides/cli) for local
  migrations: `npm i -g supabase`

### 2. Install

```bash
npm install
cp .env.example .env.local   # then fill in the values
```

### 3. Environment variables (`.env.local`)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **server only** — used by the seed script & admin actions |
| `NEXT_PUBLIC_SITE_URL` | ✅ | e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_BUCKET` | ✅ | defaults to `village-media` |
| `ADMIN_NOTIFY_EMAIL` | – | receives new-registration emails / can be auto-promoted to admin by the seed |
| `RESEND_API_KEY` | – | enables admin email via [Resend](https://resend.com); without it emails are logged to the server console |
| `NEXT_PUBLIC_VILLAGE_LAT/LNG/ZOOM` | – | map centre (defaults ≈ Hassan Khel) |

### 4. Database

Apply the SQL migrations in [`supabase/migrations`](supabase/migrations) **in
order**:

**Option A — Supabase CLI (recommended)**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — SQL editor**

Open the Supabase dashboard → SQL Editor and run, in order:
`0001_init.sql`, `0002_rls.sql`, `0003_storage.sql`, `0004_functions.sql`.

This creates the tables, enums, **Row Level Security** policies, the
privacy-safe `public_profiles` view (no phone/email), the public media
storage bucket, and the admin/stats RPCs.

### 5. Enable Google OAuth (optional)

Supabase dashboard → Authentication → Providers → Google. Add
`<NEXT_PUBLIC_SITE_URL>/auth/callback` to the redirect URLs.

### 6. Seed demo data

```bash
npm run db:seed
```

Inserts 10 approved profiles (a 4-generation family tree), 3 news posts, and
2 photo albums. If `ADMIN_NOTIFY_EMAIL` matches an existing auth user, that
user is promoted to `super_admin`.

### 7. Run

```bash
npm run dev          # http://localhost:3000  (redirects to /ur)
npm run build && npm start
npm run typecheck    # tsc --noEmit
npm run lint
```

---

## Becoming an admin

Admins are rows in the `admin_users` table. Either:

1. Sign up in the app (email/password or Google) at `/login`, then set
   `ADMIN_NOTIFY_EMAIL` to that email and run `npm run db:seed`, **or**
2. In Supabase Studio, insert your `auth.users` id into `admin_users` with
   role `super_admin`.

Then visit `/admin`.

## Privacy & cultural notes

- `phone` and `email` are stored but **excluded from the public view** and
  every public query — they are only visible to the owning user and admins.
- The registration form has a *“do not display photo publicly”* option; a
  neutral silhouette (not a cartoon avatar) is shown instead.
- Deceased members carry a respectful **Marhoom** badge with a dua tooltip.
- Honorific titles (Haji, Maulana, Mufti, Dr., Engr., Master…) are supported.
- The family tree is **patrilineal**, per Pashtun tradition.
- No third-party analytics or tracking pixels. Optional self-hosted
  Plausible/Umami can be wired via the `NEXT_PUBLIC_ANALYTICS_*` vars.

## Project structure

```
src/
  app/[locale]/         localized routes (home, directory, family-tree,
                         map, news, gallery, register, login, profile,
                         about, admin/*)
  app/auth/callback      OAuth code exchange
  components/ui          lightweight shadcn-style primitives (no Radix)
  components/shared      Avatar, ProfileCard, Marhoom badge, prayer times…
  components/layout      header, footer, mobile nav, language switcher
  features/*             feature modules (register, family-tree, map,
                         gallery, admin, profile, auth, home)
  i18n/                  next-intl routing/navigation/request
  lib/                   supabase clients, queries, auth, utils, hijri
  messages/              en.json / ur.json (full UI translations)
supabase/migrations/     SQL schema, RLS, storage, functions
scripts/seed.ts          demo data seeder
```

## Deploying to Vercel

1. Push to a Git repo and import it into Vercel.
2. Add every variable from `.env.example` in Vercel → Project → Settings →
   Environment Variables (set `NEXT_PUBLIC_SITE_URL` to the production URL).
3. Add the production domain to Supabase Auth redirect URLs.
4. Deploy. Run the migrations + seed against the production Supabase project.

## License

Provided for the Hassan Khel community. Use respectfully.
