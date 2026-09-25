import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
	Call02Icon,
	Cancel01Icon,
	Location01Icon,
	Logout01Icon,
	ShoppingBag01Icon
} from '@hugeicons/core-free-icons';
import { api, ApiError, message, price, type Customer, type Order, type Session } from './api';
import { Button, Icon, IconButton } from './ui';
import { c, f } from './theme';

const when = new Intl.DateTimeFormat('en-GB', {
	dateStyle: 'medium',
	timeStyle: 'short',
	timeZone: 'Asia/Dhaka'
});
const statusWords: Record<string, string> = {
	new: 'Received',
	accepted: 'Being cooked',
	preparing: 'Being cooked',
	ready: 'Ready',
	out_for_delivery: 'On the way',
	completed: 'Done',
	cancelled: 'Cancelled'
};

export function Account(p: {
	visible: boolean;
	session: Session;
	brand: string;
	onClose: () => void;
	onSignOut: () => void;
	onExpired: () => void;
}) {
	const [data, setData] = useState<{ customer: Customer; orders: Order[] }>();
	const [error, setError] = useState('');

	const load = useCallback(async () => {
		setError('');
		try {
			setData(await api('/v1/me', { token: p.session.token }));
		} catch (e) {
			if (e instanceof ApiError && e.code === 'unauthorized') return p.onExpired();
			setError(message(e));
		}
	}, [p.session.token, p.onExpired]);

	useEffect(() => {
		if (p.visible) load();
	}, [p.visible, load]);

	async function signOut() {
		// Forget the token on this phone even if the server can't be reached.
		api('/v1/auth/logout', { method: 'POST', token: p.session.token }).catch(() => {});
		p.onSignOut();
	}

	const cu = data?.customer ?? p.session.customer;
	return (
		<Modal
			visible={p.visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={p.onClose}
		>
			<View style={s.sheet}>
				<View style={s.head}>
					<View style={{ width: 36 }} />
					<Text style={s.title}>Your account</Text>
					<IconButton icon={Cancel01Icon} label="Close" onPress={p.onClose} />
				</View>
				<ScrollView contentContainerStyle={s.body}>
					<View style={s.card}>
						<Text style={s.name}>{cu.name || 'Welcome'}</Text>
						<Line icon={Call02Icon} text={cu.phone} />
						<Line
							icon={Location01Icon}
							text={cu.address || 'Your delivery address is saved after your first order.'}
						/>
					</View>

					<Text style={s.section}>Past orders</Text>
					{!data && !error ? <ActivityIndicator /> : null}
					{error ? (
						<View style={{ gap: 12 }}>
							<Text style={s.muted}>{error}</Text>
							<Button label="Try again" ghost onPress={load} />
						</View>
					) : null}
					{data && !data.orders.length ? (
						<View style={s.empty}>
							<Icon icon={ShoppingBag01Icon} size={36} color={c.muted} />
							<Text style={s.muted}>Your orders will show up here.</Text>
						</View>
					) : null}
					{data?.orders.map((o) => (
						<View key={o.id} style={s.card}>
							<View style={s.row}>
								<Text style={s.code}>TV-{o.number}</Text>
								<Text style={[s.pill, { color: o.status === 'cancelled' ? c.muted : p.brand }]}>
									{statusWords[o.status] ?? o.status}
								</Text>
							</View>
							<Text style={s.muted}>{when.format(new Date(o.created_at))}</Text>
							<Text style={s.text} numberOfLines={2}>
								{o.items.map((l) => `${l.qty} × ${l.name}`).join(', ')}
							</Text>
							<Text style={[s.text, s.bold]}>{price(o.total)}</Text>
						</View>
					))}

					<Button label="Sign out" ghost icon={Logout01Icon} onPress={signOut} />
				</ScrollView>
			</View>
		</Modal>
	);
}

function Line({ icon, text }: { icon: Parameters<typeof Icon>[0]['icon']; text: string }) {
	return (
		<View style={s.line}>
			<Icon icon={icon} size={18} color={c.muted} />
			<Text style={[s.text, { flex: 1 }]}>{text}</Text>
		</View>
	);
}

const s = StyleSheet.create({
	sheet: { flex: 1, backgroundColor: c.bg },
	head: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.line
	},
	title: { fontSize: 18, fontFamily: f.bold, color: c.ink },
	body: { padding: 16, gap: 12 },
	card: {
		gap: 8,
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: c.line,
		backgroundColor: c.paper
	},
	name: { fontSize: 22, fontFamily: f.bold, color: c.ink },
	line: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
	section: { marginTop: 8, fontSize: 18, fontFamily: f.bold, color: c.ink },
	empty: { alignItems: 'center', gap: 8, padding: 24 },
	row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	code: { fontSize: 17, fontFamily: f.mono, color: c.ink },
	pill: { fontFamily: f.semi },
	text: { fontFamily: f.regular, fontSize: 15, color: c.ink },
	bold: { fontFamily: f.bold },
	muted: { color: c.muted }
});
