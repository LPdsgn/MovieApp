import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BookmarkIcon, HeartIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { CircleButton } from '@/components/movie/circle-button';
import { MovieCard, MovieCardError, MovieCardSkeleton } from '@/components/movie/movie-card';
import { SwipeCard, type SwipeCardHandle } from '@/components/movie/swipe-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { restingRotation } from '@/lib/deck/swipe';
import { useDeck } from '@/lib/deck/use-deck';
import type { Recommendation } from '@/lib/engine';
import { t } from '@/lib/i18n';
import { useMovie } from '@/lib/tmdb/hooks';
import type { Action, Source } from '@/lib/userdb';
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

	const onSwipe = async (card: Recommendation, action: Action, source: Source) => {
		setBusy(true);
		Haptics.impactAsync(HAPTIC[action]).catch(() => {});
		await deck.swipe(card, action, source);
		setBusy(false);
	};
	const press = (action: Action) => {
		if (busy || !deck.cards[0]) return;
		top.current?.fling(action);
	};

	const first = deck.cards[0];

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
			<View className="flex-1 gap-6 pt-safe-offset-14 pb-safe-offset-4">
				{/* La carta riempie l'altezza disponibile e ne deriva la larghezza (2:3), senza mai superare lo schermo. */}
				<View className="flex-1 items-center justify-center px-8">
					<View className="h-full max-w-full justify-center" style={{ aspectRatio: 2 / 3 }}>
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
						{/* Stessa key e stesso componente per tutta la vita della carta: la promozione in cima è un cambio di prop, niente smontaggio. */}
						{deck.cards.map((card, depth) => (
							<SwipeCard
								key={card.qid}
								ref={depth === 0 ? top : undefined}
								depth={depth}
								interactive={depth === 0}
								restingRotation={restingRotation(card.qid)}
								enabled={!busy}
								accessibilityLabel={t('swipe.open')}
								onPress={() =>
									router.push({
										pathname: '/movie/[tmdbId]',
										params: { tmdbId: String(card.tmdbId), qid: String(card.qid) },
									})
								}
								onSwipe={(action, source) => onSwipe(card, action, source)}>
								<Card
									card={card}
									showAdult={deck.showAdult}
									onAdult={() => deck.skip(card)}
								/>
							</SwipeCard>
						))}
					</View>
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
function Card({
	card,
	showAdult,
	onAdult,
}: {
	card: Recommendation;
	showAdult: boolean;
	onAdult: () => void;
}) {
	const movie = useMovie(card.tmdbId);
	// Rete di sicurezza: il flag adult di TMDB arriva col dettaglio e vale solo qui, a video (CLAUDE.md).
	const hide = movie.isSuccess && movie.data.adult && !showAdult;
	React.useEffect(() => {
		if (hide) onAdult();
	}, [hide, onAdult]);
	if (movie.isPending || hide) return <MovieCardSkeleton />;
	if (movie.isError)
		return <MovieCardError message={movie.error.message} onRetry={() => movie.refetch()} />;
	return <MovieCard movie={movie.data} />;
}
