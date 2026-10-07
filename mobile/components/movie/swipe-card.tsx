import * as React from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import { SwipeLabel } from '@/components/movie/swipe-label';
import { exitOffset, labelOpacities, rotationFor, SWIPE, swipeDecision } from '@/lib/deck/swipe';
import type { Action, Source } from '@/lib/userdb';

export interface SwipeCardHandle {
	/** Fa uscire la carta come se fosse stata trascinata: per i tre bottoni sotto il mazzo. */
	fling: (action: Action) => void;
}

/**
 * Carta in cima al mazzo: trascinabile, con rotazione, etichette YEP/NOPE/SALVATO e uscita animata.
 * Al rilascio decide con `swipeDecision`; `onSwipe` parte **dopo** l'animazione di uscita.
 * Valori condivisi con get()/set(): React Compiler attivo (CLAUDE.md).
 */
export const SwipeCard = React.forwardRef<
	SwipeCardHandle,
	{
		children: React.ReactNode;
		restingRotation: number;
		/** Solo la carta in cima riceve gesto e tap; le altre aspettano la promozione senza rimontare. */
		interactive: boolean;
		/** 0 = in cima: decide lo zIndex. */
		depth: number;
		enabled?: boolean;
		onSwipe: (action: Action, source: Source) => void;
		onPress?: () => void;
		accessibilityLabel: string;
	}
>(function SwipeCard(
	{
		children,
		restingRotation,
		interactive,
		depth,
		enabled = true,
		onSwipe,
		onPress,
		accessibilityLabel,
	},
	ref
) {
	const { width, height } = useWindowDimensions();
	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const rotation = useSharedValue(0);
	const flying = useSharedValue(false);

	const leave = React.useCallback(
		(action: Action, source: Source) => {
			'worklet';
			const to = exitOffset(action);
			flying.set(true);
			rotation.set(withTiming(to.rotation, { duration: SWIPE.duration }));
			ty.set(withTiming(to.y, { duration: SWIPE.duration }));
			tx.set(
				withTiming(to.x, { duration: SWIPE.duration }, (finished) => {
					if (finished) runOnJS(onSwipe)(action, source);
				})
			);
		},
		[flying, onSwipe, rotation, tx, ty]
	);

	React.useImperativeHandle(ref, () => ({ fling: (action) => leave(action, 'button') }), [leave]);

	// Il Pressable riceve il rilascio anche dopo un trascinamento: il tap vale solo se il pan
	// non si è mai attivato in questo tocco. onBegin = dito giù, onStart = superati 10 pt.
	const dragged = useSharedValue(false);
	const pressIfNotDragged = () => {
		if (interactive && !dragged.get()) onPress?.();
	};

	const pan = Gesture.Pan()
		.enabled(enabled && interactive)
		.minDistance(10)
		.onBegin(() => {
			dragged.set(false);
		})
		.onStart(() => {
			dragged.set(true);
		})
		.onUpdate((e) => {
			if (flying.get()) return;
			tx.set(e.translationX);
			ty.set(e.translationY);
			rotation.set(rotationFor(e.translationX, width));
		})
		.onEnd((e) => {
			if (flying.get()) return;
			const action = swipeDecision(e.translationX, e.translationY, width, height);
			if (action) {
				leave(action, 'swipe');
			} else {
				tx.set(withSpring(0));
				ty.set(withSpring(0));
				rotation.set(withSpring(0));
			}
		});

	const cardStyle = useAnimatedStyle(() => ({
		zIndex: 100 - depth,
		transform: [
			{ translateX: tx.get() },
			{ translateY: ty.get() },
			{ rotate: `${restingRotation + rotation.get()}deg` },
		],
	}));
	const yep = useAnimatedStyle(() => ({
		opacity: labelOpacities(tx.get(), ty.get(), width, height).yep,
	}));
	const nope = useAnimatedStyle(() => ({
		opacity: labelOpacities(tx.get(), ty.get(), width, height).nope,
	}));
	const saved = useAnimatedStyle(() => ({
		opacity: labelOpacities(tx.get(), ty.get(), width, height).saved,
	}));

	return (
		<GestureDetector gesture={pan}>
			<Animated.View style={cardStyle} className="absolute w-full">
				<Pressable
					onPress={pressIfNotDragged}
					accessibilityRole="button"
					accessibilityLabel={accessibilityLabel}
					accessibilityElementsHidden={!interactive}
					importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}>
					{children}
					<Animated.View style={yep} className="absolute top-4 left-4" pointerEvents="none">
						<SwipeLabel kind="yep" />
					</Animated.View>
					<Animated.View style={nope} className="absolute top-4 right-4" pointerEvents="none">
						<SwipeLabel kind="nope" />
					</Animated.View>
					<Animated.View
						style={saved}
						className="absolute top-4 right-0 left-0 items-center"
						pointerEvents="none">
						<SwipeLabel kind="saved" />
					</Animated.View>
				</Pressable>
			</Animated.View>
		</GestureDetector>
	);
});
