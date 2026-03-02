create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.ad_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  channel text not null,
  region text not null,
  device_type text not null default 'DP 21.5"',
  weekly_traffic integer not null default 0 check (weekly_traffic >= 0),
  operating_hours text not null default '06:00 - 22:00',
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_locations
drop constraint if exists ad_locations_channel_check;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  advertiser text not null,
  objective text not null default 'Campaign execution',
  budget numeric(14, 2) not null default 0 check (budget >= 0),
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_date_window check (start_date <= end_date),
  constraint campaigns_identity_unique unique (name, advertiser, start_date, end_date)
);

create table if not exists public.location_screens (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.ad_locations (id) on delete cascade,
  screen_code text not null,
  screen_type text not null,
  model text not null default '',
  slot_count integer not null default 32 check (slot_count > 0),
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_screens_identity_unique unique (location_id, screen_code)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.ad_locations (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  spot_count integer not null default 0 check (spot_count >= 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'live', 'done', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_window check (start_at < end_at)
);

drop trigger if exists trg_ad_locations_updated_at on public.ad_locations;
create trigger trg_ad_locations_updated_at
before update on public.ad_locations
for each row
execute function public.set_updated_at();

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

drop trigger if exists trg_location_screens_updated_at on public.location_screens;
create trigger trg_location_screens_updated_at
before update on public.location_screens
for each row
execute function public.set_updated_at();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

alter table public.bookings
drop constraint if exists bookings_no_active_overlap;

alter table public.bookings
add constraint bookings_no_active_overlap
exclude using gist (
  location_id with =,
  tstzrange(start_at, end_at, '[)') with &&
)
where (status in ('pending', 'confirmed', 'live'));

create index if not exists idx_locations_channel on public.ad_locations (channel);
create index if not exists idx_location_screens_location on public.location_screens (location_id);
create index if not exists idx_location_screens_type on public.location_screens (screen_type);
create index if not exists idx_campaigns_status on public.campaigns (status);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_window on public.bookings (start_at, end_at);

create or replace view public.booking_overview as
select
  b.id,
  b.status,
  b.start_at,
  b.end_at,
  b.spot_count,
  b.unit_price,
  (b.spot_count * b.unit_price) as booking_value,
  l.code as location_code,
  l.name as location_name,
  l.channel,
  c.name as campaign_name,
  c.advertiser
from public.bookings b
join public.ad_locations l on l.id = b.location_id
join public.campaigns c on c.id = b.campaign_id;

alter table public.ad_locations enable row level security;
alter table public.location_screens enable row level security;
alter table public.campaigns enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "ad_locations_public_all" on public.ad_locations;
drop policy if exists "location_screens_public_all" on public.location_screens;
drop policy if exists "campaigns_public_all" on public.campaigns;
drop policy if exists "bookings_public_all" on public.bookings;

-- NOTE: Open policy for rapid local/dev testing only.
create policy "ad_locations_public_all"
on public.ad_locations for all
using (true)
with check (true);

create policy "location_screens_public_all"
on public.location_screens for all
using (true)
with check (true);

create policy "campaigns_public_all"
on public.campaigns for all
using (true)
with check (true);

create policy "bookings_public_all"
on public.bookings for all
using (true)
with check (true);

insert into public.ad_locations (code, name, channel, region, device_type, weekly_traffic, operating_hours)
values
  ('HCM-UNI-01', 'DH Ton Duc Thang', 'University', 'HCM - District 7', 'DP 21.5"', 22000, '06:00 - 18:00'),
  ('HN-FF-01', 'Lotteria Tran Duy Hung', 'Fast Food', 'HN - Cau Giay', 'LCD 50"', 18200, '08:00 - 23:00')
on conflict (code) do nothing;

insert into public.campaigns (name, advertiser, objective, budget, start_date, end_date, status)
values
  ('Launch Samsung Galaxy Edge', 'Samsung Vietnam', 'Brand awareness', 140000000, '2026-03-02', '2026-04-15', 'active'),
  ('Grab Food Lunch Peak', 'Grab Vietnam', 'Drive lunch orders', 82000000, '2026-03-10', '2026-05-10', 'pending')
on conflict on constraint campaigns_identity_unique do nothing;

insert into public.location_screens (location_id, screen_code, screen_type, model, slot_count, status)
select l.id, 'DP1', 'DP', '21.5" logo', 32, 'active'
from public.ad_locations l
where l.code = 'HCM-UNI-01'
on conflict on constraint location_screens_identity_unique do nothing;

insert into public.location_screens (location_id, screen_code, screen_type, model, slot_count, status)
select l.id, 'LCD1', 'LCD', '50" portrait', 32, 'maintenance'
from public.ad_locations l
where l.code = 'HN-FF-01'
on conflict on constraint location_screens_identity_unique do nothing;
