create extension if not exists "pgcrypto";

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null,
  category text not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_prompts_updated_at on public.prompts;

create trigger set_prompts_updated_at
before update on public.prompts
for each row
execute function public.set_updated_at();

alter table public.prompts disable row level security;

comment on table public.prompts is
  'Phase 1 single-tenant prompt storage. Add auth, tenants, and RLS before production SaaS use.';
