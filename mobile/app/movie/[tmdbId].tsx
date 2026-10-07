import { Stack, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

import { MovieCardError, MovieCardSkeleton } from '@/components/movie/movie-card';
import { GenreChips, MovieMeta, StarsRating } from '@/components/movie/movie-meta';
import { PosterImage } from '@/components/movie/poster-image';
import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { useMovie } from '@/lib/tmdb/hooks';

/** Provvisoria: poster, titolo, generi, trama. Cast, provider e segnalibro arrivano con il task successivo. */
export default function MovieScreen() {
	const { tmdbId } = useLocalSearchParams<{ tmdbId: string }>();
	const movie = useMovie(Number(tmdbId));
	return (
		<Screen>
			<Stack.Screen options={{ title: '', headerLargeTitle: false }} />
			<ScrollView contentContainerClassName="pb-24">
				<View className="px-4 pt-safe">
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
