import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Linking,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { randomUUID } from 'expo-crypto';
import { api, ApiError, message, openState, price, time, vatOn, vatPct, type Item, type Order, type Restaurant } from './api';
import { c } from './theme';

export type Lines = Record<number, number>;
type Mode = 'delivery' | 'pickup';

const fieldMessages: Record<string, string> = {
	name: 'Please enter your name.',
	phone: 'Enter a Bangladeshi mobile number, like 01712345678.',
	address: 'Please enter where we should deliver.'
};

export function Cart(props: {
	restaurant: Restaurant;
	items: Map<number, Item>;
	lines: Lines;
	add: (id: number, by?: number) => void;
	clear: () => void;
	visible: boolean;
	onClose: () => void;
}) {
	const { restaurant, items, lines, add, visible } = props;
	const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
	const [mode, setMode] = useState<Mode>('delivery');
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [note, setNote] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [fields, setFields] = useState<Record<string, string>>({});
	const [order, setOrder] = useState<Order>();
	// One id per checkout, so a retried or double-tapped order can never be placed twice.
	const [orderId, setOrderId] = useState(randomUUID);

	const rows = Object.entries(lines).map(([id, q]) => [items.get(+id)!, q] as const);
	const sub = rows.reduce((sum, [item, q]) => sum + item.price * q, 0);
	const fee = mode === 'delivery' && sub < restaurant.delivery.free_over ? restaurant.delivery.fee : 0;
	const vat = vatOn(sub, restaurant.vat.rate, restaurant.vat.inclusive);
	const total = sub + fee + vat.add;
	const state = openState(restaurant.hours);
	const closedNote = state.open
		? ''
		: state.when
			? `We're closed right now. Ordering opens ${state.when} at ${time(state.at)}.`
			: "We're closed today.";

	function close() {
		props.onClose();
		if (step === 'done') setStep('cart');
	}

	async function placeOrder() {
		setBusy(true);
		setError('');
		setFields({});
		try {
			const o = await api<Order>('/v1/orders', {
				method: 'POST',
				body: JSON.stringify({
					id: orderId,
					mode,
					name,
					phone,
					address: mode === 'delivery' ? address : '',
					note,
					items: rows.map(([item, qty]) => ({ id: item.id, qty }))
				})
			});
			setOrder(o);
			props.clear();
			setOrderId(randomUUID());
			setStep('done');
		} catch (e) {
			const d = e instanceof ApiError ? e.details : {};
			let msg = message(e);
			if (e instanceof ApiError && e.code === 'validation_failed')
				setFields(Object.fromEntries(Object.keys(d).map((k) => [k, fieldMessages[k] ?? msg])));
			if (e instanceof ApiError && e.code === 'restaurant_closed' && d.opens)
				msg += ` Today we're open ${time(String(d.opens))} – ${time(String(d.closes))}.`;
			if (e instanceof ApiError && e.code === 'item_unavailable' && d.name)
				msg = `Sorry, ${d.name} just sold out. Please remove it and try again.`;
			setError(msg);
		} finally {
			setBusy(false);
		}
	}

	function sendWhatsApp(o: Order) {
		const text = [
			`Order TV-${o.number} · ${o.mode === 'delivery' ? 'Delivery · Cash on delivery' : 'Pickup · Pay at the counter'}`,
			'',
			...o.items.map((l) => `${l.qty} × ${l.name} — ${price(l.amount)}`),
			'',
			`Total to pay: ${price(o.total)}`,
			`Name: ${o.name} · ${o.phone}`,
			...(o.address ? [`Address: ${o.address}`] : [])
		].join('\n');
		Linking.openURL(`https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(text)}`).catch(() =>
			setError("We couldn't open WhatsApp. Please call us instead.")
		);
	}

	const title = step === 'checkout' ? 'Checkout' : step === 'done' ? 'Order placed' : 'Your order';

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
			<KeyboardAvoidingView style={s.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<View style={s.head}>
					{step === 'checkout' ? (
						<Pressable onPress={() => setStep('cart')} hitSlop={12} accessibilityRole="button">
							<Text style={s.link}>Back</Text>
						</Pressable>
					) : (
						<View />
					)}
					<Text style={s.title}>{title}</Text>
					<Pressable onPress={close} hitSlop={12} accessibilityRole="button">
						<Text style={s.link}>Close</Text>
					</Pressable>
				</View>

				{step === 'done' && order ? (
					<ScrollView contentContainerStyle={s.body}>
						<View style={s.card}>
							<Text style={s.code}>TV-{order.number}</Text>
							{order.items.map((l) => (
								<Row key={l.id} left={`${l.qty} × ${l.name}`} right={price(l.amount)} />
							))}
							<View style={s.rule} />
							{order.mode === 'delivery' ? (
								<Row left="Delivery" right={order.delivery_fee ? price(order.delivery_fee) : 'Free'} />
							) : null}
							{order.vat ? (
								<Row
									left={`VAT ${vatPct(order.vat_rate)}${order.vat_inclusive ? ' (included)' : ''}`}
									right={price(order.vat)}
								/>
							) : null}
							<Row left="Total to pay" right={price(order.total)} bold />
							<Text style={s.muted}>
								{order.mode === 'delivery' ? 'Cash on delivery' : 'Pay at the counter'}
							</Text>
						</View>
						<Text style={s.text}>
							We've got your order. One last tap: send it to our WhatsApp so the kitchen starts cooking right
							away.{' '}
							{order.mode === 'delivery'
								? `Your food should arrive in ${restaurant.delivery.eta}.`
								: `Pick it up in about ${restaurant.pickup_eta}.`}
						</Text>
						{error ? <Text style={[s.text, { color: restaurant.theme }]}>{error}</Text> : null}
						<Button label="Send to our WhatsApp" color={restaurant.theme} onPress={() => sendWhatsApp(order)} />
						<Button label="Back to the menu" ghost onPress={close} />
					</ScrollView>
				) : !rows.length ? (
					<View style={[s.body, s.empty]}>
						<Text style={s.title}>Your order is empty</Text>
						<Text style={s.muted}>Add a few dishes from the menu and they'll show up here.</Text>
						<Button label="Browse the menu" color={restaurant.theme} onPress={close} />
					</View>
				) : step === 'cart' ? (
					<>
						<ScrollView contentContainerStyle={s.body}>
							{closedNote ? <Text style={[s.note, { color: restaurant.theme }]}>{closedNote}</Text> : null}
							{rows.map(([item, q]) => (
								<View key={item.id} style={s.line}>
									<View style={{ flex: 1, gap: 2 }}>
										<Text style={s.itemName}>{item.name}</Text>
										<Text style={s.muted}>{price(item.price)} each</Text>
									</View>
									<Stepper
										qty={q}
										label={item.name}
										onMinus={() => add(item.id, -1)}
										onPlus={() => add(item.id)}
									/>
									<Text style={s.amount}>{price(item.price * q)}</Text>
								</View>
							))}
							<Row left="Subtotal" right={price(sub)} bold />
						</ScrollView>
						<View style={s.foot}>
							{sub < restaurant.delivery.free_over ? (
								<Text style={[s.muted, s.center]}>
									Add {price(restaurant.delivery.free_over - sub)} more for free delivery
								</Text>
							) : null}
							<Button
								label={state.open ? `Go to checkout · ${price(sub)}` : 'Ordering is closed right now'}
								color={restaurant.theme}
								disabled={!state.open}
								onPress={() => setStep('checkout')}
							/>
						</View>
					</>
				) : (
					<>
						<ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
							{closedNote ? <Text style={[s.note, { color: restaurant.theme }]}>{closedNote}</Text> : null}
							<Text style={s.label}>How do you want it?</Text>
							<View style={s.modes}>
								{(['delivery', 'pickup'] as const).map((m) => (
									<Pressable
										key={m}
										onPress={() => setMode(m)}
										style={[s.mode, mode === m && { borderColor: restaurant.theme, backgroundColor: c.paper }]}
										accessibilityRole="radio"
										accessibilityState={{ selected: mode === m }}
									>
										<Text style={s.itemName}>{m === 'delivery' ? 'Delivery' : 'Pickup'}</Text>
										<Text style={s.muted}>
											{m === 'delivery' ? restaurant.delivery.eta : `Ready in ${restaurant.pickup_eta}`}
										</Text>
									</Pressable>
								))}
							</View>
							<Field label="Your name" error={fields.name}>
								<TextInput style={[s.input, fields.name && s.bad]} accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={80} autoComplete="name" textContentType="name" />
							</Field>
							<Field label="Mobile number" error={fields.phone}>
								<TextInput
									style={[s.input, fields.phone && s.bad]}
									accessibilityLabel="Mobile number"
									value={phone}
									onChangeText={setPhone}
									placeholder="01XXXXXXXXX"
									placeholderTextColor={c.muted}
									keyboardType="phone-pad"
									autoComplete="tel"
									textContentType="telephoneNumber"
								/>
							</Field>
							{mode === 'delivery' ? (
								<Field label="Delivery address" error={fields.address} hint={`We deliver to ${restaurant.delivery.areas}.`}>
									<TextInput
										style={[s.input, s.area, fields.address && s.bad]}
										accessibilityLabel="Delivery address"
										value={address}
										onChangeText={setAddress}
										multiline
										maxLength={300}
										placeholder="House, road, area and a landmark"
										placeholderTextColor={c.muted}
										autoComplete="street-address"
									/>
								</Field>
							) : null}
							<Field label="Note for the kitchen (optional)">
								<TextInput style={[s.input, s.area]} accessibilityLabel="Note for the kitchen" value={note} onChangeText={setNote} multiline maxLength={300} />
							</Field>
							<View style={s.card}>
								<Row left="Subtotal" right={price(sub)} />
								{mode === 'delivery' ? <Row left="Delivery" right={fee ? price(fee) : 'Free'} /> : null}
								{vat.vat ? (
									<Row
										left={`VAT ${vatPct(restaurant.vat.rate)}${restaurant.vat.inclusive ? ' (included)' : ''}`}
										right={price(vat.vat)}
									/>
								) : null}
								<View style={s.rule} />
								<Row left="Total to pay" right={price(total)} bold />
								<Text style={s.muted}>{mode === 'delivery' ? 'Cash on delivery' : 'Pay at the counter'}</Text>
							</View>
						</ScrollView>
						<View style={s.foot}>
							{error ? <Text style={[s.center, { color: restaurant.theme }]}>{error}</Text> : null}
							<Button
								label={busy ? 'Placing your order…' : `Place order · ${price(total)}`}
								color={restaurant.theme}
								disabled={busy || !state.open || !name.trim() || !phone.trim() || (mode === 'delivery' && !address.trim())}
								onPress={placeOrder}
							/>
						</View>
					</>
				)}
			</KeyboardAvoidingView>
		</Modal>
	);
}

