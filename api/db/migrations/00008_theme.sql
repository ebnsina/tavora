-- +goose Up
-- The brand colour used across the website, dashboard and POS.
alter table restaurant add column theme text not null default '#d5161a' check (theme ~ '^#[0-9a-f]{6}$');

-- +goose Down
alter table restaurant drop column theme;
