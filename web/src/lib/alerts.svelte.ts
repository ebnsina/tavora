import { invalidateAll } from '$app/navigation';

// What's waiting for a reply. Every dashboard and POS screen polls this and chimes when it grows.
export const alerts = $state({ new_orders: 0, waiting_bookings: 0 });

let last: number | null = null;
let audio: AudioContext | null = null;

// Browsers only allow sound after someone has touched the page, so the chime unlocks on the first tap.
function unlock() {
	audio ??= new AudioContext();
	audio.resume();
}

function chime() {
	if (!audio || audio.state !== 'running') return;
	const now = audio.currentTime;
	[880, 1320].forEach((hz, i) => {
		const osc = audio!.createOscillator();
		const gain = audio!.createGain();
		osc.frequency.value = hz;
		gain.gain.setValueAtTime(0.25, now + i * 0.18);
		gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.4);
		osc.connect(gain).connect(audio!.destination);
		osc.start(now + i * 0.18);
		osc.stop(now + i * 0.18 + 0.4);
	});
}

async function check() {
	try {
		const res = await fetch('/admin/alerts');
		if (!res.ok) return;
		const a: typeof alerts = await res.json();
		const total = a.new_orders + a.waiting_bookings;
		if (last !== null && total > last) {
			chime();
			invalidateAll();
		}
		last = total;
		Object.assign(alerts, a);
	} catch {
		// Offline: keep the last counts; the next check catches up.
	}
}

// Call from a layout's onMount; returns the cleanup.
export function watchAlerts() {
	addEventListener('pointerdown', unlock, { once: true });
	check();
	const t = setInterval(check, 15_000);
	return () => {
		clearInterval(t);
		removeEventListener('pointerdown', unlock);
	};
}
