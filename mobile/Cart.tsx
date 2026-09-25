import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
	Animated,
	Image,
	KeyboardAvoidingView,
	LayoutAnimation,
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
import {
	ArrowLeft02Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	MotorbikeIcon,
	ShoppingBag01Icon,
	Store01Icon,
	WhatsappIcon
} from '@hugeicons/core-free-icons';
import {
	api,
	ApiError,
	asset,
	message,
	openState,
	price,
	time,
	vatOn,
	vatPct,
	type Item,
	type Order,
	type Restaurant,
	type Session
} from './api';
import { Rolling } from './Rolling';
import { Button, Icon, IconButton, Stepper } from './ui';
import { ms, native } from './motion';
import { c, f } from './theme';

export type Lines = Record<number, number>;
export type Mode = 'delivery' | 'pickup';

const fieldMessages: Record<string, string> = {
	name: 'Please enter your name.',
	phone: 'Enter a Bangladeshi mobile number, like 01712345678.',
	address: 'Please enter where we should deliver.'
};

// Smooth rows in and out when quantities change.
export function animateList() {
	if (ms(1)) LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
}

export function Cart(props: {
	restaurant: Restaurant;
	items: Map<number, Item>;
	lines: Lines;
	add: (id: number, by?: number) => void;
	clear: () => void;
	session: Session | null;
	mode: Mode;
	setMode: (m: Mode) => void;
	onOrdered: () => void;
	visible: boolean;
	onClose: () => void;
}) {
	const { restaurant, items, lines, visible, session, mode, setMode } = props;
	const brand = restaurant.theme;
	const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
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

	// Signed-in customers get their details filled in; anything already typed is kept.
	useEffect(() => {
		if (!visible || !session) return;
		const cu = session.customer;
		setName((v) => v || cu.name);
		setPhone((v) => v || cu.phone);
		setAddress((v) => v || cu.address);
	}, [visible, session]);

	const add = (id: number, by?: number) => {
		animateList();
		props.add(id, by);
	};
	const rows = Object.entries(lines).map(([id, q]) => [items.get(+id)!, q] as const);
	const sub = rows.reduce((sum, [item, q]) => sum + item.price * q, 0);
	const fee =
		mode === 'delivery' && sub < restaurant.delivery.free_over ? restaurant.delivery.fee : 0;
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
				token: session?.token,
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
			setNote('');
			setOrderId(randomUUID());
			setStep('done');
			props.onOrdered();
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
		Linking.openURL(`https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(text)}`).catch(
			() => setError("We couldn't open WhatsApp. Please call us instead.")
		);
	}

	const title = step === 'checkout' ? 'Checkout' : step === 'done' ? 'Order placed' : 'Your order';

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={close}
		>
			<KeyboardAvoidingView
				style={s.sheet}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<View style={s.head}>
					{step === 'checkout' ? (
						<IconButton
							icon={ArrowLeft02Icon}
							label="Back to your order"
							onPress={() => setStep('cart')}
						/>
					) : (
						<View style={{ width: 36 }} />
					)}
					<Text style={s.title}>{title}</Text>
					<IconButton icon={Cancel01Icon} label="Close" onPress={close} />
				</View>

				{step === 'done' && order ? (
					<ScrollView contentContainerStyle={s.body}>
						<Pop>
							<Icon icon={CheckmarkCircle02Icon} size={56} color={c.green} />
						</Pop>
						<View style={s.card}>
							<Text style={s.code}>TV-{order.number}</Text>
							{order.items.map((l) => (
								<Row key={l.id} left={`${l.qty} × ${l.name}`} right={price(l.amount)} />
							))}
							<View style={s.rule} />
							{order.mode === 'delivery' ? (
								<Row
									left="Delivery"
									right={order.delivery_fee ? price(order.delivery_fee) : 'Free'}
								/>
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
							We've got your order. One last tap: send it to our WhatsApp so the kitchen starts
							cooking right away.{' '}
							{order.mode === 'delivery'
								? `Your food should arrive in ${restaurant.delivery.eta}.`
								: `Pick it up in about ${restaurant.pickup_eta}.`}
						</Text>
						{error ? <Text style={[s.text, { color: brand }]}>{error}</Text> : null}
						<Button
							label="Send to our WhatsApp"
							icon={WhatsappIcon}
							color={brand}
							onPress={() => sendWhatsApp(order)}
						/>
						<Button label="Back to the menu" ghost onPress={close} />
					</ScrollView>
				) : !rows.length ? (
					<View style={[s.body, s.empty]}>
						<Icon icon={ShoppingBag01Icon} size={48} color={c.muted} />
						<Text style={s.title}>Your order is empty</Text>
						<Text style={[s.muted, s.center]}>
							Add a few dishes from the menu and they'll show up here.
						</Text>
						<Button label="Browse the menu" color={brand} onPress={close} />
					</View>
				) : step === 'cart' ? (
					<>
						<ScrollView contentContainerStyle={s.body}>
							{closedNote ? <Text style={[s.note, { color: brand }]}>{closedNote}</Text> : null}
							{rows.map(([item, q]) => (
								<View key={item.id} style={s.line}>
									{asset(item.image) ? (
										<Image
											source={{ uri: asset(item.image)! }}
											style={s.thumb}
											accessibilityIgnoresInvertColors
										/>
									) : null}
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
									<View style={s.amount}>
										<Rolling text={price(item.price * q)} style={s.money} />
									</View>
								</View>
							))}
							<View style={s.row}>
								<Text style={[s.text, s.bold, { flex: 1 }]}>Subtotal</Text>
								<Rolling text={price(sub)} style={{ ...s.money, fontFamily: f.bold }} />
							</View>
						</ScrollView>
						<View style={s.foot}>
							{sub < restaurant.delivery.free_over ? (
								<Text style={[s.muted, s.center]}>
									Add {price(restaurant.delivery.free_over - sub)} more for free delivery
								</Text>
							) : (
								<Text style={[s.center, { color: c.green, fontFamily: f.semi }]}>
									Free delivery unlocked
								</Text>
							)}
							<Button
								label={
									state.open ? `Go to checkout, ${price(sub)}` : 'Ordering is closed right now'
								}
								color={brand}
								disabled={!state.open}
								onPress={() => setStep('checkout')}
							>
								{state.open ? <ButtonAmount label="Go to checkout" amount={sub} /> : null}
							</Button>
						</View>
					</>
				) : (
					<>
						<ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
							{closedNote ? <Text style={[s.note, { color: brand }]}>{closedNote}</Text> : null}
							<Text style={s.label}>How do you want it?</Text>
							<View style={s.modes}>
								{(['delivery', 'pickup'] as const).map((m) => (
									<Pressable
										key={m}
										onPress={() => setMode(m)}
										style={[s.mode, mode === m && { borderColor: brand, backgroundColor: c.paper }]}
										accessibilityRole="radio"
										accessibilityState={{ selected: mode === m }}
									>
										<Icon
											icon={m === 'delivery' ? MotorbikeIcon : Store01Icon}
											color={mode === m ? brand : c.ink}
										/>
										<Text style={s.itemName}>{m === 'delivery' ? 'Delivery' : 'Pickup'}</Text>
										<Text style={s.muted}>
											{m === 'delivery'
												? restaurant.delivery.eta
												: `Ready in ${restaurant.pickup_eta}`}
										</Text>
									</Pressable>
								))}
							</View>
							<Field label="Your name" error={fields.name}>
								<TextInput
									style={[s.input, fields.name && s.bad]}
									accessibilityLabel="Your name"
									value={name}
									onChangeText={setName}
									maxLength={80}
									autoComplete="name"
									textContentType="name"
								/>
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
								<Field
									label="Delivery address"
									error={fields.address}
									hint={`We deliver to ${restaurant.delivery.areas}.`}
								>
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
								<TextInput
									style={[s.input, s.area]}
									accessibilityLabel="Note for the kitchen"
									value={note}
									onChangeText={setNote}
									multiline
									maxLength={300}
								/>
							</Field>
							<View style={s.card}>
								<Row left="Subtotal" right={price(sub)} />
								{mode === 'delivery' ? (
									<View style={s.row}>
										<Text style={[s.text, { flex: 1 }]}>Delivery</Text>
										{fee ? (
											<Rolling text={price(fee)} style={s.moneyPlain} />
										) : (
											<Text style={s.text}>Free</Text>
										)}
									</View>
								) : null}
								{vat.vat ? (
									<Row
										left={`VAT ${vatPct(restaurant.vat.rate)}${restaurant.vat.inclusive ? ' (included)' : ''}`}
										right={price(vat.vat)}
									/>
								) : null}
								<View style={s.dashed} />
								<View style={s.row}>
									<Text style={[s.text, s.bold, { flex: 1 }]}>Total to pay</Text>
									<Rolling text={price(total)} style={{ ...s.money, fontFamily: f.bold }} />
								</View>
								<Text style={s.muted}>
									{mode === 'delivery' ? 'Cash on delivery' : 'Pay at the counter'}
								</Text>
							</View>
						</ScrollView>
						<View style={s.foot}>
							{error ? <Text style={[s.center, { color: brand }]}>{error}</Text> : null}
							<Button
								label={busy ? 'Placing your order…' : `Place order, ${price(total)}`}
								color={brand}
								disabled={
									busy ||
									!state.open ||
									!name.trim() ||
									!phone.trim() ||
									(mode === 'delivery' && !address.trim())
								}
								onPress={placeOrder}
							>
								{busy ? null : <ButtonAmount label="Place order" amount={total} />}
							</Button>
						</View>
					</>
				)}
			</KeyboardAvoidingView>
		</Modal>
	);
}

