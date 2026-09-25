// The help centre. Plain words, short steps; each guide matches one screen in the dashboard or till.
export type Section = { heading: string; text?: string; steps?: string[]; tips?: string[] };
export type Guide = {
	slug: string;
	title: string;
	summary: string;
	group: string;
	shot?: string;
	sections: Section[];
};

export const groups = ['Start here', 'Every day', 'The till', 'Your restaurant', 'Help'];

export const guides: Guide[] = [
	{
		slug: 'getting-started',
		title: 'Getting started',
		summary: 'Sign in, find your way around, and what each menu item is for.',
		group: 'Start here',
		shot: 'overview',
		sections: [
			{
				heading: 'Signing in',
				text: 'Open your website address and add /admin at the end, for example yourrestaurant.com/admin.',
				steps: [
					'Owner: tap the Owner tab, type your email and password, and tap Sign in.',
					'Staff: stay on the Staff tab and tap your 6-digit PIN on the number pad. You go straight to the till.',
					'Five wrong passwords, or too many wrong PINs, pause sign-in for 15 minutes. That keeps guessers out.'
				]
			},
			{
				heading: 'What each menu item does',
				steps: [
					'Point of sale (yellow button): the till. Tables, tickets, kitchen and payments.',
					'Overview: how the restaurant is doing. Money in, number of orders, best sellers.',
					'Online orders: orders from your website. Accept them and move them along.',
					'Table bookings: people who want a table. Confirm or decline.',
					'End of day: what should be in the cash drawer tonight, and who took what.',
					'Menu: your dishes, prices, photos, and the Sold out switch.',
					'Tables: the tables the till shows on its floor screen.',
					'Staff: the people who use the till, each with their own PIN.',
					'Hours & details: opening hours, phone, delivery fee, VAT and your brand colour.',
					'Website text: every word on your website.'
				]
			},
			{
				heading: 'The yellow and red numbers in the menu',
				text: 'A small yellow number next to Online orders or Table bookings means something is waiting for you. The dashboard checks every 15 seconds and plays a short sound when something new comes in.',
				tips: [
					'Browsers only play sound after you have tapped the page once. Tap anywhere after opening the dashboard.'
				]
			},
			{
				heading: 'Owner and staff: who sees what',
				text: 'Staff only see the till, online orders and table bookings. Money totals, the menu and settings are for the owner only.'
			}
		]
	},
	{
		slug: 'overview',
		title: 'Overview',
		summary: 'Money in, orders and best sellers for any stretch of days.',
		group: 'Every day',
		shot: 'overview',
		sections: [
			{
				heading: 'Reading the page',
				steps: [
					'The four cards show revenue, number of orders, average order and cancelled orders.',
					'The small arrow under each number compares with the same number of days just before.',
					'Revenue by day shows one bar per day. Tap Table to see the same numbers as a list.',
					'Right now shows orders waiting for you and the next table bookings.'
				]
			},
			{
				heading: 'Choosing the days',
				steps: [
					'Tap Today, 7 days, 30 days or 90 days.',
					'Or pick a start and end date and tap Show.'
				]
			}
		]
	},
	{
		slug: 'online-orders',
		title: 'Online orders',
		summary: 'Accept website orders and move them from kitchen to customer.',
		group: 'Every day',
		shot: 'orders',
		sections: [
			{
				heading: 'When an order comes in',
				text: 'New orders have a red border. The customer also gets a button to send the order to your WhatsApp.',
				steps: [
					'Check the dishes, name, phone and address.',
					'Tap Accept. The order appears on the kitchen screen straight away.',
					'Tap Start cooking, then Mark ready.',
					'For delivery, tap Send with rider, then Delivered & paid when the rider comes back with the cash.',
					'For pickup, tap Handed over when the customer collects.'
				],
				tips: [
					'Can’t make it? Tap Cancel and call the customer. Their number is a tap away.',
					'The tabs at the top filter by stage. Active shows everything still in progress.'
				]
			},
			{
				heading: 'Order details',
				text: 'Tap Details (or the order number) to see everything about one order: each dish, VAT, who took payment, and notes. Tap Print receipt to print it.',
				tips: ['Orders from the till show here too, so you can look up any bill later.']
			}
		]
	},
	{
		slug: 'table-bookings',
		title: 'Table bookings',
		summary: 'Confirm or decline table requests from your website.',
		group: 'Every day',
		shot: 'bookings',
		sections: [
			{
				heading: 'Replying to a booking',
				steps: [
					'Bookings are grouped by day. Waiting ones are highlighted.',
					'Tap Confirm or Decline. Call or WhatsApp the guest to let them know.',
					'Plans changed? Tap Cancel on a confirmed booking.'
				]
			},
			{
				heading: 'Knowing your regulars',
				text: 'Tap Details on a booking to see the guest’s other bookings and how often they order, found by their phone number.'
			}
		]
	},
	{
		slug: 'end-of-day',
		title: 'End of day',
		summary: 'Count the drawer, see who took what, and print the day’s report.',
		group: 'Every day',
		shot: 'end-of-day',
		sections: [
			{
				heading: 'Closing up',
				steps: [
					'Take payment or void any ticket that is still open. A red warning tells you if any are left.',
					'Open End of day. The first card shows the cash that should be in the drawer.',
					'Count the cash and compare.',
					'Tap Print. You get a clean A4 sheet with space to write what you counted and to sign.'
				]
			},
			{
				heading: 'What the numbers mean',
				steps: [
					'Cash that should be in the drawer: cash taken at the till, plus cash tips, plus cash for online orders.',
					'Card, bKash and Nagad: money that went to your bank or wallets, not the drawer.',
					'By staff: how much each person took, from their PIN.',
					'Voided tickets: cancelled bills and who cancelled them.',
					'VAT collected: the VAT on bills closed that day.'
				],
				tips: ['Pick another date at the top to look back at any day.']
			}
		]
	},
	{
		slug: 'pos',
		title: 'Taking an order at the till',
		summary: 'Open a table or takeaway, add dishes, add notes, send to the kitchen.',
		group: 'The till',
		shot: 'pos-floor',
		sections: [
			{
				heading: 'Start a ticket',
				steps: [
					'Tap Point of sale. You see every table. Free tables are plain; busy ones show the bill so far.',
					'Tap a free table, or New takeaway for someone at the counter.',
					'Tap dishes to add them. Tap again to add one more. Use + and − on the right to change amounts.',
					'Type the customer’s name if you like; it’s optional.'
				]
			},
			{
				heading: 'Notes for the cook',
				steps: [
					'Tap + Note under a dish.',
					'Tap a quick note like No onion or Extra spicy, or type your own.',
					'Tap Save note. It prints on the kitchen ticket and shows on the kitchen screen.'
				],
				tips: [
					'A note can only change while some of that dish hasn’t gone to the kitchen yet. After that, tell the cook.'
				]
			},
			{
				heading: 'Send to the kitchen',
				text: 'Tap Send to kitchen. Only dishes the kitchen doesn’t have yet are sent, and a kitchen ticket prints. Dishes already in the kitchen can’t be quietly taken off the bill.'
			}
		]
	},
	{
		slug: 'payments',
		title: 'Taking payment',
		summary: 'Cash with change, card, bKash, Nagad, split bills, tips, discounts and voids.',
		group: 'The till',
		shot: 'pos-pay',
		sections: [
			{
				heading: 'Take payment',
				steps: [
					'Tap Pay on the ticket.',
					'Pick Cash, Card, bKash or Nagad.',
					'Cash: tap the note the customer gave you. The change to give back shows in green.',
					'bKash or Nagad: type the transaction ID from the customer’s phone. It’s required, so you can check it later.',
					'Tap Take … and close. The receipt prints.'
				]
			},
			{
				heading: 'Split the bill',
				steps: [
					'Tap ÷2, ÷3 or ÷4, or type an amount.',
					'Take the first payment. The rest stays open.',
					'Repeat until nothing is left; each person can pay a different way.'
				]
			},
			{
				heading: 'Tips, discounts and voids',
				steps: [
					'Tip: type it in the Tip box when paying. It’s kept apart from the bill.',
					'Discount: tap Discount on the ticket and type the amount off.',
					'Void: tap Void to cancel a ticket nobody has paid anything on. The owner sees who voided it.'
				]
			}
		]
	},
	{
		slug: 'kitchen',
		title: 'Kitchen screen',
		summary: 'Every ticket the kitchen needs to cook, with timers.',
		group: 'The till',
		shot: 'pos-kitchen',
		sections: [
			{
				heading: 'Using it',
				steps: [
					'Put a tablet in the kitchen and open Point of sale, then Kitchen.',
					'Each card is one ticket: table or takeaway, dishes, and notes in red.',
					'The timer turns yellow at 10 minutes and red at 20.',
					'Tap Done when it’s ready. It moves to Finished in the last 30 minutes; tap Bring back if you tapped Done by mistake.'
				]
			}
		]
	},
	{
		slug: 'staff-and-switching',
		title: 'Staff and switching users',
		summary: 'Give each person a PIN, hand the till over, and see who did what.',
		group: 'The till',
		shot: 'staff',
		sections: [
			{
				heading: 'Adding staff (owner)',
				steps: [
					'Open Staff and tap Add staff.',
					'Type their name and a 6-digit PIN they will remember. Two people can’t share a PIN.',
					'Tell them the PIN in person. It can’t be looked up later, only changed.'
				]
			},
			{
				heading: 'Handing over the till',
				steps: ['Tap Switch staff at the top of the till.', 'The next person taps their PIN.'],
				tips: [
					'Switch staff waits until everything on the tablet is saved, so sales are never credited to the wrong person.'
				]
			},
			{
				heading: 'Someone leaves',
				text: 'Open Staff, tap Edit on their name, then Remove. They’re signed out straight away. Their past sales stay in your reports.'
			}
		]
	},
	{
		slug: 'offline',
		title: 'When the internet drops',
		summary: 'The till keeps working. Here’s what happens.',
		group: 'The till',
		sections: [
			{
				heading: 'What still works',
				text: 'Everything at the till: opening tables, adding dishes, sending to the kitchen, taking payment and printing. The top bar says No internet and counts the changes waiting to be sent.'
			},
			{
				heading: 'When it comes back',
				steps: [
					'Changes send by themselves in the order they happened. The top bar says All saved when done.',
					'If something couldn’t be saved, for example two tablets opened the same table, the top bar turns red. Tap it to see what happened and what to do.'
				],
				tips: [
					'Online orders and the dashboard need internet. Only the till works offline.',
					'Signing in and switching staff need internet too, so switch before the connection drops if you can.'
				]
			}
		]
	},
	{
		slug: 'menu',
		title: 'Menu',
		summary: 'Add dishes, change prices and photos, mark things sold out.',
		group: 'Your restaurant',
		shot: 'menu',
		sections: [
			{
				heading: 'Sold out for today',
				text: 'Tap Sold out next to a dish. It disappears from online ordering and greys out on the till. Tap Back on menu when it’s available again.'
			},
			{
				heading: 'Add or change a dish',
				steps: [
					'Tap Add a dish to a category, or Edit on a dish.',
					'Fill in the name, price and a short description.',
					'Tap Add photo to upload a picture (JPG, PNG or WebP, up to 5 MB).',
					'Tick labels like Most loved or Spicy if they fit.',
					'Tap Save dish.'
				],
				tips: [
					'Price changes don’t touch bills already open; they keep the price they were rung up at.'
				]
			},
			{
				heading: 'Categories',
				text: 'Tap Add category at the top, or Rename on a category. An empty category can be deleted.'
			}
		]
	},
	{
		slug: 'tables',
		title: 'Tables',
		summary: 'The tables your till shows on the floor screen.',
		group: 'Your restaurant',
		shot: 'tables',
		sections: [
			{
				heading: 'Setting up tables',
				steps: [
					'Tap Add table.',
					'Give it a short name people say out loud, like T1 or Rooftop 2.',
					'Set the number of seats and, if you like, the area (Window, Family, Rooftop).'
				],
				tips: [
					'A table that has ever had an order can be renamed but not removed, so old bills still make sense.'
				]
			}
		]
	},
	{
		slug: 'hours-and-details',
		title: 'Hours, details, VAT and colour',
		summary: 'Opening hours, contact details, delivery, VAT and your brand colour.',
		group: 'Your restaurant',
		shot: 'hours',
		sections: [
			{
				heading: 'Opening hours',
				text: 'Switch each day on or off and set the times. Online orders and bookings are only taken while you’re open, and the website shows Open or Closed on the shop door.'
			},
			{
				heading: 'Details and delivery',
				text: 'Name, address, phone, WhatsApp and email appear on your website and receipts. Set the delivery fee, the amount above which delivery is free, and the areas you deliver to.'
			},
			{
				heading: 'VAT',
				steps: [
					'Leave the rate at 0 if you’re not VAT-registered.',
					'Otherwise type your rate. Ask your accountant which one applies to you.',
					'Choose whether your menu prices already include VAT or VAT is added on top.',
					'Type your BIN. Bills then print as a Mushak-6.3 VAT invoice.'
				],
				tips: ['Changes apply to new bills only. Old bills keep the VAT they were made with.']
			},
			{
				heading: 'Brand colour',
				text: 'Pick one of eight colours, or your own, and tap Save colour. Your website, dashboard and till change straight away. Colours too light to read text on are not allowed.'
			}
		]
	},
	{
		slug: 'website-text',
		title: 'Website text',
		summary: 'Change any words, reviews or photos on your website.',
		group: 'Your restaurant',
		shot: 'website-text',
		sections: [
			{
				heading: 'Editing',
				steps: [
					'Pick a part of the website on the left, like Top of the page or Reviews.',
					'Change the words in the boxes.',
					'Tap Save changes. The website updates immediately.'
				],
				tips: [
					'A red dot on a tab means something there needs fixing before it can save.',
					'Links and sharing sets the picture and words people see when your link is shared on Facebook or WhatsApp.'
				]
			}
		]
	},
	{
		slug: 'printing',
		title: 'Printing',
		summary: 'Receipts, kitchen tickets and the end-of-day report.',
		group: 'Help',
		sections: [
			{
				heading: 'Setting up a receipt printer',
				steps: [
					'Use an 80 mm receipt printer that works with Android (Bluetooth, USB or network).',
					'Install the printer maker’s print service app from the Play Store and pair the printer.',
					'Print one receipt from the till and choose the printer. Android remembers it.'
				]
			},
			{
				heading: 'What prints',
				steps: [
					'Kitchen ticket: when you tap Send to kitchen.',
					'Receipt: when a bill is fully paid, or any time with the Bill button.',
					'Receipt for any past order: Online orders → Details → Print receipt.',
					'End of day: Print on the End of day page gives a clean A4 sheet.'
				],
				tips: [
					'Only the receipt or report prints: no menus, buttons or colours, just black on white.'
				]
			}
		]
	},
	{
		slug: 'faq',
		title: 'Questions and fixes',
		summary: 'Quick answers when something doesn’t look right.',
		group: 'Help',
		sections: [
			{
				heading: 'No sound for new orders',
				text: 'Tap anywhere on the dashboard once after opening it; browsers need that before they play sound. Check the tablet isn’t on silent.'
			},
			{
				heading: '“Another tablet opened this table first”',
				text: 'Two tablets used the same table while one was offline. Open the floor, find the table’s real ticket, and add the dishes there.'
			},
			{
				heading: 'A staff member forgot their PIN',
				text: 'Owner: open Staff, tap Edit on their name, type a new PIN and save.'
			},
			{
				heading: 'The website says Closed but we’re open',
				text: 'Check today’s hours under Hours & details. Times are Bangladesh time.'
			},
			{
				heading: 'I changed a price but an open bill still has the old one',
				text: 'That’s on purpose: a dish keeps the price it was rung up at. New tickets use the new price.'
			}
		]
	}
];
