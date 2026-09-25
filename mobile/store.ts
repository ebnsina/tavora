import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore on phones; the web preview has no keychain, so it uses localStorage.
const web = Platform.OS === 'web';

export async function get(key: string) {
	try {
		return web ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
	} catch {
		return null;
	}
}

export async function set(key: string, value: string | null) {
	try {
		if (web) value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value);
		else
			value === null
				? await SecureStore.deleteItemAsync(key)
				: await SecureStore.setItemAsync(key, value);
	} catch {}
}
