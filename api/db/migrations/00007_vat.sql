-- +goose Up
-- VAT is off (rate 0) until the owner enters their rate; rate is in basis points (500 = 5%).
alter table restaurant
	add column vat_rate int not null default 0 check (vat_rate between 0 and 3000),
	add column vat_inclusive bool not null default true,
	add column bin text not null default '';

-- Each order keeps the VAT it was rung up with, so a later rate change never rewrites old invoices.
alter table orders
	add column vat bigint not null default 0 check (vat >= 0),
	add column vat_rate int not null default 0,
	add column vat_inclusive bool not null default true;

-- +goose Down
alter table orders drop column vat_inclusive, drop column vat_rate, drop column vat;
alter table restaurant drop column bin, drop column vat_inclusive, drop column vat_rate;
