create table if not exists public.user_saved_books (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, book_id)
);

create table if not exists public.user_book_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_book_activity_action_check check (action in ('opened', 'viewed', 'saved', 'removed'))
);

create index if not exists user_saved_books_user_id_idx on public.user_saved_books (user_id, created_at desc);
create index if not exists user_book_activity_user_id_idx on public.user_book_activity (user_id, created_at desc);

alter table public.user_saved_books enable row level security;
alter table public.user_book_activity enable row level security;

drop policy if exists "Users can read their saved books" on public.user_saved_books;
create policy "Users can read their saved books"
on public.user_saved_books
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their saved books" on public.user_saved_books;
create policy "Users can insert their saved books"
on public.user_saved_books
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their saved books" on public.user_saved_books;
create policy "Users can delete their saved books"
on public.user_saved_books
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their book activity" on public.user_book_activity;
create policy "Users can read their book activity"
on public.user_book_activity
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their book activity" on public.user_book_activity;
create policy "Users can insert their book activity"
on public.user_book_activity
for insert
to authenticated
with check (auth.uid() = user_id);
