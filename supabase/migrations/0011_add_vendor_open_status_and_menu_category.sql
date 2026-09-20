-- 0011_add_vendor_open_status_and_menu_category.sql
-- Documents columns that existed in the live schema before migration tracking.
alter table vendors add column if not exists is_open boolean not null default true;
alter table menu_items add column if not exists category text;
