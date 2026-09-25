import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Animated,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	SectionList,
	StyleSheet,
	Text,
	View,
	type ViewToken
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { MonaSans_400Regular } from '@expo-google-fonts/mona-sans/400Regular';
import { MonaSans_500Medium } from '@expo-google-fonts/mona-sans/500Medium';
import { MonaSans_600SemiBold } from '@expo-google-fonts/mona-sans/600SemiBold';
import { MonaSans_700Bold } from '@expo-google-fonts/mona-sans/700Bold';
import { MonaSans_800ExtraBold } from '@expo-google-fonts/mona-sans/800ExtraBold';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import {
	MotorbikeIcon,
	ChefHatIcon,
	Store01Icon,
	UserCircleIcon
} from '@hugeicons/core-free-icons';
import {
	api,
	ApiError,
	asset,
	message,
	openState,
	price,
	time,
	type Category,
	type Item,
	type Restaurant,
	type Session
} from './api';
import { animateList, ButtonAmount, Cart, type Lines, type Mode } from './Cart';
import { SignIn } from './SignIn';
import { Account } from './Account';
import { Onboarding } from './Onboarding';
import { Rolling } from './Rolling';
import { Button, Icon, Stepper } from './ui';
import { ms, native } from './motion';
import * as store from './store';
import { c, f } from './theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Data = { restaurant: Restaurant; menu: Category[] };

