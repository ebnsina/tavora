import { env } from '$env/dynamic/public';

// Fail at boot, not on the first visitor, when the API address is missing.
export const init = () => {
	if (!env.PUBLIC_API_URL) throw new Error('missing required env var PUBLIC_API_URL');
};
