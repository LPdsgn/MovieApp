/** Formattazioni dell'originale: "1h40m" e l'anno dalla data di uscita. */

export function formatRuntime(minutes: number | null | undefined): string {
	if (!minutes || minutes <= 0) return '-';
	return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}

export function yearOf(releaseDate: string | null | undefined): string {
	const year = releaseDate?.slice(0, 4);
	return year && /^\d{4}$/.test(year) ? year : '-';
}

/** Stelle piene su 5 dal voto TMDB su 10, come `StarsRating` dell'originale. */
export function starsOf(voteAverage: number | null | undefined): number {
	if (!voteAverage) return 0;
	return Math.min(5, Math.max(0, Math.round(voteAverage / 2)));
}