export default function App() {
	const [fontsLoaded, fontError] = useFonts({
		MonaSans_400Regular,
		MonaSans_500Medium,
		MonaSans_600SemiBold,
		MonaSans_700Bold,
		MonaSans_800ExtraBold,
		GeistMono_500Medium
	});
	const [data, setData] = useState<Data>();
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(true);
	const [lines, setLines] = useState<Lines>({});
	const [mode, setMode] = useState<Mode>('delivery');
	const [session, setSession] = useState<Session | null>(null);
	const [onboarded, setOnboarded] = useState<boolean>();
	const [sheet, setSheet] = useState<'cart' | 'signin' | 'account' | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [restaurant, menu] = await Promise.all([
				api<Restaurant>('/v1/restaurant'),
				api<Category[]>('/v1/menu')
			]);
			setData({ restaurant, menu });
			setError(undefined);
		} catch (e) {
			setError(message(e));
		} finally {
			setLoading(false);
		}
	}, []);

	// Load the menu, the saved sign-in and the welcome flag while the splash is up.
	useEffect(() => {
		(async () => {
			const [token, seen] = await Promise.all([store.get('token'), store.get('onboarded')]);
			setOnboarded(seen === '1');
			if (token) {
				try {
					const me = await api<Pick<Session, 'customer'>>('/v1/me', { token });
					setSession({ token, customer: me.customer });
				} catch (e) {
					if (e instanceof ApiError && e.code === 'unauthorized') store.set('token', null);
					// Offline: keep the token and try again next launch.
				}
			}
			await load();
		})();
	}, [load]);

	// A font that fails to load falls back to the system font rather than blocking the app.
	const ready = (fontsLoaded || !!fontError) && onboarded !== undefined && !(loading && !data);
	useEffect(() => {
		if (ready) SplashScreen.hideAsync().catch(() => {});
	}, [ready]);

	const signIn = (s: Session) => {
		setSession(s);
		store.set('token', s.token);
	};
	const signOut = useCallback(() => {
		setSession(null);
		setSheet(null);
		store.set('token', null);
	}, []);
	const refreshMe = () => {
		if (session)
			api<Pick<Session, 'customer'>>('/v1/me', { token: session.token })
				.then((me) => setSession({ ...session, customer: me.customer }))
				.catch(() => {});
	};

	const items = useMemo(
		() => new Map(data?.menu.flatMap((cat) => cat.items.map((i) => [i.id, i]))),
		[data]
	);
	// Drop dishes that left the menu or sold out since they were added.
	useEffect(() => {
		setLines((l) =>
			Object.fromEntries(Object.entries(l).filter(([id]) => items.get(+id)?.available))
		);
	}, [items]);

	const add = (id: number, by = 1) =>
		setLines(({ [id]: qty = 0, ...rest }) => (qty + by > 0 ? { ...rest, [id]: qty + by } : rest));
	const count = Object.values(lines).reduce((a, b) => a + b, 0);
	const sub = Object.entries(lines).reduce(
		(sum, [id, q]) => sum + (items.get(+id)?.price ?? 0) * q,
		0
	);

	if (!ready) return null; // the native splash is still showing

	if (!onboarded && data)
		return (
			<SafeAreaProvider>
				<SafeAreaView style={s.screen}>
					<StatusBar style="dark" />
					<Onboarding
						name={data.restaurant.name}
						brand={data.restaurant.theme}
						photos={[...items.values()].map((i) => asset(i.image)).filter((x) => x !== null)}
						onDone={(wantsSignIn) => {
							setOnboarded(true);
							store.set('onboarded', '1');
							if (wantsSignIn) setSheet('signin');
						}}
					/>
				</SafeAreaView>
			</SafeAreaProvider>
		);

	return (
		<SafeAreaProvider>
			<SafeAreaView style={s.screen} edges={['top', 'bottom']}>
				<StatusBar style="dark" />
				{data ? (
					<>
						<Menu
							data={data}
							lines={lines}
							add={add}
							mode={mode}
							setMode={setMode}
							refreshing={loading}
							onRefresh={load}
							session={session}
							onAccount={() => setSheet(session ? 'account' : 'signin')}
						/>
						<CartBar
							count={count}
							sub={sub}
							brand={data.restaurant.theme}
							onPress={() => setSheet('cart')}
						/>
						<Cart
							restaurant={data.restaurant}
							items={items}
							lines={lines}
							add={add}
							clear={() => setLines({})}
							session={session}
							mode={mode}
							setMode={setMode}
							onOrdered={refreshMe}
							visible={sheet === 'cart'}
							onClose={() => setSheet(null)}
						/>
						<SignIn
							visible={sheet === 'signin'}
							brand={data.restaurant.theme}
							onClose={() => setSheet(null)}
							onSignedIn={signIn}
						/>
						{session ? (
							<Account
								visible={sheet === 'account'}
								session={session}
								brand={data.restaurant.theme}
								onClose={() => setSheet(null)}
								onSignOut={signOut}
								onExpired={signOut}
							/>
						) : null}
					</>
				) : (
					<View style={s.center}>
						<Text style={[s.muted, { textAlign: 'center' }]}>{error}</Text>
						<Button label="Try again" onPress={load} />
					</View>
				)}
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

// Slides up with the first dish and away when the order is emptied; the total rolls as it changes.
function CartBar(p: { count: number; sub: number; brand: string; onPress: () => void }) {
	const y = useRef(new Animated.Value(p.count ? 0 : 1)).current;
	const [shown, setShown] = useState(p.count > 0);
	const has = p.count > 0;
	useEffect(() => {
		if (has) setShown(true);
		Animated.timing(y, { toValue: has ? 0 : 1, duration: ms(250), useNativeDriver: native }).start(
			() => {
				if (!has) setShown(false);
			}
		);
	}, [has, y]);
	if (!shown) return null;
	return (
		<Animated.View
			style={[
				s.bar,
				{
					transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) }]
				}
			]}
		>
			<Button
				label={`View your order, ${p.count} items, ${price(p.sub)}`}
				color={c.ink}
				onPress={p.onPress}
			>
				<View style={[s.count, { backgroundColor: p.brand }]}>
					<Rolling text={String(p.count)} style={s.countText} />
				</View>
				<ButtonAmount label="View your order" amount={p.sub} />
			</Button>
		</Animated.View>
	);
}

const hourNow = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Asia/Dhaka',
	hour: 'numeric',
	hourCycle: 'h23'
});
const greeting = () => {
	const h = +hourNow.format(new Date());
	return h < 5
		? 'Good night'
		: h < 12
			? 'Good morning'
			: h < 17
				? 'Good afternoon'
				: 'Good evening';
};

