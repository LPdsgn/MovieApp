import * as Haptics from 'expo-haptics';
import { Link, useRouter } from 'expo-router';
import { HistoryIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

import { Screen } from '@/components/screen';
import { Image } from '@/components/styled';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';

const POPCORN = require('@/assets/images/Popcorns.png');
const BUTTON = 252;

/** Discover: titolo, icona cronologia, bottone Popcorn con i cerchi che pulsano, "Tocca per iniziare!". */
export default function DiscoverScreen() {
	const router = useRouter();
	return (
		<Screen>
			<View className="flex-1 pt-safe">
				<View className="flex-row items-end justify-between px-5 pt-4">
					<Text className="text-4xl font-bold text-foreground">{t('tab.discover')}</Text>
					<Link href="/history" asChild>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t('discover.history')}
							hitSlop={12}
							className="mb-1 active:opacity-60">
							<Icon as={HistoryIcon} className="text-primary" size={28} />
						</Pressable>
					</Link>
				</View>

				<View className="flex-1 items-center justify-center gap-8">
					<View
						className="items-center justify-center"
						style={{ width: BUTTON, height: BUTTON }}>
						<Pulse />
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={t('discover.cta')}
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
								router.push('/swipe');
							}}
							style={{ width: BUTTON, height: BUTTON, borderRadius: BUTTON / 2 }}
							className="items-center justify-center bg-secondary shadow-lg shadow-black/30 active:scale-95">
							<Image source={POPCORN} contentFit="cover" className="h-[70%] w-[70%]" />
						</Pressable>
					</View>
					<Text className="text-2xl font-semibold text-foreground">{t('discover.cta')}</Text>
				</View>
			</View>
		</Screen>
	);
}

/** Tre cerchi concentrici al 2% che pulsano (0,8→1 in 1,5 s, autoreverse). Fermi con "riduci movimento". */
function Pulse() {
	const reduceMotion = useReducedMotion();
	const progress = useSharedValue(0);
	React.useEffect(() => {
		if (reduceMotion) return;
		progress.set(
			withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true)
		);
	}, [progress, reduceMotion]);
	return (
		<>
			{[636, 431, 323].map((size, i) => (
				<Ring key={size} size={size} min={0.8 + i * 0.05} progress={progress} />
			))}
		</>
	);
}

function Ring({
	size,
	min,
	progress,
}: {
	size: number;
	min: number;
	progress: ReturnType<typeof useSharedValue<number>>;
}) {
	const style = useAnimatedStyle(() => ({
		transform: [{ scale: min + (1 - min) * progress.get() }],
	}));
	return (
		<Animated.View
			pointerEvents="none"
			style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
			className="absolute bg-white/[0.02]"
		/>
	);
}