export function Stepper(p: { qty: number; label: string; onMinus: () => void; onPlus: () => void }) {
	return (
		<View style={s.stepper}>
			<Pressable style={s.step} onPress={p.onMinus} accessibilityRole="button" accessibilityLabel={`Remove one ${p.label}`} hitSlop={6}>
				<Text style={s.stepText}>−</Text>
			</Pressable>
			<Text style={s.qty}>{p.qty}</Text>
			<Pressable style={s.step} onPress={p.onPlus} accessibilityRole="button" accessibilityLabel={`Add one more ${p.label}`} hitSlop={6}>
				<Text style={s.stepText}>+</Text>
			</Pressable>
		</View>
	);
}

export function Button(p: { label: string; onPress: () => void; color?: string; ghost?: boolean; disabled?: boolean }) {
	return (
		<Pressable
			onPress={p.onPress}
			disabled={p.disabled}
			accessibilityRole="button"
			accessibilityState={{ disabled: p.disabled }}
			style={({ pressed }) => [
				s.button,
				p.ghost ? s.ghost : { backgroundColor: p.color ?? c.ink },
				(pressed || p.disabled) && { opacity: p.disabled ? 0.4 : 0.8 }
			]}
		>
			<Text style={[s.buttonText, p.ghost && { color: c.ink }]}>{p.label}</Text>
		</Pressable>
	);
}

