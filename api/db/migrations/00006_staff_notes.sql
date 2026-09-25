-- +goose Up
-- Staff are admins without an email who sign in with a PIN (its bcrypt hash sits in password_hash).
alter table admins
	add column role text not null default 'owner' check (role in ('owner', 'staff')),
	alter column email drop not null,
	add constraint owner_has_email check (role = 'staff' or email is not null);

-- Who did what on the till, for the end-of-day report.
alter table orders
	add column created_by bigint references admins on delete set null,
	add column voided_by bigint references admins on delete set null;
alter table payments add column taken_by bigint references admins on delete set null;

-- A cook's instruction on one dish line, e.g. "no onion".
alter table order_items add column note text;

-- +goose Down
alter table order_items drop column note;
alter table payments drop column taken_by;
alter table orders drop column voided_by, drop column created_by;
delete from admins where role = 'staff';
alter table admins drop constraint owner_has_email, alter column email set not null, drop column role;
