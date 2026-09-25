-- +goose Up
-- Starting content, copied from the static site. The CMS edits it from here on.

insert into restaurant (name, area, address, phone, whatsapp, email, delivery_fee, free_delivery_over, delivery_areas, delivery_eta, pickup_eta) values
	('Tavora', 'Rajshahi', 'House 12, Road 3, Uposhohor, Rajshahi', '+8801700000000', '8801700000000', 'hello@tavora.example', 6000, 150000, 'Uposhohor, Shaheb Bazar, Laxmipur and Kazla', '45–60 min', '20–30 min');

insert into opening_hours (weekday, opens, closes) values
	(6, '12:00', '23:00'),
	(0, '12:00', '23:00'),
	(1, '12:00', '23:00'),
	(2, '12:00', '23:00'),
	(3, '12:00', '23:00'),
	(4, '12:00', '23:00'),
	(5, '14:00', '23:30');

insert into categories (slug, name, position) values
	('biryani', 'Biryani & rice', 2),
	('curries', 'Curries & bhuna', 3),
	('fast-food', 'Fast food', 1),
	('kebabs', 'Kebabs', 4),
	('drinks', 'Drinks & desserts', 5);

insert into menu_items (category_id, name, description, price, tags, image, position) values
	((select id from categories where slug = 'biryani'), 'Mutton kacchi biryani', 'Basmati layered with overnight-marinated mutton, aloo and saffron, cooked on dum.', 45000, '{popular}', '/img/kacchi.jpg', 1),
	((select id from categories where slug = 'biryani'), 'Chicken roast polao', 'Fragrant chinigura polao with a whole-leg chicken roast and boiled egg.', 38000, '{}', null, 2),
	((select id from categories where slug = 'biryani'), 'Beef tehari', 'Mustard-oil tehari with tender beef cubes and green chillies.', 32000, '{spicy}', null, 3),
	((select id from categories where slug = 'biryani'), 'Khichuri with begun bhaja', 'Moong dal khichuri, crisp fried aubergine and achar.', 22000, '{veg}', null, 4),
	((select id from categories where slug = 'curries'), 'Beef kala bhuna', 'Chittagong-style dark, dry beef slow-fried in its own spices.', 42000, '{spicy,popular}', '/img/kala-bhuna.jpg', 1),
	((select id from categories where slug = 'curries'), 'Chicken rezala', 'Mild yoghurt and cashew gravy, finished with kewra.', 36000, '{}', null, 2),
	((select id from categories where slug = 'curries'), 'Shorshe ilish', 'Hilsa steamed in mustard paste and green chilli. Seasonal.', 65000, '{spicy}', null, 3),
	((select id from categories where slug = 'curries'), 'Mixed vegetable bhaji', 'Seasonal vegetables tossed with panch phoron.', 18000, '{veg}', null, 4),
	((select id from categories where slug = 'fast-food'), 'Classic beef burger', 'Smashed beef patty, cheddar, pickles and house sauce in a brioche bun.', 35000, '{popular}', '/img/beef-burger.jpg', 1),
	((select id from categories where slug = 'fast-food'), 'Crispy chicken burger', 'Buttermilk fried chicken thigh, coleslaw and spicy mayo.', 29000, '{spicy}', null, 2),
	((select id from categories where slug = 'fast-food'), 'Fried chicken (2 pcs)', 'Crunchy, juicy, marinated for 12 hours. Served with dip.', 26000, '{popular}', '/img/fried-chicken.jpg', 3),
	((select id from categories where slug = 'fast-food'), 'Chicken shawarma', 'Grilled chicken, garlic toum and pickles wrapped in pita.', 22000, '{}', null, 4),
	((select id from categories where slug = 'fast-food'), 'Beef tehari sub', 'Our tehari beef in a toasted sub roll with cheese and jalapeños.', 31000, '{spicy}', null, 5),
	((select id from categories where slug = 'fast-food'), 'Masala fries', 'Crispy fries tossed in chaat masala.', 15000, '{veg}', null, 6),
	((select id from categories where slug = 'fast-food'), 'Loaded cheese fries', 'Fries under melted cheese sauce, chicken bits and green chilli.', 24000, '{}', null, 7),
	((select id from categories where slug = 'kebabs'), 'Shami kebab (4 pcs)', 'Minced beef and chana dal patties, pan-seared.', 26000, '{}', null, 1),
	((select id from categories where slug = 'kebabs'), 'Chicken tikka', 'Charcoal-grilled boneless chicken with mint chutney.', 34000, '{popular}', '/img/tikka.jpg', 2),
	((select id from categories where slug = 'kebabs'), 'Paneer shashlik', 'Paneer, capsicum and onion from the grill.', 30000, '{veg}', null, 3),
	((select id from categories where slug = 'drinks'), 'Borhani', 'Spiced yoghurt drink with mint and black salt.', 9000, '{veg,popular}', '/img/borhani.jpg', 1),
	((select id from categories where slug = 'drinks'), 'Firni', 'Ground-rice pudding set in a clay bowl.', 12000, '{veg}', null, 2),
	((select id from categories where slug = 'drinks'), 'Mishti doi', 'Bogura-style caramelised sweet yoghurt.', 11000, '{veg}', null, 3);

-- +goose Down
truncate menu_items, categories, opening_hours, restaurant restart identity cascade;
