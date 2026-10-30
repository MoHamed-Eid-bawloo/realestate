# Nawyati — Real Estate OS

A frontend React (Vite + TypeScript) real estate platform backed by Supabase: public marketplace, multi-tenant CRM, inventory, developer portal, broker exchange, lead and deal pipeline, commissions, BI, and platform admin.

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, Zustand, React Router
- **Backend:** Supabase (PostgreSQL, Row Level Security, Auth, RPC)
- **Locale:** English / Arabic with RTL, light / dark themes, EGP pricing

> This is a demo environment. Records are fictional. Payments, WhatsApp, email, and AI features are simulated and no external service receives data.

## Requirements

- Node.js 20+ (the seed script uses `--env-file`, available since Node 20.6)
- A Supabase project (free tier is fine)

## 1. Create a Supabase project

Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). From **Project Settings → API** note:

- Project URL
- `anon` public key
- `service_role` key (server-side only; never ship it to the browser)

## 2. Apply the database schema

Open the SQL editor in your Supabase project and run the contents of:

```
supabase/migrations/20261030000100_init.sql
```

This creates the tables, helper functions (`current_company_id()`, `current_developer_id()`, `current_broker_id()`, `is_super_admin()`), RLS policies, RPCs (`move_deal`, `reserve_unit`, `release_unit`), and notification triggers.

Alternatively, with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

## 3. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY

# Seed script only
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
```

`VITE_*` values are bundled into the browser build — only ever put the public `anon` key there. The service role key is used by the seed script and must stay local.

## 4. Seed demo accounts and data

```bash
npm install
npm run seed
```

The script creates the demo auth users, their role profiles, and the tenant data (companies, developers, properties, units, leads, deals, commissions, and the customer workspace). Re-running it is safe: rows are upserted.

Every demo account uses the password:

```
Demo1234!
```

| Role | Email |
| --- | --- |
| Super admin | `admin@nawyati.demo` |
| Agency owner | `owner@nilecrest.demo` |
| Sales manager | `manager@nilecrest.demo` |
| Sales agent | `agent@nilecrest.demo` |
| Developer | `developer@aurora.demo` |
| Broker | `broker@independent.demo` |
| Customer | `customer@sara.demo` |

The login screen also lists these accounts as one-click fill buttons.

## 5. Run

```bash
npm run dev       # http://localhost:5173
npm run build     # typecheck + production build
npm run preview   # serve the production build
```

Public marketplace routes are readable without signing in. Everything under `/app` requires a session; each area is additionally gated by role. If a user signs in but has no `profiles` row, the app shows a "profile missing" screen instead of an empty workspace — run the seed script or create the profile in `public.profiles`.

## How access is scoped

- Multi-tenancy comes from the profile: `company_id`, `developer_id`, `broker_id`, `employee_id`.
- RLS enforces tenant isolation in the database; the UI layer is not the security boundary.
- Public read policies allow anonymous browsing of properties, projects, developers, plans, and platform settings.
- Workspace tables are readable/writable only within the signed-in profile's company, developer, or broker scope; super admins can see the platform.
- The broker directory is limited to workspace roles (agency, developer, broker, admin), not anonymous visitors.

## Demo scope

- No real payments, invoices, messaging, or AI calls.
- All numbers, people, and companies are fictional sample data.
- Authentication is real Supabase email/password auth; authorization is enforced by RLS. This is still a demo configuration, not a production security review.

## Project layout

```
src/
  components/   layout, UI primitives, auth gate
  pages/        marketplace, CRM, inventory, developer, broker, finance, admin, account, settings
  store/        Zustand app store + auth store
  services/     Supabase repository (fetch + writes + RPC)
  i18n/         English/Arabic dictionaries
  lib/          helpers (supabase client, formatting, utils)
supabase/
  migrations/   schema, RLS, functions, triggers
scripts/
  seed.mjs      demo accounts + tenant data
```
