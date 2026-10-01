-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- Profiles: one row per user, created automatically on sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.products (
  id bigint generated always as identity primary key,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 1 check (stock >= 0),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.cart_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  primary key (user_id, product_id)
);

create table public.orders (
  id bigint generated always as identity primary key,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  price numeric(10, 2) not null,
  quantity integer not null
);

-- Create a profile on sign-up, and cap the app at ten members.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.profiles) >= 10 then
    raise exception 'This app is limited to 10 members';
  end if;
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Turn the cart into an order in one transaction, reducing stock.
create function public.checkout()
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  new_order_id bigint;
  order_total numeric(10, 2);
begin
  if exists (
    select 1 from public.cart_items c
    join public.products p on p.id = c.product_id
    where c.user_id = auth.uid() and c.quantity > p.stock
  ) then
    raise exception 'Some items are out of stock';
  end if;

  select coalesce(sum(p.price * c.quantity), 0) into order_total
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = auth.uid();

  if order_total = 0 then
    raise exception 'Cart is empty';
  end if;

  insert into public.orders (buyer_id, total)
  values (auth.uid(), order_total)
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, product_name, price, quantity)
  select new_order_id, p.id, p.name, p.price, c.quantity
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = auth.uid();

  update public.products p set stock = p.stock - c.quantity
  from public.cart_items c
  where c.product_id = p.id and c.user_id = auth.uid();

  delete from public.cart_items where user_id = auth.uid();

  return new_order_id;
end;
$$;

-- Row Level Security: members see all products, but only their own cart and orders.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Members can view profiles" on public.profiles
  for select to authenticated using (true);

create policy "Members can view products" on public.products
  for select to authenticated using (true);
create policy "Sellers can add products" on public.products
  for insert to authenticated with check (seller_id = auth.uid());
create policy "Sellers can update own products" on public.products
  for update to authenticated using (seller_id = auth.uid());
create policy "Sellers can delete own products" on public.products
  for delete to authenticated using (seller_id = auth.uid());

create policy "Users manage own cart" on public.cart_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users view own orders" on public.orders
  for select to authenticated using (buyer_id = auth.uid());
create policy "Users view own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
  );
