-- COOL STUFF: schema + RLS + functions + storage
-- Run the whole file in Supabase Dashboard -> SQL Editor.

create extension if not exists pgcrypto;

-- ============ PROFILES & ROLE ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Only one admin can ever exist
create unique index one_admin_only on public.profiles ((role)) where role = 'admin';

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Logged-in API users can never change role. Only the SQL editor (auth.uid() is null) can.
create or replace function public.guard_role() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null then new.role := old.role; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_role();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  insert into notifications (type, message, link)
  values ('new_user', 'New user registered: ' || coalesce(new.email,''), '/admin/users');
  return new;
end $$;

-- ============ CATALOG ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  accent_from text not null default '#fb923c',  -- gradient start
  accent_to text not null default '#fbbf24',    -- gradient end
  created_at timestamptz not null default now()
);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  slug text not null,
  unique (category_id, slug)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 150),
  slug text not null unique,
  short_description text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price is null or original_price >= price),
  discount_percent int generated always as (
    case when original_price > 0 and original_price > price
      then round((original_price - price) / original_price * 100)::int else 0 end
  ) stored,
  brand text,
  category_id uuid not null references categories(id) on delete restrict, -- blocks deleting a used category
  subcategory_id uuid references subcategories(id) on delete set null,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  specifications jsonb not null default '[]',  -- [{"label":"Weight","value":"200g"}]
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  view_count int not null default 0,
  click_count int not null default 0,
  avg_rating numeric(3,2) not null default 0,   -- maintained by trigger only
  review_count int not null default 0,          -- maintained by trigger only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on products (status, created_at desc);
create index products_category_idx on products (category_id, subcategory_id);
create index products_search_idx on products using gin (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(description,''))
);

create table public.product_tags (
  product_id uuid references products(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (product_id, tag_id)
);
create index product_tags_tag_idx on product_tags (tag_id);

-- Max 3 images: position is limited to 1..3 and unique per product
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  position int not null check (position between 1 and 3),
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger products_touch before update on products
  for each row execute function touch_updated_at();

-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 5 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)  -- one review per user per product (edit allowed)
);
create index reviews_product_idx on reviews (product_id, created_at desc);
create trigger reviews_touch before update on reviews
  for each row execute function touch_updated_at();

create or replace function public.refresh_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update products set
    avg_rating = coalesce((select round(avg(rating)::numeric, 2) from reviews where product_id = pid), 0),
    review_count = (select count(*) from reviews where product_id = pid)
  where id = pid;
  if tg_op = 'INSERT' then
    insert into notifications (type, message, link)
    values ('new_review', 'New review (' || new.rating || '/5)', '/admin/reviews');
  end if;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on reviews
  for each row execute function refresh_rating();

