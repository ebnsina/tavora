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
	and (not @active_only::bool or status not in ('completed', 'cancelled', 'open'))
order by created_at desc
limit 200;

-- name: ListOrderItemsFor :many
select * from order_items where order_id = any(@ids::uuid[]) order by name;

-- name: UpdateOrderStatus :execrows
-- Online orders only; POS tickets change state through the POS endpoints.
update orders set status = @status where id = @id and source = 'online' and @status::order_status <> 'open';

-- name: ListReservations :many
select * from reservations
where starts_at >= now() - interval '1 day' or status = 'requested'
order by starts_at
limit 200;

-- name: ListReservationsByPhone :many
select * from reservations where phone = @phone and id <> @id order by starts_at desc limit 10;

-- name: CustomerOrderStats :one
select count(*)::int as orders, coalesce(sum(total), 0)::bigint as spent, max(created_at)::timestamptz as last_at
from orders where phone = @phone and status not in ('cancelled', 'open');

-- name: UpdateReservationStatus :execrows
update reservations set status = $2 where id = $1;

-- ---- Overview (days are Bangladesh calendar days)

-- name: DailySales :many
select (created_at at time zone 'Asia/Dhaka')::date as day,
	count(*) filter (where status not in ('cancelled', 'open')) as orders,
	coalesce(sum(total) filter (where status not in ('cancelled', 'open')), 0)::bigint as revenue
from orders
where created_at >= @since and created_at < @until
group by 1
order by 1;

-- name: PeriodTotals :one
select count(*) filter (where status not in ('cancelled', 'open')) as orders,
	coalesce(sum(total) filter (where status not in ('cancelled', 'open')), 0)::bigint as revenue,
	count(*) filter (where status = 'cancelled') as cancelled,
	count(*) filter (where status not in ('cancelled', 'open') and mode = 'delivery') as delivery,
	count(*) filter (where status not in ('cancelled', 'open') and mode = 'pickup') as pickup,
	count(*) filter (where status not in ('cancelled', 'open') and mode = 'dine_in') as dine_in
from orders
where created_at >= @since and created_at < @until;

-- name: TopItems :many
select oi.name, sum(oi.qty)::bigint as qty, sum(oi.qty * oi.unit_price)::bigint as revenue
from order_items oi
join orders o on o.id = oi.order_id
where o.created_at >= @since and o.created_at < @until and o.status not in ('cancelled', 'open')
group by oi.name
order by qty desc, revenue desc
limit 5;

-- name: OpenOrderCounts :many
select status, count(*) as n from orders
where status not in ('completed', 'cancelled', 'open')
group by status;

-- name: UpcomingBookings :many
select * from reservations
where starts_at >= now() and status in ('requested', 'confirmed')
order by starts_at
limit 5;

-- ---- POS

-- name: ListTables :many
select * from dining_tables order by position, name;

-- name: CreateTable :one
insert into dining_tables (name, seats, area, position)
values ($1, $2, $3, (select coalesce(max(position), 0) + 1 from dining_tables))
returning *;

-- name: UpdateTable :execrows
update dining_tables set name = $2, seats = $3, area = $4 where id = $1;

-- name: DeleteTable :execrows
delete from dining_tables t where t.id = $1
	and not exists (select 1 from orders o where o.table_id = t.id);

-- name: OpenTickets :many
select o.*, t.name as table_name,
	(select coalesce(sum(qty - sent_qty), 0) from order_items where order_id = o.id)::bigint as unsent,
	(select coalesce(sum(amount), 0) from payments where order_id = o.id)::bigint as paid
from orders o
left join dining_tables t on t.id = o.table_id
where o.status = 'open'
order by o.created_at;

-- name: GetOrderForUpdate :one
select * from orders where id = $1 for update;

-- name: InsertPosOrder :exec
insert into orders (id, mode, status, source, table_id, customer_name, phone, note, subtotal, delivery_fee, discount, total)
values ($1, $2, 'open', 'pos', $3, $4, $5, $6, $7, 0, $8, $9);

-- name: UpdatePosOrder :exec
update orders set mode = $2, table_id = $3, customer_name = $4, phone = $5, note = $6,
	subtotal = $7, discount = $8, total = $9
where id = $1;

-- name: DeleteOrderItems :exec
delete from order_items where order_id = $1;

-- name: InsertPosItem :exec
insert into order_items (order_id, menu_item_id, name, unit_price, qty, sent_qty) values ($1, $2, $3, $4, $5, $6);

-- name: MarkAllSent :exec
update order_items set sent_qty = qty where order_id = $1;

-- name: InsertKitchenTicket :execrows
insert into kitchen_tickets (id, order_id, lines) values ($1, $2, $3) on conflict (id) do nothing;

-- name: CountKitchenTickets :one
select count(*) from kitchen_tickets where order_id = $1;

-- name: ListPayments :many
select * from payments where order_id = $1 order by created_at;

-- name: InsertPayment :execrows
insert into payments (id, order_id, method, amount, tip, reference) values ($1, $2, $3, $4, $5, $6)
on conflict (id) do nothing;

-- name: PaidTotal :one
select coalesce(sum(amount), 0)::bigint from payments where order_id = $1;

-- name: CloseOrder :exec
update orders set status = @status, paid_at = case when @status = 'completed'::order_status then now() else paid_at end
where id = @id;

-- name: KitchenBoard :many
select k.*, o.number, o.mode, o.source, t.name as table_name, o.customer_name
from kitchen_tickets k
join orders o on o.id = k.order_id
left join dining_tables t on t.id = o.table_id
where k.done_at is null or k.done_at > now() - interval '30 minutes'
order by k.done_at nulls first, k.created_at;

-- name: SetTicketDone :execrows
update kitchen_tickets set done_at = case when @done::bool then now() else null end where id = @id;

-- name: KitchenTicketExists :one
select exists (select 1 from kitchen_tickets where id = $1);