export function ButtonAmount({ label, amount }: { label: string; amount: number }) {
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center' }}>
			<Text style={s.buttonText}>{label} · </Text>
			<Rolling text={price(amount)} style={s.buttonMoney} />
		</View>
	);
}

// Springs its child in from nothing, once.
function Pop({ children }: { children: ReactNode }) {
	const v = useRef(new Animated.Value(ms(1) ? 0 : 1)).current;
	useEffect(() => {
		Animated.spring(v, { toValue: 1, speed: 12, bounciness: 14, useNativeDriver: native }).start();
	}, [v]);
	return (
		<Animated.View style={{ alignSelf: 'center', opacity: v, transform: [{ scale: v }] }}>
			{children}
		</Animated.View>
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

function Field(p: { label: string; error?: string; hint?: string; children: ReactNode }) {
	return (
		<View style={{ gap: 6 }}>
			<Text style={s.label}>{p.label}</Text>
			{p.children}
			{p.error ? (
				<Text style={s.error}>{p.error}</Text>
			) : p.hint ? (
				<Text style={s.muted}>{p.hint}</Text>
			) : null}
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
	body: { padding: 16, gap: 16 },
	empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	foot: { padding: 16, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
	center: { fontFamily: f.regular, textAlign: 'center' },
	note: {
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: c.line,
		backgroundColor: c.paper
	},
	line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	thumb: { width: 48, height: 48, borderRadius: 999 },
	itemName: { fontSize: 16, fontFamily: f.semi, color: c.ink },
	amount: { width: 76, alignItems: 'flex-end' },
	money: { fontSize: 16, lineHeight: 22, fontFamily: f.semi, color: c.ink },
	moneyPlain: { fontFamily: f.regular, fontSize: 16, lineHeight: 22, color: c.ink },
	buttonText: { fontSize: 16, fontFamily: f.semi, color: c.bg },
	buttonMoney: { fontSize: 16, lineHeight: 22, fontFamily: f.semi, color: c.bg },
	muted: { color: c.muted },
	text: { fontFamily: f.regular, fontSize: 16, color: c.ink },
	bold: { fontFamily: f.bold },
	row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
	rule: { height: StyleSheet.hairlineWidth, backgroundColor: c.line },
	dashed: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: c.line, marginVertical: 4 },
	card: {
		gap: 8,
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: c.line,
		backgroundColor: c.paper
	},
	code: { fontSize: 22, fontFamily: f.mono, color: c.ink },
	label: { fontSize: 15, fontFamily: f.semi, color: c.ink },
	modes: { flexDirection: 'row', gap: 12 },
	mode: { flex: 1, gap: 4, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: c.line },
	input: {
		fontFamily: f.regular,
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
	bad: { borderColor: '#b3261e' }
});