function Menu(p: {
	data: Data;
	lines: Lines;
	add: (id: number, by?: number) => void;
	mode: Mode;
	setMode: (m: Mode) => void;
	refreshing: boolean;
	onRefresh: () => void;
	session: Session | null;
	onAccount: () => void;
}) {
	const { restaurant, menu } = p.data;
	const brand = restaurant.theme;
	const state = openState(restaurant.hours);
	const list = useRef<SectionList<Item>>(null);
	const [active, setActive] = useState(0);
	const sections = menu
		.map((cat) => ({ key: String(cat.id), title: cat.name, data: cat.items }))
		.filter((cat) => cat.data.length);
	const firstName = p.session?.customer.name.split(' ')[0];

	// The chip for the section at the top of the screen lights up as you scroll.
	const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		const top = viewableItems.find((v) => v.section);
		if (top) setActive(sections.findIndex((x) => x.key === top.section.key));
	}).current;

	const [chipsY, setChipsY] = useState(0);
	const [stuck, setStuck] = useState(false);
	const fade = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		Animated.timing(fade, {
			toValue: stuck ? 1 : 0,
			duration: ms(160),
			useNativeDriver: native
		}).start();
	}, [stuck, fade]);

	const chipRow = (
		<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
			{sections.map((x, i) => (
				<Pressable
					key={x.key}
					onPress={() => jump(i)}
					style={[s.chip, i === active && { backgroundColor: c.ink, borderColor: c.ink }]}
					accessibilityRole="button"
					accessibilityState={{ selected: i === active }}
				>
					<Text style={[s.chipText, i === active && { color: c.bg }]}>{x.title}</Text>
				</Pressable>
			))}
		</ScrollView>
	);

	const jump = (i: number) => {
		setActive(i);
		list.current?.scrollToLocation({
			sectionIndex: i,
			itemIndex: 0,
			viewOffset: 64,
			animated: ms(1) > 0
		});
	};

	return (
		<View style={{ flex: 1 }}>
			<SectionList
				ref={list}
				scrollEventThrottle={16}
				onScroll={(e) => setStuck(e.nativeEvent.contentOffset.y > chipsY)}
				sections={sections}
				keyExtractor={(i) => String(i.id)}
				refreshControl={<RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
				onViewableItemsChanged={onViewable}
				viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
				onScrollToIndexFailed={() => {}}
				stickySectionHeadersEnabled={false}
				contentContainerStyle={{ paddingBottom: 24 }}
				ListHeaderComponent={
					<View style={s.header}>
						<View style={s.titleRow}>
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={s.hello}>
									{greeting()}
									{firstName ? `, ${firstName}` : ''}
								</Text>
								<Text style={s.headline}>What are you craving today?</Text>
							</View>
							<Pressable
								onPress={p.onAccount}
								hitSlop={10}
								accessibilityRole="button"
								accessibilityLabel={p.session ? 'Your account' : 'Sign in'}
								style={s.account}
							>
								<Icon icon={UserCircleIcon} size={24} color={p.session ? brand : c.ink} />
							</Pressable>
						</View>

						<View style={s.place}>
							<View style={[s.dot, { backgroundColor: state.open ? c.green : brand }]} />
							<Text style={s.placeText} numberOfLines={1}>
								{restaurant.name} ·{' '}
								{state.open
									? `Open until ${time(state.closes)}`
									: state.at
										? `Opens ${state.when} at ${time(state.at)}`
										: 'Closed today'}
							</Text>
						</View>

						<View style={s.segment} accessibilityRole="radiogroup">
							{(['delivery', 'pickup'] as const).map((m) => {
								const on = p.mode === m;
								return (
									<Pressable
										key={m}
										onPress={() => p.setMode(m)}
										style={[s.segBtn, on && { backgroundColor: brand }]}
										accessibilityRole="radio"
										accessibilityState={{ selected: on }}
									>
										<Icon
											icon={m === 'delivery' ? MotorbikeIcon : Store01Icon}
											size={18}
											color={on ? c.bg : c.ink}
										/>
										<Text style={[s.segText, on && { color: c.bg }]}>
											{m === 'delivery' ? 'Delivery' : 'Pickup'}
										</Text>
									</Pressable>
								);
							})}
						</View>
						<Text style={s.eta}>
							{p.mode === 'delivery'
								? `Arrives in ${restaurant.delivery.eta} · ${restaurant.delivery.fee ? `${price(restaurant.delivery.fee)} delivery, free over ${price(restaurant.delivery.free_over)}` : 'free delivery'}`
								: `Ready in ${restaurant.pickup_eta} · pay at the counter`}
						</Text>
						<View
							onLayout={(e) => setChipsY(e.nativeEvent.layout.y)}
							style={{ marginHorizontal: -20 }}
						>
							{chipRow}
						</View>
					</View>
				}
				renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
				renderItem={({ item }) => (
					<Dish item={item} qty={p.lines[item.id]} add={p.add} brand={brand} />
				)}
			/>
			<Animated.View
				pointerEvents={stuck ? 'auto' : 'none'}
				style={[s.pinned, { opacity: fade }]}
				accessibilityElementsHidden={!stuck}
				importantForAccessibility={stuck ? 'auto' : 'no-hide-descendants'}
			>
				{chipRow}
			</Animated.View>
		</View>
	);
}

