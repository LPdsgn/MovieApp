import { useLocalSearchParams, useRouter } from 'expo-router';
import { XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { MovieCardError, MovieCardSkeleton } from '@/components/movie/movie-card';
import { GenreChips, MovieMeta, StarsRating } from '@/components/movie/movie-meta';
import { PosterImage } from '@/components/movie/poster-image';
import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import { useMovie } from '@/lib/tmdb/hooks';

/** Provvisoria: poster, titolo, generi, trama. Cast, provider e segnalibro arrivano con il task successivo. */
export default function MovieScreen() {
	const { tmdbId } = useLocalSearchParams<{ tmdbId: string }>();
	const router = useRouter();
	const movie = useMovie(Number(tmdbId));
	return (
		<Screen>
			<Pressable
				onPress={() => router.back()}
				accessibilityRole="button"
				accessibilityLabel={t('common.close')}
				hitSlop={12}
				className="absolute top-5 right-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40">
				<Icon as={XIcon} className="text-white" size={20} />
			</Pressable>
			<ScrollView contentContainerClassName="pb-24">
				<View className="px-4 pt-8">
					{movie.isPending && <MovieCardSkeleton />}
					{movie.isError && (
						<MovieCardError message={movie.error.message} onRetry={() => movie.refetch()} />
					)}
					{movie.isSuccess && (
						<View className="gap-4">
							<PosterImage
								path={movie.data.poster_path}
								className="aspect-[2/3] w-full rounded-lg"
							/>
							<Text className="text-4xl font-semibold text-foreground">
								{movie.data.title}
							</Text>
							<GenreChips genres={movie.data.genres ?? []} />
							<MovieMeta
								runtime={movie.data.runtime}
								releaseDate={movie.data.release_date}
							/>
							<StarsRating voteAverage={movie.data.vote_average} />
							<Text className="text-base text-foreground">{movie.data.overview}</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</Screen>
	);
}
