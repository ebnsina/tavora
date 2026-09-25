import { useRef, useState } from 'react';
import {
	Animated,
	Image,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View
} from 'react-native';
import { Cash01Icon, MotorbikeIcon, ChefHatIcon } from '@hugeicons/core-free-icons';
import { Button, Icon, type IconData } from './ui';
import { ms, native } from './motion';
import { c, f } from './theme';

const slides: { icon: IconData; kicker: string; title: string; body: string }[] = [
	{
		icon: ChefHatIcon,
		kicker: 'Welcome to',
		title: 'Real food,\nmade fresh.',
		body: 'See every dish with its price, and what’s sold out today, before you order.'
	},
	{
		icon: Cash01Icon,
		kicker: 'No card needed',
		title: 'Pay when\nit arrives.',
		body: 'Cash on delivery, or pick it up and pay at the counter.'
	},
	{
		icon: MotorbikeIcon,
		kicker: 'Hot and quick',
		title: 'Straight from\nour kitchen.',
		body: 'We start cooking the moment you order. Sign in to save your address for next time.'
	}
];

export function Onboarding(p: {
	name: string;
	brand: string;
	photos: string[];
	onDone: (signIn: boolean) => void;
}) {
	const { width } = useWindowDimensions();
	const x = useRef(new Animated.Value(0)).current;
	const list = useRef<ScrollView>(null);
	const [page, setPage] = useState(0);
	const last = page === slides.length - 1;
	const art = Math.min(width - 96, 300);

	const next = () => list.current?.scrollTo({ x: (page + 1) * width, animated: ms(1) > 0 });

	return (
		<View style={s.screen}>
			<View style={s.top}>
				<Text style={s.brand}>{p.name}</Text>
				<Pressable
					onPress={() => p.onDone(false)}
					hitSlop={12}
					accessibilityRole="button"
					style={{ opacity: last ? 0 : 1 }}
					disabled={last}
				>
					<Text style={s.skip}>Skip</Text>
				</Pressable>
			</View>
			<Animated.ScrollView
				ref={list}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				scrollEventThrottle={16}
				onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], {
					useNativeDriver: native,
					listener: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
						setPage(Math.round(e.nativeEvent.contentOffset.x / width))
				})}
			>
				{slides.map((sl, i) => {
					const range = [(i - 1) * width, i * width, (i + 1) * width];
					const drift = x.interpolate({
						inputRange: range,
						outputRange: [width * 0.3, 0, -width * 0.3]
					});
					const spin = x.interpolate({
						inputRange: range,
						outputRange: ['-25deg', '0deg', '25deg']
					});
					const scale = x.interpolate({
						inputRange: range,
						outputRange: [0.8, 1, 0.8],
						extrapolate: 'clamp'
					});
					const fade = x.interpolate({
						inputRange: range,
						outputRange: [0, 1, 0],
						extrapolate: 'clamp'
					});
					const photo = p.photos[i % Math.max(p.photos.length, 1)];
					return (
						<View key={sl.title} style={[s.slide, { width }]}>
							<Animated.View
								style={[
									s.ring,
									{
										width: art,
										height: art,
										borderColor: p.brand + '33',
										backgroundColor: p.brand + '12',
										transform: [{ translateX: drift }, { scale }]
									}
								]}
							>
								{photo ? (
									<Animated.Image
										source={{ uri: photo }}
										style={[
											s.photo,
											{ width: art - 36, height: art - 36, transform: [{ rotate: spin }] }
										]}
										accessibilityIgnoresInvertColors
									/>
								) : (
									<View
										style={[
											s.photo,
											s.iconArt,
											{ width: art - 36, height: art - 36, backgroundColor: p.brand }
										]}
									>
										<Icon icon={sl.icon} size={72} color={c.bg} />
									</View>
								)}
								<View style={[s.badge, { backgroundColor: p.brand }]}>
									<Icon icon={sl.icon} size={24} color={c.bg} />
								</View>
							</Animated.View>
							<Animated.View style={[s.copy, { opacity: fade }]}>
								<Text style={[s.kicker, { color: p.brand }]}>
									{i === 0 ? `${sl.kicker} ${p.name}` : sl.kicker}
								</Text>
								<Text style={s.title}>{sl.title}</Text>
								<Text style={s.body}>{sl.body}</Text>
							</Animated.View>
						</View>
					);
				})}
			</Animated.ScrollView>
			<View style={s.foot}>
				<View style={s.dots} accessibilityLabel={`Page ${page + 1} of ${slides.length}`}>
					{slides.map((_, i) => {
						const range = [(i - 1) * width, i * width, (i + 1) * width];
						return (
							<Animated.View
								key={i}
								style={[
									s.dot,
									{
										backgroundColor: p.brand,
										opacity: x.interpolate({
											inputRange: range,
											outputRange: [0.25, 1, 0.25],
											extrapolate: 'clamp'
										}),
										transform: [
											{
												scale: x.interpolate({
													inputRange: range,
													outputRange: [1, 1.5, 1],
													extrapolate: 'clamp'
												})
											}
										]
									}
								]}
							/>
						);
					})}
				</View>
				<Button
					label={last ? 'Start ordering' : 'Next'}
					color={c.ink}
					onPress={last ? () => p.onDone(false) : next}
				/>
				<Pressable
					onPress={() => p.onDone(true)}
					hitSlop={8}
					accessibilityRole="button"
					style={s.signIn}
				>
					<Text style={s.signInText}>
						Ordered with us before? <Text style={[s.signInLink, { color: p.brand }]}>Sign in</Text>
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

const s = StyleSheet.create({
	screen: { flex: 1, backgroundColor: c.bg },
	top: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 12
	},
	brand: { fontFamily: f.black, fontSize: 20, color: c.ink, letterSpacing: -0.3 },
	skip: { fontFamily: f.medium, fontSize: 16, color: c.muted },
	slide: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		gap: 36
	},
	ring: { borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
	photo: { borderRadius: 999 },
	iconArt: { alignItems: 'center', justifyContent: 'center' },
	badge: {
		position: 'absolute',
		right: 14,
		bottom: 22,
		width: 52,
		height: 52,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 4,
		borderColor: c.bg
	},
	copy: { alignItems: 'center', gap: 10 },
	kicker: { fontFamily: f.bold, fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase' },
	title: {
		fontFamily: f.black,
		fontSize: 36,
		lineHeight: 40,
		color: c.ink,
		textAlign: 'center',
		letterSpacing: -1
	},
	body: {
		fontFamily: f.regular,
		fontSize: 16,
		lineHeight: 23,
		color: c.muted,
		textAlign: 'center'
	},
	foot: { paddingHorizontal: 24, paddingBottom: 16, gap: 14 },
	dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 6 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	signIn: { alignSelf: 'center', paddingVertical: 4 },
	signInText: { fontFamily: f.regular, fontSize: 15, color: c.muted },
	signInLink: { fontFamily: f.bold }
});
