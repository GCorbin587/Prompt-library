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
