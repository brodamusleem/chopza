alter table public.orders
  add column if not exists delivery_phone text,
  add column if not exists delivery_notes text;

comment on column public.orders.delivery_phone is
  'Customer phone number provided for coordinating this delivery.';
comment on column public.orders.delivery_notes is
  'Optional customer instructions for completing this delivery.';
