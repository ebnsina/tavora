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
insert into orders (id, mode, customer_name, phone, address, note, subtotal, delivery_fee, total, vat, vat_rate, vat_inclusive)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
select a.id, a.email, a.name, a.role
from sessions s join admins a on a.id = s.admin_id
where s.token_hash = $1 and s.expires_at > now();

-- name: ListStaff :many
select id, name, password_hash, created_at from admins where role = 'staff' order by name;

-- name: CreateStaff :one
insert into admins (name, password_hash, role) values ($1, $2, 'staff') returning id;

-- name: UpdateStaff :execrows
update admins set name = @name, password_hash = coalesce(sqlc.narg('pin_hash'), password_hash)
where id = @id and role = 'staff';

-- name: DeleteStaff :execrows
delete from admins where id = $1 and role = 'staff';

-- name: TableName :one
select name from dining_tables where id = $1;

-- name: AdminNames :many
select id, name from admins where id = any(@ids::bigint[]);

-- name: DeleteSession :exec
delete from sessions where token_hash = $1;

-- name: DeleteExpiredSessions :exec
delete from sessions where expires_at <= now();

-- name: UpdateRestaurant :exec
update restaurant set name = $1, area = $2, address = $3, phone = $4, whatsapp = $5, email = $6,
	delivery_fee = $7, free_delivery_over = $8, delivery_areas = $9, delivery_eta = $10, pickup_eta = $11
where id = 1;

-- name: UpdateTheme :exec
update restaurant set theme = $1 where id = 1;

-- name: UpdateVat :exec
update restaurant set vat_rate = $1, vat_inclusive = $2, bin = $3 where id = 1;

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
insert into orders (id, mode, status, source, table_id, customer_name, phone, note, subtotal, delivery_fee, discount, total, created_by, vat, vat_rate, vat_inclusive)
values ($1, $2, 'open', 'pos', $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13);

-- name: UpdatePosOrder :exec
update orders set mode = $2, table_id = $3, customer_name = $4, phone = $5, note = $6,
	subtotal = $7, discount = $8, total = $9, vat = $10
where id = $1;

-- name: DeleteOrderItems :exec
delete from order_items where order_id = $1;

-- name: InsertPosItem :exec
insert into order_items (order_id, menu_item_id, name, unit_price, qty, sent_qty, note) values ($1, $2, $3, $4, $5, $6, $7);

-- name: MarkAllSent :exec
update order_items set sent_qty = qty where order_id = $1;

-- name: InsertKitchenTicket :execrows
insert into kitchen_tickets (id, order_id, lines) values ($1, $2, $3) on conflict (id) do nothing;

-- name: CountKitchenTickets :one
select count(*) from kitchen_tickets where order_id = $1;

-- name: ListPayments :many
select * from payments where order_id = $1 order by created_at;

-- name: InsertPayment :execrows
insert into payments (id, order_id, method, amount, tip, reference, taken_by) values ($1, $2, $3, $4, $5, $6, $7)
on conflict (id) do nothing;

-- name: PaidTotal :one
select coalesce(sum(amount), 0)::bigint from payments where order_id = $1;

-- name: CloseOrder :exec
update orders set status = @status, paid_at = case when @status = 'completed'::order_status then now() else paid_at end,
	voided_by = sqlc.narg('voided_by')
where id = @id;

-- ---- New-order alert

-- name: Alerts :one
select
	(select count(*) from orders where source = 'online' and status = 'new')::int as new_orders,
	(select count(*) from reservations where status = 'requested')::int as waiting_bookings;

-- ---- End of day (one Bangladesh calendar day)

-- name: DayPayments :many
select p.method, count(*)::int as count, sum(p.amount)::bigint as amount, sum(p.tip)::bigint as tips
from payments p
where (p.created_at at time zone 'Asia/Dhaka')::date = @day::date
group by p.method order by p.method;

-- name: DayByStaff :many
select coalesce(a.name, 'Not recorded')::text as name, count(*)::int as count,
	sum(p.amount)::bigint as amount, sum(p.tip)::bigint as tips
from payments p left join admins a on a.id = p.taken_by
where (p.created_at at time zone 'Asia/Dhaka')::date = @day::date
group by 1 order by 3 desc;

-- name: DayOrders :one
-- Online orders are paid in cash on delivery or pickup and have no payment rows.
select
	count(*) filter (where source = 'online' and status = 'completed')::int as online_count,
	coalesce(sum(total) filter (where source = 'online' and status = 'completed'), 0)::bigint as online_cash,
	count(*) filter (where source = 'pos' and status = 'completed' and discount > 0)::int as discount_count,
	coalesce(sum(discount) filter (where source = 'pos' and status = 'completed'), 0)::bigint as discounts,
	coalesce(sum(vat) filter (where status = 'completed'), 0)::bigint as vat,
	count(*) filter (where status = 'open')::int as open_count,
	coalesce(sum(total) filter (where status = 'open'), 0)::bigint as open_total
from orders
where (created_at at time zone 'Asia/Dhaka')::date = @day::date;

-- name: DayVoids :many
select o.id, o.number, o.total, o.customer_name, o.created_at, coalesce(a.name, '')::text as voided_by
from orders o left join admins a on a.id = o.voided_by
where o.source = 'pos' and o.status = 'cancelled'
	and (o.created_at at time zone 'Asia/Dhaka')::date = @day::date
order by o.created_at;

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

-- name: UpsertOtp :exec
insert into otp_codes (phone, code_hash, expires_at) values ($1, $2, $3)
on conflict (phone) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0;

-- name: GetOtp :one
select * from otp_codes where phone = $1;

-- name: BumpOtpAttempts :exec
update otp_codes set attempts = attempts + 1 where phone = $1;

-- name: DeleteOtp :exec
delete from otp_codes where phone = $1;

-- name: UpsertCustomer :one
insert into customers (phone) values ($1)
on conflict (phone) do update set phone = excluded.phone
returning *;

-- name: CreateCustomerSession :exec
insert into customer_sessions (token_hash, customer_id, expires_at) values ($1, $2, $3);

-- name: GetSessionCustomer :one
select c.* from customer_sessions s join customers c on c.id = s.customer_id
where s.token_hash = $1 and s.expires_at > now();

-- name: DeleteCustomerSession :exec
delete from customer_sessions where token_hash = $1;

-- name: DeleteExpiredCustomerSessions :exec
delete from customer_sessions where expires_at <= now();

-- name: SetOrderCustomer :exec
update orders set customer_id = $2 where id = $1;

-- name: UpdateCustomerDetails :exec
update customers set name = $2, address = coalesce(sqlc.narg(address), address) where id = $1;

-- name: ListCustomerOrders :many
select * from orders where customer_id = $1 order by created_at desc limit 20;
