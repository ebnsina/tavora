import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Fully static: every page is prerendered and served as plain files.
export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: { runes: true },
			// Served for unknown paths; renders the illustrated not-found page.
			adapter: adapter({ fallback: '404.html' })
		})
	]
});
