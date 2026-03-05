-- Reviews table for profile opinions/comments

create extension if not exists "pgcrypto";

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  author_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews
  add constraint if not exists reviews_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete cascade,
  add constraint if not exists reviews_author_id_fkey
    foreign key (author_id) references public.profiles(id) on delete cascade;

create index if not exists idx_reviews_profile_id_created_at
  on public.reviews (profile_id, created_at desc);

create index if not exists idx_reviews_author_id
  on public.reviews (author_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_on_reviews on public.reviews;

create trigger set_updated_at_on_reviews
before update on public.reviews
for each row
execute function public.set_updated_at();

alter table public.reviews enable row level security;

create policy if not exists "Reviews are readable by everyone"
on public.reviews
for select
using (true);

create policy if not exists "Users can insert their own reviews"
on public.reviews
for insert
to authenticated
with check (author_id = auth.uid());

create policy if not exists "Users can update their own reviews"
on public.reviews
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy if not exists "Users can delete their own reviews"
on public.reviews
for delete
to authenticated
using (author_id = auth.uid());

