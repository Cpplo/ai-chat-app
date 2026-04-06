create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  description text,
  category text,
  published_year integer,
  publisher text,
  language text,
  isbn text,
  cover_url text,
  open_library_work_key text,
  open_library_edition_key text,
  source text not null default 'manual',
  has_file boolean not null default false,
  storage_path text,
  download_url text,
  file_format text,
  file_size_bytes bigint,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint books_source_check check (source in ('manual', 'open_library')),
  constraint books_published_year_check check (
    published_year is null
    or published_year between 0 and extract(year from now())::integer + 1
  ),
  constraint books_file_location_check check (
    not has_file
    or storage_path is not null
    or download_url is not null
  ),
  constraint books_file_size_check check (
    file_size_bytes is null or file_size_bytes >= 0
  )
);

create index if not exists books_title_idx on public.books (title);
create index if not exists books_author_idx on public.books (author);
create index if not exists books_category_idx on public.books (category);
create index if not exists books_source_idx on public.books (source);
create index if not exists books_is_public_idx on public.books (is_public);
create unique index if not exists books_isbn_unique_idx
  on public.books (isbn)
  where isbn is not null;
create unique index if not exists books_open_library_edition_unique_idx
  on public.books (open_library_edition_key)
  where open_library_edition_key is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;

create trigger books_set_updated_at
before update on public.books
for each row
execute function public.set_updated_at();

alter table public.books enable row level security;

drop policy if exists "Authenticated users can view public books" on public.books;
create policy "Authenticated users can view public books"
on public.books
for select
to authenticated
using (is_public = true);
