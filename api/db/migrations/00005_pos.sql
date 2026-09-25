-- +goose Up
create table dining_tables (
	id bigint generated always as identity primary key,
	name text not null unique,
	seats smallint not null default 4 check (seats between 1 and 30),
	area text not null default '',
	position int not null default 0
);

-- POS tickets live in the same orders table as online orders; `open` means still being served.
alter table orders
	add column source text not null default 'online' check (source in ('online', 'pos')),
	add column table_id bigint references dining_tables,
	add column discount bigint not null default 0 check (discount >= 0),
	add column paid_at timestamptz,
	alter column phone drop not null,
	drop constraint orders_check,
	add constraint orders_address_check check (mode <> 'delivery' or address is not null);

-- A table has at most one open ticket.
create unique index one_open_ticket_per_table on orders (table_id) where status = 'open';

-- How many of each line the kitchen already has; only the difference is sent next time.
alter table order_items add column sent_qty int not null default 0;
alter table order_items add constraint sent_within_qty check (sent_qty between 0 and qty);

create type pay_method as enum ('cash', 'card', 'bkash', 'nagad');

-- id comes from the device, so a retried payment is recorded once.
create table payments (
	id uuid primary key,
	order_id uuid not null references orders on delete cascade,
	method pay_method not null,
	amount bigint not null check (amount > 0),
	tip bigint not null default 0 check (tip >= 0),
	reference text,
	created_at timestamptz not null default now()
);
create index on payments (order_id);

-- Each send to the kitchen is a ticket with a snapshot of its lines, so reprints match what the cook saw.
create table kitchen_tickets (
	id uuid primary key,
	order_id uuid not null references orders on delete cascade,
	lines jsonb not null,
	created_at timestamptz not null default now(),
	done_at timestamptz
);
create index kitchen_tickets_pending on kitchen_tickets (created_at) where done_at is null;

insert into dining_tables (name, seats, area, position) values
	('T1', 2, 'Window', 1), ('T2', 2, 'Window', 2), ('T3', 4, 'Main', 3), ('T4', 4, 'Main', 4),
	('T5', 4, 'Main', 5), ('T6', 6, 'Main', 6), ('T7', 8, 'Family', 7), ('T8', 8, 'Family', 8);

-- +goose Down
drop table kitchen_tickets, payments;
drop type pay_method;
alter table order_items drop constraint sent_within_qty, drop column sent_qty;
drop index one_open_ticket_per_table;
alter table orders drop constraint orders_address_check,
	drop column paid_at, drop column discount, drop column table_id, drop column source;
drop table dining_tables;
