// Prices in taka. Change the numbers here; the page reads from this file.
export const setup = 25000;
export const care = 4000;

export const plans = [
	{
		name: 'Website',
		monthly: 1500,
		for: 'Take orders and bookings online',
		includes: [
			'Website with your full menu',
			'Online orders, cash on delivery',
			'Table bookings',
			'Dashboard and new-order alerts'
		]
	},
	{
		name: 'Website + Till',
		monthly: 3000,
		for: 'Run the whole restaurant',
		featured: true,
		includes: [
			'Everything in Website',
			'Till, kitchen screen and printing',
			'Cash, card, bKash, Nagad, split bills',
			'Works offline, staff PINs, VAT invoices'
		]
	}
];

export const promises = ['No commission on orders', 'No hidden fees', 'Cancel any month'];
