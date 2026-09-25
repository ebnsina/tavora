-- +goose Up
create table admins (
	id bigint generated always as identity primary key,
	email text not null unique check (email = lower(email)),
	name text not null,
	password_hash text not null,
	created_at timestamptz not null default now()
);

-- Only a SHA-256 of each session token is stored, so a database leak can't be replayed as logins.
create table sessions (
	token_hash bytea primary key,
	admin_id bigint not null references admins on delete cascade,
	expires_at timestamptz not null,
	created_at timestamptz not null default now()
);

-- All marketing copy as one document; its shape is enforced by the API (content.go).
create table site_content (
	id int primary key default 1 check (id = 1),
	data jsonb not null,
	updated_at timestamptz not null default now()
);

insert into site_content (data) values ($json${
	"seo": { "url": "https://tavora.example", "image": "/img/hero.jpg" },
	"hero": {
		"tagline": "Smash burgers, crispy chicken & more",
		"description": "Tavora is a fast-food kitchen in Rajshahi: smash burgers, crispy fried chicken, shawarma and loaded fries, plus kacchi, bhuna and kebabs. Dine in, pick up, or get it delivered and pay cash at the door."
	},
	"marquee": "Smash burgers · Crispy chicken · Loaded fries · Handi kacchi",
	"slogans": ["Slow-cooked, fast-served.", "Big plates. Bigger smiles."],
	"story": {
		"title": "Nothing on the menu is rushed",
		"paragraphs": [
			"Tavora started with one handi of kacchi and a family recipe that took three generations to get right.",
			"We still marinate overnight, cook on dum, and grind our spices every morning. Nothing on the menu is rushed."
		],
		"image": "/img/kacchi.jpg",
		"stickers": ["Kacchiii!", "Borhaniii", "Extra jhal!"]
	},
	"menu": { "title": "The menu", "subtitle": "Tap + on anything you fancy. Cash on delivery, always." },
	"booking": { "title": "Bring the whole gang", "subtitle": "Save a seat. Fill in the blanks and we'll hold your table." },
	"tawa": "Fresh off the tawa",
	"reviews": {
		"title": "What our regulars say",
		"items": [
			{ "text": "The kacchi tastes like my nani’s. Soft mutton, perfect aloo, every single time.", "by": "Sample review" },
			{ "text": "Ordered at 9 PM, paid cash at the door, burger still hot. That’s the whole review.", "by": "Sample review" },
			{ "text": "Kala bhuna is dangerous. Came for one plate, ordered two more for home.", "by": "Sample review" },
			{ "text": "Borhani after kacchi is the correct way to live. Tavora gets it.", "by": "Sample review" }
		]
	},
	"ticker": [
		{ "label": "Burger", "icon": "burger" },
		{ "label": "Kacchi", "icon": "rice" },
		{ "label": "Bhuna", "icon": "soup" },
		{ "label": "Fried chicken", "icon": "chicken" },
		{ "label": "Shawarma", "icon": "sandwich" },
		{ "label": "Fries", "icon": "fries" },
		{ "label": "Borhani", "icon": "drink" }
	],
	"call": {
		"kicker": "Too hungry to scroll?",
		"title": "Dinner is one call away",
		"slogan": ["Hot.", "Fresh.", "Yours."],
		"sign_top": "Cash on delivery",
		"sign_big": "Order now"
	},
	"social": { "facebook": "https://facebook.com/tavora", "instagram": "https://instagram.com/tavora" }
}$json$);

-- +goose Down
drop table site_content, sessions, admins;