-- ============ WISHLIST & CART ============
create table public.wishlists (
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.cart_items (
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null default 1 check (quantity between 1 and 99),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ============ ORDERS ============
create sequence public.order_number_seq start 1;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references profiles(id) on delete restrict,
  customer_name text not null,
  phone text not null,
  address text not null,
  address_details text,
  total_amount numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on orders (user_id, created_at desc);
create index orders_status_idx on orders (status, created_at desc);
create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

-- Snapshot name + price at order time (prices can change later)
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on order_items (order_id);

-- ============ NOTIFICATIONS & ANALYTICS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_events (
  id bigint generated always as identity primary key,
  product_id uuid not null references products(id) on delete cascade,
  event_type text not null check (event_type in ('view','click','whatsapp_click','add_to_cart','wishlist_add','order')),
  user_id uuid,  -- nullable, no IP / device tracking
  created_at timestamptz not null default now()
);
create index product_events_idx on product_events (product_id, event_type, created_at desc);

-- ============ FUNCTIONS ============
-- Safe analytics: only published products, counters incremented atomically
create or replace function public.track_event(p_product_id uuid, p_event text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_event not in ('view','click','whatsapp_click','add_to_cart','wishlist_add') then return; end if;
  if not exists (select 1 from products where id = p_product_id and status = 'published') then return; end if;
  insert into product_events (product_id, event_type, user_id) values (p_product_id, p_event, auth.uid());
  if p_event = 'view' then update products set view_count = view_count + 1 where id = p_product_id;
  elsif p_event in ('click','whatsapp_click') then update products set click_count = click_count + 1 where id = p_product_id;
  end if;
end $$;

-- Checkout: prices come ONLY from the database, never from the client
create or replace function public.create_order(
  p_name text, p_phone text, p_address text, p_address_details text default null
) returns table (order_id uuid, order_number text, total_amount numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_number text;
  v_total numeric(10,2);
begin
  if v_user is null then raise exception 'Please log in to place an order'; end if;
  if char_length(trim(p_name)) < 2 then raise exception 'Please enter a valid name'; end if;
  if p_phone !~ '^[0-9+\- ]{8,15}$' then raise exception 'Please enter a valid phone number'; end if;
  if char_length(trim(p_address)) < 10 then raise exception 'Please enter a complete address'; end if;
  if not exists (select 1 from cart_items where user_id = v_user) then raise exception 'Your cart is empty'; end if;
  if exists (select 1 from cart_items c join products p on p.id = c.product_id
             where c.user_id = v_user and p.status <> 'published') then
    raise exception 'Some products in your cart are no longer available';
  end if;

  select sum(p.price * c.quantity) into v_total
  from cart_items c join products p on p.id = c.product_id where c.user_id = v_user;

  v_number := 'CS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');

  insert into orders (order_number, user_id, customer_name, phone, address, address_details, total_amount)
  values (v_number, v_user, trim(p_name), trim(p_phone), trim(p_address), nullif(trim(p_address_details), ''), v_total)
  returning id into v_id;

  insert into order_items (order_id, product_id, product_name, unit_price, quantity)
  select v_id, p.id, p.name, p.price, c.quantity
  from cart_items c join products p on p.id = c.product_id where c.user_id = v_user;

  insert into product_events (product_id, event_type, user_id)
  select product_id, 'order', v_user from cart_items where user_id = v_user;

  delete from cart_items where user_id = v_user;

  insert into notifications (type, message, link)
  values ('new_order', 'New order ' || v_number || ' (' || v_total || ')', '/admin/orders');

  return query select v_id, v_number, v_total;
end $$;
revoke all on function public.create_order from public, anon;
grant execute on function public.create_order to authenticated;
grant execute on function public.track_event to anon, authenticated;

-- ============ ROW LEVEL SECURITY ============
alter table profiles enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table tags enable row level security;
alter table products enable row level security;
alter table product_tags enable row level security;
alter table product_images enable row level security;
alter table reviews enable row level security;
alter table wishlists enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table notifications enable row level security;
alter table product_events enable row level security;

-- profiles
create policy "own or admin read" on profiles for select using (id = auth.uid() or is_admin());
create policy "own update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- public catalog read, admin write
create policy "read categories" on categories for select using (true);
create policy "admin categories" on categories for all using (is_admin()) with check (is_admin());
create policy "read subcategories" on subcategories for select using (true);
create policy "admin subcategories" on subcategories for all using (is_admin()) with check (is_admin());
create policy "read tags" on tags for select using (true);
create policy "admin tags" on tags for all using (is_admin()) with check (is_admin());

create policy "read published products" on products for select using (status = 'published' or is_admin());
create policy "admin products" on products for all using (is_admin()) with check (is_admin());

create policy "read product_tags" on product_tags for select using (
  exists (select 1 from products p where p.id = product_id and (p.status = 'published' or is_admin())));
create policy "admin product_tags" on product_tags for all using (is_admin()) with check (is_admin());

create policy "read product_images" on product_images for select using (
  exists (select 1 from products p where p.id = product_id and (p.status = 'published' or is_admin())));
create policy "admin product_images" on product_images for all using (is_admin()) with check (is_admin());

-- reviews: public read, own write, admin delete
create policy "read reviews" on reviews for select using (true);
create policy "insert own review" on reviews for insert with check (user_id = auth.uid());
create policy "update own review" on reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own or admin" on reviews for delete using (user_id = auth.uid() or is_admin());

-- wishlist & cart: strictly private (no admin policy on purpose)
create policy "own wishlist" on wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cart" on cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: created only via create_order(); users read own; admin manages
create policy "read own orders" on orders for select using (user_id = auth.uid() or is_admin());
create policy "admin update orders" on orders for update using (is_admin()) with check (is_admin());
create policy "read own order items" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));

-- admin-only
create policy "admin notifications" on notifications for all using (is_admin()) with check (is_admin());
create policy "admin read events" on product_events for select using (is_admin());

-- ============ STORAGE (product images) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and is_admin());
create policy "admin update product images" on storage.objects for update using (bucket_id = 'product-images' and is_admin());
create policy "admin delete product images" on storage.objects for delete using (bucket_id = 'product-images' and is_admin());

-- ============ AFTER RUNNING ============
-- 1) Sign up on the site with your admin email, then run:
--    update public.profiles set role = 'admin' where email = 'YOUR_EMAIL_HERE';
-- 2) Create the auth trigger (last, so it never blocks the setup above):
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
