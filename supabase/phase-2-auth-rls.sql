alter table public.prompts
add column if not exists user_id uuid references auth.users(id) on delete cascade;

delete from public.prompts
where user_id is null;

alter table public.prompts
alter column user_id set not null;

create index if not exists prompts_user_id_updated_at_idx
on public.prompts (user_id, updated_at desc);

alter table public.prompts enable row level security;

drop policy if exists "Users can read their own prompts" on public.prompts;
drop policy if exists "Users can create their own prompts" on public.prompts;
drop policy if exists "Users can update their own prompts" on public.prompts;
drop policy if exists "Users can delete their own prompts" on public.prompts;

create policy "Users can read their own prompts"
on public.prompts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own prompts"
on public.prompts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own prompts"
on public.prompts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own prompts"
on public.prompts
for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.prompts is
  'Phase 2 per-user prompt storage protected by Supabase Auth and RLS.';
