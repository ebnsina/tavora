import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { api, message, openState, price, time, type Category, type Restaurant } from './api';

type Data = { restaurant: Restaurant; menu: Category[] };

export default function App() {
	const [data, setData] = useState<Data>();
	const [error, setError] = useState<string>();
	const [loading, setLoading] = useState(true);

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

	return (
		<SafeAreaProvider>
			<SafeAreaView style={s.screen} edges={['top']}>
				<StatusBar style="dark" />
				{data ? (
					<Menu data={data} refreshing={loading} onRefresh={load} />
				) : loading ? (
					<ActivityIndicator style={s.center} />
				) : (
					<View style={s.center}>
						<Text style={s.muted}>{error}</Text>
						<Pressable style={s.button} onPress={load}>
							<Text style={s.buttonText}>Try again</Text>
						</Pressable>
					</View>
				)}
			</SafeAreaView>
		</SafeAreaProvider>
	);
}

function Menu({ data, refreshing, onRefresh }: { data: Data; refreshing: boolean; onRefresh: () => void }) {
	const { restaurant, menu } = data;
	const state = openState(restaurant.hours);
	const brand = restaurant.theme;
	const sections = menu
		.map((c) => ({ key: String(c.id), title: c.name, data: c.items }))
		.filter((c) => c.data.length);

	return (
		<SectionList
			sections={sections}
			keyExtractor={(i) => String(i.id)}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			stickySectionHeadersEnabled
			ListHeaderComponent={
				<View style={s.header}>
					<Text style={s.name}>{restaurant.name}</Text>
					<Text style={s.muted}>{restaurant.address}</Text>
					<Text style={[s.status, { color: state.open ? '#2e8b57' : brand }]}>
						{state.open
							? `Open now, until ${time(state.closes)}`
							: state.at
								? `Closed, opens ${state.when} at ${time(state.at)}`
								: 'Closed'}
					</Text>
				</View>
			}
			renderSectionHeader={({ section }) => <Text style={s.section}>{section.title}</Text>}
			renderItem={({ item }) => (
				<View style={[s.item, !item.available && s.soldOut]}>
					<View style={s.itemText}>
						<Text style={s.itemName}>{item.name}</Text>
						{item.description ? <Text style={s.muted}>{item.description}</Text> : null}
					</View>
					<Text style={s.price}>{item.available ? price(item.price) : 'Sold out'}</Text>
				</View>
			)}
		/>
	);
}

// Same palette as the public website (web/src/app.css).
const s = StyleSheet.create({
	screen: { flex: 1, backgroundColor: '#fff9e7' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
	header: { padding: 16, gap: 4 },
	name: { fontSize: 28, fontWeight: '700', color: '#000' },
	status: { marginTop: 8, fontWeight: '600' },
	section: {
		backgroundColor: '#f5e9cf',
		paddingHorizontal: 16,
		paddingVertical: 8,
		fontSize: 18,
		fontWeight: '700',
		color: '#000'
	},
	item: {
		flexDirection: 'row',
		gap: 12,
		padding: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#e6d9bd'
	},
	soldOut: { opacity: 0.5 },
	itemText: { flex: 1, gap: 4 },
	itemName: { fontSize: 16, fontWeight: '600', color: '#000' },
	price: { fontSize: 16, fontWeight: '600', color: '#000' },
	muted: { color: '#6a6155', textAlign: 'left' },
	button: { backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
	buttonText: { color: '#fff9e7', fontWeight: '600' }
});
