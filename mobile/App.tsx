import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api, message, openState, price, time, type Category, type Item, type Restaurant } from './api';
import { Button, Cart, Stepper, type Lines } from './Cart';
import { c } from './theme';

type Data = { restaurant: Restaurant; menu: Category[] };

export default function App() {
	const [data, setData] = useState<Data>();
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(true);
	const [lines, setLines] = useState<Lines>({});
	const [cartOpen, setCartOpen] = useState(false);

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

	useEffect(() => {
		load();
	}, [load]);

	const items = useMemo(() => new Map(data?.menu.flatMap((cat) => cat.items.map((i) => [i.id, i]))), [data]);
	// Drop dishes that left the menu or sold out since they were added.
	useEffect(() => {
		setLines((l) => Object.fromEntries(Object.entries(l).filter(([id]) => items.get(+id)?.available)));
	}, [items]);

	const add = (id: number, by = 1) =>
		setLines(({ [id]: qty = 0, ...rest }) => (qty + by > 0 ? { ...rest, [id]: qty + by } : rest));
	const count = Object.values(lines).reduce((a, b) => a + b, 0);
	const sub = Object.entries(lines).reduce((sum, [id, q]) => sum + (items.get(+id)?.price ?? 0) * q, 0);

	return (
		<SafeAreaProvider>
			<SafeAreaView style={s.screen} edges={['top', 'bottom']}>
				<StatusBar style="dark" />
				{data ? (
					<>
						<Menu data={data} lines={lines} add={add} refreshing={loading} onRefresh={load} />
						{count ? (
							<View style={s.bar}>
								<Button
									label={`View your order · ${count} · ${price(sub)}`}
									color={data.restaurant.theme}
									onPress={() => setCartOpen(true)}
								/>
							</View>
						) : null}
						<Cart
							restaurant={data.restaurant}
							items={items}
							lines={lines}
							add={add}
							clear={() => setLines({})}
							visible={cartOpen}
							onClose={() => setCartOpen(false)}
						/>
					</>
				) : loading ? (
					<ActivityIndicator style={s.center} />
				) : (
					<View style={s.center}>
						<Text style={s.muted}>{error}</Text>
						<Button label="Try again" onPress={load} />
					</View>
				)}
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

function Menu(p: {
	data: Data;
	lines: Lines;
	add: (id: number, by?: number) => void;
	refreshing: boolean;
	onRefresh: () => void;
}) {
	const { restaurant, menu } = p.data;
	const state = openState(restaurant.hours);
	const sections = menu
		.map((cat) => ({ key: String(cat.id), title: cat.name, data: cat.items }))
		.filter((cat) => cat.data.length);

	return (
		<SectionList
			sections={sections}
			keyExtractor={(i) => String(i.id)}
			refreshControl={<RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
			stickySectionHeadersEnabled
			ListHeaderComponent={
				<View style={s.header}>
					<Text style={s.name}>{restaurant.name}</Text>
					<Text style={s.muted}>{restaurant.address}</Text>
					<Text style={[s.status, { color: state.open ? c.green : restaurant.theme }]}>
						{state.open
							? `Open now, until ${time(state.closes)}`
							: state.at
								? `Closed, opens ${state.when} at ${time(state.at)}`
								: 'Closed'}
					</Text>
				</View>
			}
			renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
			renderItem={({ item }) => <Dish item={item} qty={p.lines[item.id]} add={p.add} brand={restaurant.theme} />}
		/>
	);
}

function Dish({ item, qty, add, brand }: { item: Item; qty?: number; add: (id: number, by?: number) => void; brand: string }) {
	return (
		<View style={[s.item, !item.available && s.soldOut]}>
			<View style={s.itemText}>
				<Text style={s.itemName}>{item.name}</Text>
				{item.description ? <Text style={s.muted}>{item.description}</Text> : null}
				<Text style={s.price}>{item.available ? price(item.price) : 'Sold out'}</Text>
			</View>
			{!item.available ? null : qty ? (
				<Stepper qty={qty} label={item.name} onMinus={() => add(item.id, -1)} onPlus={() => add(item.id)} />
			) : (
				<Pressable
					style={[s.add, { backgroundColor: brand }]}
					onPress={() => add(item.id)}
					accessibilityRole="button"
					accessibilityLabel={`Add ${item.name}`}
				>
					<Text style={s.addText}>Add</Text>
				</Pressable>
			)}
		</View>
	);
}

const s = StyleSheet.create({
	screen: { flex: 1, backgroundColor: c.bg },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
	header: { padding: 16, gap: 4 },
	name: { fontSize: 28, fontWeight: '700', color: c.ink },
	status: { marginTop: 8, fontWeight: '600' },
	section: { backgroundColor: c.soft, paddingHorizontal: 16, paddingVertical: 8, fontSize: 18, fontWeight: '700', color: c.ink },
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: c.line
	},
	soldOut: { opacity: 0.5 },
	itemText: { flex: 1, gap: 4 },
	itemName: { fontSize: 16, fontWeight: '600', color: c.ink },
	price: { fontSize: 15, fontWeight: '600', color: c.ink },
	muted: { color: c.muted },
	add: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
	addText: { color: c.bg, fontWeight: '600' },
	bar: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, backgroundColor: c.bg }
});
