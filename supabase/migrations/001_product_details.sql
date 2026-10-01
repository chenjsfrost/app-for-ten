-- Product details (ratings, gallery, shipping info) and "Buy now".
-- Run once in the Supabase SQL Editor. Safe to run again.

alter table public.products
  add column if not exists category text,
  add column if not exists brand text,
  add column if not exists rating numeric(2, 1) check (rating between 0 and 5),
  add column if not exists discount_percentage numeric(5, 2) not null default 0,
  add column if not exists images text[] not null default '{}',
  add column if not exists shipping_info text,
  add column if not exists warranty_info text,
  add column if not exists return_policy text,
  add column if not exists reviews jsonb not null default '[]';

-- Order a single product straight away, skipping the cart.
create or replace function public.buy_now(p_product_id bigint, p_quantity integer)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  item record;
  new_order_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  select id, name, price, stock into item
  from public.products where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found';
  end if;
  if p_quantity > item.stock then
    raise exception 'Only % left in stock', item.stock;
  end if;

  insert into public.orders (buyer_id, total)
  values (auth.uid(), item.price * p_quantity)
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, product_name, price, quantity)
  values (new_order_id, item.id, item.name, item.price, p_quantity);

  update public.products set stock = stock - p_quantity where id = item.id;

  return new_order_id;
end;
$$;
