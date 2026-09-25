// Prices in taka. Change the numbers here; every page reads from this file.
export const setup = {
	price: 25000,
	includes: [
		'Your website designed in your colours, with your logo and photos',
		'Your full menu entered for you, up to 80 dishes',
		'The dashboard and the till set up on your tablets',
		'Two hours of training for you and your staff',
		'Your web address (.com or .com.bd) connected, with a secure padlock'
	]
};

export const plans = [
	{
		id: 'website',
		name: 'Website',
		monthly: 1500,
		for: 'Take orders and bookings online',
		includes: [
			'Your restaurant website with the full menu',
			'Online orders with cash on delivery or pickup',
			'Table bookings',
			'Dashboard: orders, bookings, menu, opening hours, website text',
			'New-order alert with a sound',
			'Hosting, daily backups and updates'
		]
	},
	{
		id: 'complete',
		name: 'Website + Till',
		monthly: 3000,
		for: 'Run the whole restaurant from one place',
		featured: true,
		includes: [
			'Everything in Website',
			'Point of sale for tables and takeaway',
			'Kitchen screen and kitchen tickets',
			'Cash, card, bKash, Nagad, split bills and tips',
			'Keeps working when the internet drops',
			'Staff PINs, end-of-day report, VAT invoices (Mushak-6.3)'
		]
	}
];

// Optional: only if you want us to make changes for you. Most things can be done from the dashboard.
export const care = {
	monthly: 4000,
	hourly: 1000,
	includes: [
		'Menu, price and photo changes done for you within one working day',
		'New sections or pages on your website',
		'Priority help on WhatsApp during opening hours',
		'A monthly check that your printer, tablets and backups are fine'
	]
};

export const promises = [
	'No commission on your orders, ever',
	'No hidden fees: what you see here is what you pay',
	'Cancel any month; no lock-in contract',
	'Prices include hosting; VAT extra if applicable'
];
