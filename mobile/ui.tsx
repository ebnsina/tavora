import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Rolling } from './Rolling';
import { ms, native } from './motion';
import { c, f } from './theme';

export type IconData = Parameters<typeof HugeiconsIcon>[0]['icon'];

export const Icon = ({
	icon,
	size = 22,
	color = c.ink
}: {
	icon: IconData;
	size?: number;
	color?: string;
}) => <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={1.8} />;

// Presses sink slightly, so every tap gets a response even before the network answers.
export function Button(p: {
	label: string;
	onPress: () => void;
	color?: string;
	ghost?: boolean;
	disabled?: boolean;
	icon?: IconData;
	children?: ReactNode;
}) {
	const scale = useRef(new Animated.Value(1)).current;
	const to = (v: number) =>
		Animated.spring(scale, {
			toValue: v,
			speed: 40,
			bounciness: 6,
			useNativeDriver: native
		}).start();
	const fg = p.ghost ? c.ink : c.bg;
	return (
		<Animated.View style={{ transform: [{ scale }] }}>
			<Pressable
				onPress={p.onPress}
				onPressIn={() => {
					if (ms(1)) to(0.97);
				}}
				onPressOut={() => to(1)}
				disabled={p.disabled}
				accessibilityRole="button"
				accessibilityLabel={p.label}
				accessibilityState={{ disabled: p.disabled }}
				style={[
					s.button,
					p.ghost ? s.ghost : { backgroundColor: p.color ?? c.ink },
					p.disabled && { opacity: 0.4 }
				]}
			>
				{p.icon ? <Icon icon={p.icon} size={20} color={fg} /> : null}
				{p.children ?? <Text style={[s.buttonText, { color: fg }]}>{p.label}</Text>}
			</Pressable>
		</Animated.View>
	);
}

export function IconButton({
	icon,
	label,
	onPress
}: {
	icon: IconData;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={12}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={s.iconBtn}
		>
			<Icon icon={icon} />
		</Pressable>
	);
}

export function Stepper(p: {
	qty: number;
	label: string;
	onMinus: () => void;
	onPlus: () => void;
}) {
	return (
		<View style={s.stepper}>
			<Pressable
				style={s.step}
				onPress={p.onMinus}
				accessibilityRole="button"
				accessibilityLabel={`Remove one ${p.label}`}
				hitSlop={6}
			>
				<Text style={s.stepText}>−</Text>
			</Pressable>
			<Rolling text={String(p.qty)} style={s.qty} />
			<Pressable
				style={s.step}
				onPress={p.onPlus}
				accessibilityRole="button"
				accessibilityLabel={`Add one more ${p.label}`}
				hitSlop={6}
			>
				<Text style={s.stepText}>+</Text>
			</Pressable>
		</View>
	);
}

export const s = StyleSheet.create({
	button: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 999
	},
	ghost: { borderWidth: 1, borderColor: c.line },
	buttonText: { fontSize: 16, fontFamily: f.semi },
	iconBtn: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 999
	},
	stepper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 999,
		borderWidth: 1,
		borderColor: c.line,
		backgroundColor: '#fff'
	},
	step: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
	stepText: { fontFamily: f.regular, fontSize: 18, color: c.ink },
	qty: {
		fontSize: 16,
		lineHeight: 22,
		fontFamily: f.semi,
		color: c.ink,
		minWidth: 10,
		textAlign: 'center'
	},
	muted: { color: c.muted }
});
