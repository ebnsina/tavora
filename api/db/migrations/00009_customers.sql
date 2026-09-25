-- +goose Up
-- Customers of the phone app; signing in is optional, guests still order with just a name and phone.
create table customers (
	id bigint generated always as identity primary key,
	phone text not null unique,
	name text not null default '',
	address text not null default '',
	created_at timestamptz not null default now()
);

create table customer_sessions (
	token_hash bytea primary key,
	customer_id bigint not null references customers on delete cascade,
	expires_at timestamptz not null,
	created_at timestamptz not null default now()
);

-- One live sign-in code per phone; only its SHA-256 is stored.
create table otp_codes (
	phone text primary key,
	code_hash bytea not null,
	expires_at timestamptz not null,
	attempts int not null default 0
);

alter table orders add column customer_id bigint references customers on delete set null;
create index orders_customer_idx on orders (customer_id, created_at desc);

-- +goose Down
alter table orders drop column customer_id;
drop table otp_codes;
drop table customer_sessions;
drop table customers;
