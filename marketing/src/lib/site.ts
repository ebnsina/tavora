import {
	PUBLIC_DEMO_URL,
	PUBLIC_EMAIL,
	PUBLIC_SITE_URL,
	PUBLIC_WHATSAPP
} from '$env/static/public';

// Build fails if any of these is missing from .env (static public env is checked at build time).
export const site = {
	name: 'Tavora',
	url: PUBLIC_SITE_URL,
	demo: PUBLIC_DEMO_URL,
	email: PUBLIC_EMAIL,
	whatsapp: `https://wa.me/${PUBLIC_WHATSAPP}?text=${encodeURIComponent('Hi, I’d like to know more about Tavora for my restaurant.')}`
};

export const taka = (n: number) =>
	new Intl.NumberFormat('en-BD', {
		style: 'currency',
		currency: 'BDT',
		currencyDisplay: 'narrowSymbol',
		maximumFractionDigits: 0
	}).format(n);