function Row(p: { left: string; right: string; bold?: boolean }) {
	return (
		<View style={s.row}>
			<Text style={[s.text, p.bold && s.bold, { flex: 1 }]}>{p.left}</Text>
			<Text style={[s.text, p.bold && s.bold]}>{p.right}</Text>
		</View>
	);
}

function Field(p: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
	return (
		<View style={{ gap: 6 }}>
			<Text style={s.label}>{p.label}</Text>
			{p.children}
			{p.error ? <Text style={s.error}>{p.error}</Text> : p.hint ? <Text style={s.muted}>{p.hint}</Text> : null}
		</View>
	);
}

const s = StyleSheet.create({
	sheet: { flex: 1, backgroundColor: c.bg },
	head: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.line
	},
	title: { fontSize: 18, fontWeight: '700', color: c.ink },
	link: { fontSize: 16, color: c.ink, textDecorationLine: 'underline' },
	body: { padding: 16, gap: 16 },
	empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	foot: { padding: 16, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
	center: { textAlign: 'center' },
	note: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper },
	line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	itemName: { fontSize: 16, fontWeight: '600', color: c.ink },
	amount: { width: 72, textAlign: 'right', fontSize: 16, fontWeight: '600', color: c.ink },
	muted: { color: c.muted },
	text: { fontSize: 16, color: c.ink },
	bold: { fontWeight: '700' },
	row: { flexDirection: 'row', gap: 12 },
	rule: { height: StyleSheet.hairlineWidth, backgroundColor: c.line },
	card: { gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper },
	code: { fontSize: 22, fontWeight: '700', color: c.ink, fontVariant: ['tabular-nums'] },
	label: { fontSize: 15, fontWeight: '600', color: c.ink },
	modes: { flexDirection: 'row', gap: 12 },
	mode: { flex: 1, gap: 2, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: c.line },
	input: {
		fontSize: 16,
		color: c.ink,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: c.line,
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10
	},
	area: { minHeight: 64, textAlignVertical: 'top' },
	error: { color: '#b3261e' },
	bad: { borderColor: '#b3261e' },
	stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: '#fff' },
	step: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
	stepText: { fontSize: 18, color: c.ink },
	qty: { minWidth: 20, textAlign: 'center', fontSize: 16, fontWeight: '600', color: c.ink },
	button: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999 },
	ghost: { borderWidth: 1, borderColor: c.line },
	buttonText: { fontSize: 16, fontWeight: '600', color: c.bg }
});
