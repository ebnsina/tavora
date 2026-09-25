-- name: GetRestaurant :one
select * from restaurant where id = 1;

-- name: ListOpeningHours :many
select * from opening_hours order by weekday;

-- name: GetOpeningHours :one
select * from opening_hours where weekday = $1;

-- name: ListMenu :many
select c.slug as category_slug, c.name as category_name, i.*
from menu_items i
join categories c on c.id = i.category_id
order by c.position, i.position;

-- name: GetMenuItems :many
select * from menu_items where id = any(@ids::bigint[]);

-- name: InsertOrder :execrows
insert into orders (id, mode, customer_name, phone, address, note, subtotal, delivery_fee, total)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
on conflict (id) do nothing;

-- name: InsertOrderItem :exec
insert into order_items (order_id, menu_item_id, name, unit_price, qty) values ($1, $2, $3, $4, $5);

-- name: GetOrder :one
select * from orders where id = $1;

-- name: ListOrderItems :many
select * from order_items where order_id = $1 order by name;

-- name: InsertReservation :execrows
insert into reservations (id, customer_name, phone, guests, starts_at, note)
values ($1, $2, $3, $4, $5, $6)
on conflict (id) do nothing;

-- name: GetReservation :one
select * from reservations where id = $1;
