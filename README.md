# Prompt Library

A React/Vite app for saving, organizing, and reusing prompts.

## Local Development

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   ```text
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. Start the app:

   ```powershell
   npm run dev
   ```

## Supabase Setup

Run the SQL files in this order in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/phase-2-auth-rls.sql`

The first script creates the `prompts` table. The second script adds per-user ownership, enables row level security, and creates policies for authenticated users to manage only their own prompts.

## Validation

Build the production bundle with:

```powershell
npm run build
```

## Vercel Deployment

Deploy from the `main` branch using Vercel's Vite defaults:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add these environment variables in the Vercel project settings:

```text
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

After Vercel creates the production URL, add it to Supabase Auth:

1. Open the Supabase project dashboard.
2. Go to Authentication > URL Configuration.
3. Set Site URL to the Vercel production URL.
4. Add the Vercel production URL to Redirect URLs.

Before sharing the beta URL, smoke test the deployed app:

1. Load the Vercel URL.
2. Sign in or create an account.
3. Create a prompt.
4. Refresh and confirm the prompt remains visible.
5. Edit the prompt.
6. Use the prompt and confirm the usage count changes.
7. Delete the test prompt.
