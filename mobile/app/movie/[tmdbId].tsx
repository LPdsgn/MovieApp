import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BookmarkIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { CircleButton } from '@/components/movie/circle-button';
import { MovieCardError, MovieCardSkeleton } from '@/components/movie/movie-card';
import { GenreChips, MovieMeta, StarsRating } from '@/components/movie/movie-meta';
import { PosterImage } from '@/components/movie/poster-image';
import { LinearGradient } from '@/components/styled';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { readMeta } from '@/lib/artifact';
import { ENGINE } from '@/lib/engine';
import { t } from '@/lib/i18n';
import { useMovie } from '@/lib/tmdb/hooks';
import { COLORS } from '@/lib/theme';
import { isInWatchlist, recordEvent, removeFromWatchlist } from '@/lib/userdb';
import { useUserDb } from '@/lib/userdb/provider';

/** Quanto poster resta visibile sopra il contenuto, come nell'originale (300 pt). */
const POSTER_VISIBLE = 300;

/**
 * Dettaglio come `MovieDetails.swift`: poster a tutta larghezza con gradiente trasparente → Gray-800
 * su sfondo piatto Gray-800 (non lo sfondo a gradiente delle altre schermate: si vedrebbe lo stacco),
 * contenuto che parte a 300 pt sovrapponendosi al poster. A differenza dell'originale poster e gradiente
 * scorrono con il contenuto, altrimenti il testo finisce sull'immagine nuda e non si legge.
 * Cast e provider arrivano con il task successivo.
 */
export default function MovieScreen() {
	const { tmdbId, qid } = useLocalSearchParams<{ tmdbId: string; qid?: string }>();
	const router = useRouter();
	const movie = useMovie(Number(tmdbId));
	const { width } = useWindowDimensions();
	const posterHeight = (width * 3) / 2;

	return (
		<View className="flex-1 bg-background">
			{/* Maniglia disegnata: il page sheet non ne ha una propria. */}
			<View className="absolute top-2 left-1/2 z-10 h-1.5 w-9 -translate-x-1/2 rounded-full bg-white/40" />
			<Pressable
				onPress={() => router.back()}
				accessibilityRole="button"
				accessibilityLabel={t('common.close')}
				hitSlop={12}
				className="absolute top-5 right-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40">
				<Icon as={XIcon} className="text-white" size={20} />
			</Pressable>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
				{movie.isPending && (
					<View className="px-4 pt-8">
						<MovieCardSkeleton />
					</View>
				)}
				{movie.isError && (
					<View className="px-4 pt-8">
						<MovieCardError message={movie.error.message} onRetry={() => movie.refetch()} />
					</View>
				)}
				{movie.isSuccess && (
					<View style={{ height: posterHeight }}>
						<PosterImage
							path={movie.data.poster_path}
							className="absolute inset-0 aspect-auto"
							accessibilityLabel={movie.data.title}
						/>
						<LinearGradient
							colors={['transparent', COLORS.ink800, COLORS.ink800]}
							locations={[0.25, 0.7, 1]}
							className="absolute inset-0"
						/>
					</View>
				)}
				{movie.isSuccess && (
					<View className="gap-4 px-4" style={{ marginTop: -(posterHeight - POSTER_VISIBLE) }}>
						<Text
							className="text-4xl font-semibold text-white"
							style={{
								textShadowColor: 'rgba(0,0,0,0.5)',
								textShadowRadius: 4,
								textShadowOffset: { width: 0, height: 2 },
							}}>
							{movie.data.title}
						</Text>
						<View className="flex-row items-center">
							<View className="flex-1 gap-4">
								<GenreChips genres={movie.data.genres ?? []} />
								<MovieMeta
									runtime={movie.data.runtime}
									releaseDate={movie.data.release_date}
								/>
								<StarsRating voteAverage={movie.data.vote_average} />
							</View>
							<BookmarkButton tmdbId={Number(tmdbId)} qid={qid ? Number(qid) : null} />
						</View>
						<Text className="pt-2 text-base text-white">{movie.data.overview}</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

/** Segnalibro 75 pt: primario se il film è in watchlist. Aggiungere produce un evento `watchlist` da `detail`. */
function BookmarkButton({ tmdbId, qid }: { tmdbId: number; qid: number | null }) {
	const user = useUserDb();
	const artifact = useSQLiteContext();
	const [saved, setSaved] = React.useState<boolean | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		(qid !== null ? isInWatchlist(user, qid) : Promise.resolve(false)).then((v) => {
			if (!cancelled) setSaved(v);
		});
		return () => {
			cancelled = true;
		};
	}, [user, qid]);

	if (qid === null || saved === null) return null;

	const toggle = async () => {
		if (saved) {
			await removeFromWatchlist(user, qid);
			setSaved(false);
		} else {
			const meta = await readMeta(artifact);
			await recordEvent(user, {
				qid,
				tmdbId,
				action: 'watchlist',
				source: 'detail',
				algorithm: ENGINE.algorithm,
				artifact: meta.dataVersion,
				propensity: null,
			});
			setSaved(true);
		}
	};

	return (
		<CircleButton
			icon={BookmarkIcon}
			size={75}
			variant={saved ? 'primary' : 'secondary'}
			accessibilityLabel={saved ? t('movie.unbookmark') : t('movie.bookmark')}
			onPress={toggle}
		/>
	);
}
