// Moves an element to the end of <body>, so print styles can hide everything else with display: none.
export function portal(node: HTMLElement) {
	document.body.appendChild(node);
	return { destroy: () => node.remove() };
}
