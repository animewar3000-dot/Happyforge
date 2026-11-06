# Supabase setup

Happyforge uses Supabase for authentication and metadata only. Repository files, terminal execution and long-running agent processes belong on the separate workspace runtime.

## Project

- Project ref: `cteeffmwfxfchutxxhve`
- Region: Mumbai (`ap-south-1`)
- Project URL: `https://cteeffmwfxfchutxxhve.supabase.co`

## Web application environment

Set these variables in the web application's deployment environment (and in `.env.local` for local development):

```env
NEXT_PUBLIC_SUPABASE_URL=https://cteeffmwfxfchutxxhve.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use the project's **publishable** key. Do not use a secret key or legacy service-role key in browser code or any `NEXT_PUBLIC_` variable.

## Authentication URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Set the Site URL to the deployed Happyforge web URL.
- Add `https://YOUR-HAPPYFORGE-DOMAIN/auth/callback` to the Redirect URLs.
- For local development, add `http://localhost:3000/auth/callback`.

The login screen supports email/password sign-in and account creation. When email confirmation is enabled, new users must follow the confirmation email before signing in.

## Database security

The initial migrations create:

- `projects`
- `agent_sessions`
- `provider_configs`
- `workspace_refs`

All four tables have RLS enabled. Policies and grants limit table access to the `authenticated` role and restrict each row to its `owner_id`. Anonymous users have no table grants. Provider secrets must be stored in a dedicated secret manager; `provider_configs.secret_reference` is only a reference, never the raw secret.

## Current limitation

The application code is wired for Supabase Auth, but it still needs the two public environment variables in its deployed web environment and a configured Site URL / Redirect URL before a live sign-up flow can be verified.
