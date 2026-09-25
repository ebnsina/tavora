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

-- ---- CMS

-- name: GetSiteContent :one
select data from site_content where id = 1;

-- name: UpdateSiteContent :exec
update site_content set data = $1, updated_at = now() where id = 1;

-- name: CreateAdmin :one
insert into admins (email, name, password_hash) values ($1, $2, $3) returning id;

-- name: GetAdminByEmail :one
select * from admins where email = $1;

-- name: CreateSession :exec
insert into sessions (token_hash, admin_id, expires_at) values ($1, $2, $3);

-- name: GetSessionAdmin :one
select a.id, a.email, a.name
from sessions s join admins a on a.id = s.admin_id
where s.token_hash = $1 and s.expires_at > now();

-- name: DeleteSession :exec
delete from sessions where token_hash = $1;

-- name: DeleteExpiredSessions :exec
delete from sessions where expires_at <= now();

-- name: UpdateRestaurant :exec
update restaurant set name = $1, area = $2, address = $3, phone = $4, whatsapp = $5, email = $6,
	delivery_fee = $7, free_delivery_over = $8, delivery_areas = $9, delivery_eta = $10, pickup_eta = $11
where id = 1;

-- name: DeleteOpeningHours :exec
delete from opening_hours;

-- name: InsertOpeningHours :exec
insert into opening_hours (weekday, opens, closes) values ($1, $2, $3);

-- name: ListCategories :many
select * from categories order by position;

-- name: CreateCategory :one
insert into categories (slug, name, position)
values ($1, $2, (select coalesce(max(position), 0) + 1 from categories))
returning *;

-- name: UpdateCategory :execrows
update categories set name = $2, slug = $3, position = $4 where id = $1;

-- name: DeleteCategory :execrows
delete from categories where id = $1;

-- name: CountCategoryItems :one
select count(*) from menu_items where category_id = $1;

-- name: CreateMenuItem :one
insert into menu_items (category_id, name, description, price, tags, image, available, position)
values ($1, $2, $3, $4, $5, $6, $7, (select coalesce(max(position), 0) + 1 from menu_items where category_id = $1))
returning *;

-- name: UpdateMenuItem :execrows
update menu_items set category_id = $2, name = $3, description = $4, price = $5, tags = $6,
	image = $7, available = $8, position = $9
where id = $1;

-- name: CountItemOrders :one
select count(*) from order_items where menu_item_id = $1;

-- name: DeleteMenuItem :execrows
delete from menu_items where id = $1;

-- name: ListOrders :many
select * from orders
where (sqlc.narg('status')::order_status is null or status = sqlc.narg('status'))
order by created_at desc
limit 200;

-- name: ListOrderItemsFor :many
select * from order_items where order_id = any(@ids::uuid[]) order by name;

-- name: UpdateOrderStatus :execrows
update orders set status = $2 where id = $1;

-- name: ListReservations :many
select * from reservations
where starts_at >= now() - interval '1 day' or status = 'requested'
order by starts_at
limit 200;

-- name: UpdateReservationStatus :execrows
update reservations set status = $2 where id = $1;
