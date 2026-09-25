// Transition durations for Svelte's built-in transitions; zero for people who prefer less motion.
const reduce =
	typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ms = (n: number) => (reduce ? 0 : n);
export const phone = () =>
	typeof matchMedia !== 'undefined' && matchMedia('(max-width: 759px)').matches;
