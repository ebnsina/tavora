import { json } from '@sveltejs/kit';
import { adminApi } from '$lib/server/admin';

export const GET = async (event) => json(await adminApi(event, '/v1/admin/alerts'));
