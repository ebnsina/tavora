/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

// Keeps the POS usable without internet: the app's own files are cached, and any POS page
// falls back to the cached POS shell (it renders entirely in the browser from the tablet's saved data).
const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `tavora-${version}`;
const ASSETS = [...build, ...files];
const SHELL = '/admin/pos';

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((c) => Promise.all([c.addAll(ASSETS), c.add(SHELL).catch(() => {})]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	const url = new URL(req.url);
	if (req.method !== 'GET' || url.origin !== location.origin) return;

	// Built files never change for a given version: serve them from the cache.
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((hit) => hit ?? fetch(req)));
		return;
	}

	// POS pages: try the network, fall back to the saved shell when offline.
	if (req.mode === 'navigate' && url.pathname.startsWith(SHELL)) {
		event.respondWith(
			fetch(req)
				.then((res) => {
					if (res.ok) caches.open(CACHE).then((c) => c.put(SHELL, res.clone()));
					return res;
				})
				.catch(async () => (await caches.match(SHELL)) ?? Response.error())
		);
	}
	// Everything else (public site, dashboard, API relay) goes straight to the network.
});
