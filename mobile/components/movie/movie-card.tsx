import * as React from 'react';
import { View } from 'react-native';

import { MovieMeta, GenreChips, StarsRating } from '@/components/movie/movie-meta';
import { PosterImage } from '@/components/movie/poster-image';
import { LinearGradient } from '@/components/styled';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import type { MovieDetails } from '@/lib/tmdb';
import { COLORS } from '@/lib/theme';

const OVERLAY = ['rgba(10,10,10,0)', 'rgba(10,10,10,0.55)', 'rgba(10,10,10,0.75)'] as const;

/** Carta del mazzo: poster 2:3, gradiente dal basso, titolo, generi, trama, durata e anno, stelle. */
export function MovieCard({ movie }: { movie: MovieDetails }) {
	return (
		<View className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-card">
			<PosterImage
				path={movie.poster_path}
				className="absolute inset-0"
				accessibilityLabel={movie.title}
			/>
			<LinearGradient
				colors={[...OVERLAY]}
				locations={[0.3, 0.7, 1]}
				className="absolute inset-0"
			/>
			<View className="flex-1 justify-end gap-2.5 p-4">
				<Text
					className="text-4xl font-semibold text-white"
					style={{
						textShadowColor: 'rgba(0,0,0,0.5)',
						textShadowRadius: 4,
						textShadowOffset: { width: 0, height: 2 },
					}}
					numberOfLines={2}>
					{movie.title}
				</Text>
				<GenreChips genres={movie.genres ?? []} />
				<Text className="text-xs text-white" numberOfLines={2}>
					{movie.overview}
				</Text>
				<MovieMeta runtime={movie.runtime} releaseDate={movie.release_date} />
				<StarsRating voteAverage={movie.vote_average} />
			</View>
		</View>
	);
}

/** Carta in caricamento: stessa sagoma, scheletri al posto dei testi. */
export function MovieCardSkeleton() {
	return (
		<View className="aspect-[2/3] w-full justify-end gap-3 overflow-hidden rounded-lg bg-card p-4">
			<Skeleton className="h-9 w-3/4" />
			<Skeleton className="h-5 w-1/3 rounded-full" />
			<Skeleton className="h-3 w-full" />
			<Skeleton className="h-3 w-5/6" />
			<Skeleton className="h-5 w-1/2" />
		</View>
	);
}

/** Carta in errore: l'errore si vede, si può riprovare o scartare. Mai un film segnaposto. */
export function MovieCardError({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<View
			className="aspect-[2/3] w-full items-center justify-center gap-4 rounded-lg bg-card p-6"
			accessibilityRole="alert"
			style={{ borderColor: COLORS.ink650, borderWidth: 1 }}>
			<Text className="text-center text-lg font-semibold text-foreground">
				{t('movie.error')}
			</Text>
			<Text className="text-center text-sm text-muted-foreground">{message}</Text>
			<Button variant="secondary" onPress={onRetry}>
				<Text>{t('common.retry')}</Text>
			</Button>
		</View>
	);
}
