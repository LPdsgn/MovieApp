/** Piattaforme di streaming dell'originale (StreamingPlatforms.swift), con gli id provider TMDB di Constants.swift. */
export const PLATFORMS = [
	{ id: 'netflix', name: 'Netflix', tmdbProviderId: 8 },
	{ id: 'prime', name: 'Prime Video', tmdbProviderId: 10 },
	{ id: 'disney', name: 'Disney+', tmdbProviderId: 337 },
	{ id: 'apple', name: 'Apple TV+', tmdbProviderId: 350 },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];

export const PLATFORMS_SETTING = 'platforms';

/** Dal valore salvato in `settings` all'insieme selezionato. Assente = tutte, come nell'originale. */
export function parsePlatforms(value: string | null): Set<PlatformId> {
	if (value === null) return new Set(PLATFORMS.map((p) => p.id));
	const known = new Set<string>(PLATFORMS.map((p) => p.id));
	return new Set(value.split(',').filter((id): id is PlatformId => known.has(id)));
}

export function serializePlatforms(selected: Set<PlatformId>): string {
	return PLATFORMS.map((p) => p.id)
		.filter((id) => selected.has(id))
		.join(',');
}
