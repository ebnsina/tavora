// Prices in taka. Change the numbers here; the page reads from this file.
export const setup = 25000;
// Paying yearly: 12 months for the price of 10.
export const yearlyMonths = 10;

export const features = [
	'Website with your menu and photos',
	'Online orders, cash on delivery',
	'Table bookings',
	'Dashboard and new-order alerts',
	'Till, kitchen screen and printing',
	'Cash, card, bKash, Nagad, split bills',
	'Works offline, staff PINs',
	'End-of-day report, VAT invoices',
	'We make menu and website changes for you',
	'Priority WhatsApp help and monthly check-up'
];

export const plans = [
	{
		name: 'Starter',
		for: 'A website that takes orders',
		monthly: 1500,
		upTo: 4,
		cta: 'Start with Starter'
	},
	{
		name: 'Business',
		for: 'Website, dashboard and till',
		monthly: 3000,
		upTo: 8,
		cta: 'Start with Business',
		featured: true
	},
	{ name: 'Pro', for: 'Business, and we look after it', monthly: 6000, upTo: 10, cta: 'Talk to us' }
];

export const promises = ['No commission on orders', 'No hidden fees', 'Cancel any month'];
