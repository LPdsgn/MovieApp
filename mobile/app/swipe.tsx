import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BookmarkIcon, HeartIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { CircleButton } from '@/components/movie/circle-button';
import { MovieCard, MovieCardError, MovieCardSkeleton } from '@/components/movie/movie-card';
import { DeckCard, SwipeCard, type SwipeCardHandle } from '@/components/movie/swipe-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { restingRotation } from '@/lib/deck/swipe';
import { useDeck } from '@/lib/deck/use-deck';
import type { Recommendation } from '@/lib/engine';
import { t } from '@/lib/i18n';
import { useMovie } from '@/lib/tmdb/hooks';
import type { Action } from '@/lib/userdb';
import { useUserDb } from '@/lib/userdb/provider';

const HAPTIC: Record<Action, Haptics.ImpactFeedbackStyle> = {
	dislike: Haptics.ImpactFeedbackStyle.Soft,
	like: Haptics.ImpactFeedbackStyle.Heavy,
	watchlist: Haptics.ImpactFeedbackStyle.Heavy,
};

/** Il mazzo, a schermo intero: tre carte, gesti, bottoni. Lo swipe si salva prima della carta successiva. */
export default function SwipeScreen() {
	const router = useRouter();
	const artifact = useSQLiteContext();
	const user = useUserDb();
	const deck = useDeck(artifact, user);
	const top = React.useRef<SwipeCardHandle>(null);
	const [busy, setBusy] = React.useState(false);

	const onSwipe = async (card: Recommendation, action: Action, source: 'swipe' | 'button') => {
		setBusy(true);
		Haptics.impactAsync(HAPTIC[action]).catch(() => {});
		await deck.swipe(card, action, source);
		setBusy(false);
	};
	const press = (action: Action) => {
		if (busy || !deck.cards[0]) return;
		top.current?.fling(action);
	};

	const [first, ...behind] = deck.cards;

	return (
		<Screen>
			<Stack.Screen
				options={{
					title: '',
					headerLargeTitle: false,
					headerRight: () => (
						<Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
							<Text className="text-base font-semibold text-primary">
								{t('common.close')}
							</Text>
						</Pressable>
					),
				}}
			/>
			<View className="flex-1 justify-center gap-6 px-4 pt-safe">
				<View className="aspect-[2/3] w-full justify-center">
					{deck.status === 'loading' && <MovieCardSkeleton />}
					{deck.status === 'error' && (
						<MovieCardError
							message={deck.error?.message ?? t('discover.error')}
							onRetry={deck.reload}
						/>
					)}
					{deck.status === 'ready' && !first && (
						<View className="aspect-[2/3] w-full items-center justify-center rounded-lg bg-card p-6">
							<Text className="text-center text-lg text-muted-foreground">
								{t('swipe.empty')}
							</Text>
							<Button variant="secondary" className="mt-4" onPress={deck.reload}>
								<Text>{t('common.retry')}</Text>
							</Button>
						</View>
					)}
					{[...behind].reverse().map((card) => (
						<DeckCard key={card.qid} restingRotation={restingRotation(card.qid)}>
							<Card card={card} />
						</DeckCard>
					))}
					{first && (
						<SwipeCard
							key={first.qid}
							ref={top}
							restingRotation={restingRotation(first.qid)}
							enabled={!busy}
							accessibilityLabel={t('swipe.open')}
							onPress={() =>
								router.push({
									pathname: '/movie/[tmdbId]',
									params: { tmdbId: String(first.tmdbId) },
								})
							}
							onSwipe={(action) => onSwipe(first, action, 'swipe')}>
							<Card card={first} />
						</SwipeCard>
					)}
				</View>

				<View className="flex-row items-start justify-between px-6">
					<CircleButton
						icon={XIcon}
						size={60}
						accessibilityLabel={t('swipe.discard')}
						onPress={() => press('dislike')}
					/>
					<CircleButton
						icon={BookmarkIcon}
						size={75}
						variant="primary"
						className="mt-4"
						accessibilityLabel={t('swipe.save')}
						onPress={() => press('watchlist')}
					/>
					<CircleButton
						icon={HeartIcon}
						size={60}
						accessibilityLabel={t('swipe.like')}
						onPress={() => press('like')}
					/>
				</View>
			</View>
		</Screen>
	);
}

/** Dati TMDB della carta: scheletro mentre carica, errore esplicito con riprova, altrimenti la carta. */
function Card({ card }: { card: Recommendation }) {
	const movie = useMovie(card.tmdbId);
	if (movie.isPending) return <MovieCardSkeleton />;
	if (movie.isError)
		return <MovieCardError message={movie.error.message} onRetry={() => movie.refetch()} />;
	return <MovieCard movie={movie.data} />;
}