function Dish(p: {
	item: Item;
	qty?: number;
	add: (id: number, by?: number) => void;
	brand: string;
}) {
	const { item } = p;
	const change = (by: number) => {
		animateList();
		p.add(item.id, by);
	};
	const photo = asset(item.image);
	return (
		<View style={[s.card, !item.available && s.soldOut]}>
			{photo ? (
				<Image source={{ uri: photo }} style={s.photo} accessibilityIgnoresInvertColors />
			) : (
				<View style={[s.photo, s.noPhoto]}>
					<Icon icon={ChefHatIcon} size={30} color={p.brand} />
				</View>
			)}
			<View style={s.itemText}>
				<Text style={s.itemName}>{item.name}</Text>
				{item.description ? (
					<Text style={s.desc} numberOfLines={2}>
						{item.description}
					</Text>
				) : null}
				<View style={s.priceRow}>
					<Text style={s.price}>{item.available ? price(item.price) : 'Sold out'}</Text>
					{!item.available ? null : p.qty ? (
						<Stepper
							qty={p.qty}
							label={item.name}
							onMinus={() => change(-1)}
							onPlus={() => change(1)}
						/>
					) : (
						<Pressable
							style={({ pressed }) => [
								s.plus,
								{ backgroundColor: p.brand, opacity: pressed ? 0.85 : 1 }
							]}
							onPress={() => change(1)}
							accessibilityRole="button"
							accessibilityLabel={`Add ${item.name}`}
							hitSlop={8}
						>
							<Text style={s.plusText}>+</Text>
						</Pressable>
					)}
				</View>
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	screen: { flex: 1, backgroundColor: c.bg },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
	header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 14 },
	titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
	hello: { fontFamily: f.medium, fontSize: 15, color: c.muted },
	headline: {
		fontFamily: f.black,
		fontSize: 28,
		lineHeight: 33,
		color: c.ink,
		letterSpacing: -0.5
	},
	account: {
		width: 44,
		height: 44,
		borderRadius: 999,
		backgroundColor: c.card,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: c.line
	},
	place: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	placeText: { fontFamily: f.medium, fontSize: 14, color: c.ink, flex: 1 },
	segment: {
		flexDirection: 'row',
		padding: 4,
		borderRadius: 999,
		backgroundColor: c.card,
		borderWidth: 1,
		borderColor: c.line
	},
	segBtn: {
		flex: 1,
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 11,
		borderRadius: 999
	},
	segText: { fontFamily: f.semi, fontSize: 15, color: c.ink },
	eta: { fontFamily: f.regular, fontSize: 13, color: c.muted, textAlign: 'center', marginTop: -4 },
	pinned: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: c.bg,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.line
	},
	chips: { paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
	chip: {
		paddingHorizontal: 16,
		paddingVertical: 9,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: c.line,
		backgroundColor: c.card
	},
	chipText: { fontFamily: f.semi, fontSize: 14, color: c.ink },
	section: {
		fontFamily: f.bold,
		fontSize: 20,
		color: c.ink,
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 10,
		letterSpacing: -0.3
	},
	card: {
		flexDirection: 'row',
		gap: 14,
		marginHorizontal: 16,
		marginBottom: 12,
		padding: 12,
		borderRadius: 22,
		backgroundColor: c.card,
		boxShadow: '0 6px 16px rgba(58, 42, 16, 0.06)'
	},
	photo: { width: 92, height: 92, borderRadius: 999 },
	noPhoto: { backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
	soldOut: { opacity: 0.5 },
	itemText: { flex: 1, gap: 4, justifyContent: 'center' },
	itemName: { fontFamily: f.bold, fontSize: 16, color: c.ink },
	desc: { fontFamily: f.regular, fontSize: 13, lineHeight: 18, color: c.muted },
	priceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 4
	},
	price: { fontFamily: f.bold, fontSize: 16, color: c.ink },
	plus: {
		width: 36,
		height: 36,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center'
	},
	plusText: { fontFamily: f.semi, fontSize: 22, lineHeight: 24, color: c.bg },
	muted: { fontFamily: f.regular, color: c.muted },
	bar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, backgroundColor: 'transparent' },
	count: {
		minWidth: 26,
		height: 26,
		paddingHorizontal: 6,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center'
	},
	countText: { fontFamily: f.bold, fontSize: 14, lineHeight: 18, color: c.bg }
});
