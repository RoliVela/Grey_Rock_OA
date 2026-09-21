create table categories (
  id serial primary key,
  name text not null unique
);

create table businesses (
  id serial primary key,
  name text not null,
  category_id int not null references categories(id) on delete restrict,
  neighborhood text,
  phone text,
  address text,
  website_url text,
  source text default 'basic_scraper',
  last_updated timestamptz default now()
);
create index businesses_category_id_idx on businesses(category_id);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_demo boolean default false,
  neighborhood text
);

create table questionnaire_responses (
  id serial primary key,
  profile_id uuid not null unique references profiles(id) on delete cascade,
  kid_ages text,
  priority text,
  submitted_at timestamptz default now()
);

create table response_categories (
  response_id int not null references questionnaire_responses(id) on delete cascade,
  category_id int not null references categories(id) on delete cascade,
  primary key (response_id, category_id)
);

-- Public directory data: readable by anyone, written only via service role (scraper/admin).
alter table categories enable row level security;
alter table businesses enable row level security;
create policy "public read categories" on categories for select using (true);
create policy "public read businesses" on businesses for select using (true);

-- Per-user data: locked to the owning auth user.
alter table profiles enable row level security;
alter table questionnaire_responses enable row level security;
alter table response_categories enable row level security;

create policy "own profile" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "own responses" on questionnaire_responses for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "own response categories" on response_categories for all
  using (exists (
    select 1 from questionnaire_responses r
    where r.id = response_id and r.profile_id = auth.uid()
  ));
