/**
 * Client TMDB via proxy (`proxy/`): la chiave non è mai nel client.
 * Solo per la UI, solo a runtime, mai su disco: i dati vivono nella cache in memoria di TanStack Query.
 */

export const TMDB_PROXY_URL =
	process.env.EXPO_PUBLIC_TMDB_PROXY_URL ??
	'https://mooviefinder-tmdb-proxy.luigipdt-dev.workers.dev';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** Lingue dell'app e regione dei provider, come nell'originale. */
export const LANGUAGES = {
	it: { tag: 'it-IT', region: 'IT' },
	en: { tag: 'en-US', region: 'US' },
	de: { tag: 'de-DE', region: 'DE' },
} as const;
export type Language = keyof typeof LANGUAGES;

export function toLanguage(code: string | null | undefined): Language {
	return code && code in LANGUAGES ? (code as Language) : 'en';
}

// --- Tipi: solo i campi che la UI usa -------------------------------------

export interface Genre {
	id: number;
	name: string;
}
export interface CastMember {
	id: number;
	name: string;
	character: string;
	profile_path: string | null;
	order: number;
}
export interface CrewMember {
	id: number;
	name: string;
	job: string;
	profile_path: string | null;
}
export interface Provider {
	provider_id: number;
	provider_name: string;
	logo_path: string;
	display_priority: number;
}
export interface CountryProviders {
	/** Pagina JustWatch del film: l'attribuzione richiesta passa da qui. */
	link: string;
	flatrate?: Provider[];
	rent?: Provider[];
	buy?: Provider[];
}
export interface MovieDetails {
	id: number;
	title: string;
	original_title: string;
	overview: string;
	tagline: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date: string;
	runtime: number | null;
	genres: Genre[];
	vote_average: number;
	credits: { cast: CastMember[]; crew: CrewMember[] };
	'watch/providers': { results: Record<string, CountryProviders> };
}

// --- Errori espliciti -------------------------------------------------------

export class TmdbError extends Error {
	constructor(
		public readonly status: number,
		public readonly tmdbId: number
	) {
		super(`TMDB ${status} per il film ${tmdbId}`);
		this.name = 'TmdbError';
	}
}

/** Si riprova solo su errori di rete e 5xx: un 404 o un 401 non cambiano riprovando. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
	if (error instanceof TmdbError && error.status < 500) return false;
	return failureCount < 2;
}

// --- Chiamate ----------------------------------------------------------------

export function movieUrl(tmdbId: number, language: Language, base = TMDB_PROXY_URL): string {
	const url = new URL(`/3/movie/${tmdbId}`, base);
	url.searchParams.set('language', LANGUAGES[language].tag);
	url.searchParams.set('append_to_response', 'credits,watch/providers');
	return url.toString();
}

export async function fetchMovie(
	tmdbId: number,
	language: Language,
	fetchFn: typeof fetch = fetch
): Promise<MovieDetails> {
	const response = await fetchFn(movieUrl(tmdbId, language), {
		headers: { accept: 'application/json' },
	});
	if (!response.ok) throw new TmdbError(response.status, tmdbId);
	return (await response.json()) as MovieDetails;
}

// --- Helper per la UI ---------------------------------------------------------

export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original';

/** URL dell'immagine, o null se TMDB non ne ha una. Le immagini non passano dal proxy. */
export function imageUrl(
	path: string | null | undefined,
	size: PosterSize = 'w500'
): string | null {
	return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function providersFor(movie: MovieDetails, language: Language): CountryProviders | null {
	return movie['watch/providers']?.results?.[LANGUAGES[language].region] ?? null;
}

export function directors(movie: MovieDetails): CrewMember[] {
	return movie.credits?.crew?.filter((c) => c.job === 'Director') ?? [];
}

export function topCast(movie: MovieDetails, n = 10): CastMember[] {
	return [...(movie.credits?.cast ?? [])].sort((a, b) => a.order - b.order).slice(0, n);
}
