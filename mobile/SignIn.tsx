import { useEffect, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View
} from 'react-native';
import { ArrowLeft02Icon, Cancel01Icon, SmartPhone01Icon } from '@hugeicons/core-free-icons';
import { api, ApiError, message, type Session } from './api';
import { Rolling } from './Rolling';
import { Button, Icon, IconButton } from './ui';
import { c, f } from './theme';

const RESEND_AFTER = 30;

export function SignIn(p: {
	visible: boolean;
	brand: string;
	onClose: () => void;
	onSignedIn: (s: Session) => void;
}) {
	const [step, setStep] = useState<'phone' | 'code'>('phone');
	const [phone, setPhone] = useState('');
	const [code, setCode] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [wait, setWait] = useState(0);
	const codeInput = useRef<TextInput>(null);

	useEffect(() => {
		if (!wait) return;
		const t = setTimeout(() => setWait(wait - 1), 1000);
		return () => clearTimeout(t);
	}, [wait]);

	function close() {
		p.onClose();
		setStep('phone');
		setCode('');
		setError('');
	}

	async function sendCode() {
		setBusy(true);
		setError('');
		try {
			await api('/v1/auth/code', { method: 'POST', body: JSON.stringify({ phone }) });
			setStep('code');
			setCode('');
			setWait(RESEND_AFTER);
			setTimeout(() => codeInput.current?.focus(), 300);
		} catch (e) {
			setError(
				e instanceof ApiError && e.code === 'validation_failed'
					? 'Enter a Bangladeshi mobile number, like 01712345678.'
					: e instanceof ApiError && e.code === 'too_many_attempts'
						? 'We’ve sent a few codes already. Please wait 15 minutes and try again.'
						: message(e)
			);
		} finally {
			setBusy(false);
		}
	}

	async function verify(value: string) {
		setBusy(true);
		setError('');
		try {
			const session = await api<Session>('/v1/auth/verify', {
				method: 'POST',
				body: JSON.stringify({ phone, code: value })
			});
			p.onSignedIn(session);
			close();
		} catch (e) {
			setError(
				e instanceof ApiError && e.code === 'too_many_attempts'
					? 'Too many wrong codes. Ask for a new one.'
					: message(e)
			);
			setCode('');
		} finally {
			setBusy(false);
		}
	}

	function onCode(v: string) {
		const digits = v.replace(/\D/g, '').slice(0, 6);
		setCode(digits);
		if (digits.length === 6) verify(digits);
	}

	return (
		<Modal
			visible={p.visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={close}
		>
			<KeyboardAvoidingView
				style={s.sheet}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<View style={s.head}>
					{step === 'code' ? (
						<IconButton
							icon={ArrowLeft02Icon}
							label="Change number"
							onPress={() => setStep('phone')}
						/>
					) : (
						<View style={{ width: 36 }} />
					)}
					<Text style={s.title}>Sign in</Text>
					<IconButton icon={Cancel01Icon} label="Close" onPress={close} />
				</View>
				<View style={s.body}>
					<View style={[s.badge, { backgroundColor: p.brand + '1f' }]}>
						<Icon icon={SmartPhone01Icon} size={32} color={p.brand} />
					</View>
					{step === 'phone' ? (
						<>
							<Text style={s.heading}>What’s your mobile number?</Text>
							<Text style={s.muted}>
								We’ll text you a 6-digit code. Signing in saves your address and shows your past
								orders. You can always order without it.
							</Text>
							<TextInput
								style={s.input}
								accessibilityLabel="Mobile number"
								value={phone}
								onChangeText={setPhone}
								placeholder="01XXXXXXXXX"
								placeholderTextColor={c.muted}
								keyboardType="phone-pad"
								autoComplete="tel"
								textContentType="telephoneNumber"
								autoFocus
								onSubmitEditing={sendCode}
							/>
							{error ? <Text style={s.error}>{error}</Text> : null}
							<Button
								label={busy ? 'Sending…' : 'Text me a code'}
								color={p.brand}
								disabled={busy || !phone.trim()}
								onPress={sendCode}
							/>
						</>
					) : (
						<>
							<Text style={s.heading}>Enter the code</Text>
							<Text style={s.muted}>We sent it to {phone}. It works for 5 minutes.</Text>
							<Pressable
								onPress={() => codeInput.current?.focus()}
								style={s.boxes}
								accessible={false}
							>
								{[0, 1, 2, 3, 4, 5].map((i) => (
									<View
										key={i}
										style={[
											s.box,
											i === code.length && { borderColor: p.brand, borderWidth: 2 },
											!!error && s.bad
										]}
									>
										<Text style={s.digit}>{code[i] ?? ''}</Text>
									</View>
								))}
								<TextInput
									ref={codeInput}
									style={s.hidden}
									accessibilityLabel="6-digit code"
									value={code}
									onChangeText={onCode}
									keyboardType="number-pad"
									textContentType="oneTimeCode"
									autoComplete="sms-otp"
									maxLength={6}
									editable={!busy}
									caretHidden
								/>
							</Pressable>
							{error ? <Text style={s.error}>{error}</Text> : null}
							{busy ? <Text style={s.muted}>Checking…</Text> : null}
							{wait ? (
								<View style={s.wait}>
									<Text style={s.muted}>Send a new code in 0:</Text>
									<Rolling text={String(wait).padStart(2, '0')} style={s.waitNum} />
								</View>
							) : (
								<Button label="Send a new code" ghost disabled={busy} onPress={sendCode} />
							)}
						</>
					)}
				</View>
			</KeyboardAvoidingView>
		</Modal>
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
	body: { padding: 24, gap: 16 },
	badge: {
		width: 64,
		height: 64,
		borderRadius: 999,
		alignItems: 'center',
		justifyContent: 'center'
	},
	heading: { fontSize: 24, fontFamily: f.bold, color: c.ink },
	muted: { color: c.muted, fontFamily: f.regular, fontSize: 15, lineHeight: 21 },
	input: {
		fontFamily: f.regular,
		fontSize: 18,
		color: c.ink,
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: c.line,
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12
	},
	boxes: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
	box: {
		flex: 1,
		aspectRatio: 0.85,
		maxWidth: 52,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: c.line,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center'
	},
	digit: { fontSize: 24, fontFamily: f.bold, color: c.ink },
	hidden: { position: 'absolute', width: '100%', height: '100%', opacity: 0.011 },
	error: { color: '#b3261e' },
	bad: { borderColor: '#b3261e' },
	wait: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
	waitNum: { fontFamily: f.regular, fontSize: 15, lineHeight: 21, color: c.muted }
});
