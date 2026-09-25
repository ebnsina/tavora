import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { ms, native } from './motion';

const DIGITS = [...'0123456789'];

// Text whose digits roll to their new value, like an odometer. Needs a lineHeight in `style`.
export function Rolling({
	text,
	style
}: {
	text: string;
	style: TextStyle & { lineHeight: number };
}) {
	const chars = [...text];
	return (
		<View style={s.row} accessible accessibilityLabel={text} importantForAccessibility="yes">
			{chars.map((ch, i) => {
				// Keyed from the right so units stay units when the number grows a digit.
				const key = chars.length - i;
				return /\d/.test(ch) ? (
					<Digit key={key} d={+ch} style={style} />
				) : (
					<Text key={key} style={[style, s.digit]} importantForAccessibility="no-hide-descendants">
						{ch}
					</Text>
				);
			})}
		</View>
	);
}

function Digit({ d, style }: { d: number; style: TextStyle & { lineHeight: number } }) {
	const y = useRef(new Animated.Value(d)).current;
	useEffect(() => {
		Animated.timing(y, {
			toValue: d,
			duration: ms(420),
			easing: Easing.out(Easing.cubic),
			useNativeDriver: native
		}).start();
	}, [d, y]);
	const h = style.lineHeight;
	return (
		<View style={{ height: h, overflow: 'hidden' }} importantForAccessibility="no-hide-descendants">
			<Animated.View style={{ transform: [{ translateY: Animated.multiply(y, -h) }] }}>
				{DIGITS.map((n) => (
					<Text key={n} style={[style, s.digit]}>
						{n}
					</Text>
				))}
			</Animated.View>
		</View>
	);
}

const s = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'flex-start' },
	digit: { textAlign: 'center' }
});
