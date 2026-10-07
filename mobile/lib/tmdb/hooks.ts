import { QueryClient, useQuery } from '@tanstack/react-query';
import { getLocales } from 'expo-localization';

import { fetchMovie, type Language, shouldRetry, toLanguage } from './index';

const DAY = 24 * 60 * 60 * 1000;

/** Cache solo in memoria: niente persistenza, per i termini TMDB (6 mesi) e per la regola "su disco solo id". */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: DAY, gcTime: DAY, retry: shouldRetry },
	},
});

/** Lingua dell'app dalla lingua del dispositivo; ripiega su en. */
export function deviceLanguage(): Language {
	return toLanguage(getLocales()[0]?.languageCode);
}

export const movieQueryKey = (tmdbId: number, language: Language) =>
	['tmdb', 'movie', tmdbId, language] as const;

export function useMovie(tmdbId: number | null, language: Language = deviceLanguage()) {
	return useQuery({
		queryKey: movieQueryKey(tmdbId ?? 0, language),
		queryFn: () => fetchMovie(tmdbId!, language),
		enabled: tmdbId !== null,
	});
}

/** Scarica in anticipo le carte che stanno dietro a quella visibile. */
export function prefetchMovie(tmdbId: number, language: Language = deviceLanguage()) {
	return queryClient.prefetchQuery({
		queryKey: movieQueryKey(tmdbId, language),
		queryFn: () => fetchMovie(tmdbId, language),
	});
}
