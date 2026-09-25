-- +goose NO TRANSACTION
-- New enum values can't be used in the transaction that adds them, so they get their own migration.

-- +goose Up
alter type order_mode add value if not exists 'dine_in';
alter type order_status add value if not exists 'open' before 'new';

-- +goose Down
-- Postgres can't drop enum values; the extra values are harmless if left behind.
select 1;
