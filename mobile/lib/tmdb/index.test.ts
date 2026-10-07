import {
	directors,
	fetchMovie,
	imageUrl,
	type MovieDetails,
	movieUrl,
	providersFor,
	shouldRetry,
	TmdbError,
	toLanguage,
	topCast,
} from './index';

const movie = {
	id: 597,
	title: 'Titanic',
	credits: {
		cast: [
			{ id: 2, name: 'Kate Winslet', character: 'Rose', profile_path: null, order: 1 },
			{ id: 1, name: 'Leonardo DiCaprio', character: 'Jack', profile_path: '/l.jpg', order: 0 },
		],
		crew: [
			{ id: 3, name: 'James Cameron', job: 'Director', profile_path: null },
			{ id: 3, name: 'James Cameron', job: 'Writer', profile_path: null },
		],
	},
	'watch/providers': {
		results: {
			IT: { link: 'https://justwatch/it', flatrate: [] },
			US: { link: 'https://justwatch/us' },
		},
	},
} as unknown as MovieDetails;

const respond = (status: number, body: unknown): typeof fetch =>
	(async () =>
		new Response(JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' },
		})) as unknown as typeof fetch;

test('movieUrl passa dal proxy con lingua e append consentiti', () => {
	expect(movieUrl(597, 'it', 'https://p.example')).toBe(
		'https://p.example/3/movie/597?language=it-IT&append_to_response=credits%2Cwatch%2Fproviders'
	);
});

test('toLanguage riconosce it, en, de e ripiega su en', () => {
	expect(toLanguage('it')).toBe('it');
	expect(toLanguage('de')).toBe('de');
	expect(toLanguage('fr')).toBe('en');
	expect(toLanguage(null)).toBe('en');
});

test('fetchMovie restituisce il JSON e lancia TmdbError con lo status', async () => {
	await expect(fetchMovie(597, 'it', respond(200, movie))).resolves.toMatchObject({ id: 597 });
	await expect(fetchMovie(0, 'it', respond(404, {}))).rejects.toMatchObject({
		name: 'TmdbError',
		status: 404,
		tmdbId: 0,
	});
});

test('shouldRetry: mai sui 4xx, al massimo due volte sul resto', () => {
	expect(shouldRetry(0, new TmdbError(404, 1))).toBe(false);
	expect(shouldRetry(0, new TmdbError(503, 1))).toBe(true);
	expect(shouldRetry(0, new TypeError('rete'))).toBe(true);
	expect(shouldRetry(2, new TypeError('rete'))).toBe(false);
});

test('helper per la UI', () => {
	expect(imageUrl('/a.jpg')).toBe('https://image.tmdb.org/t/p/w500/a.jpg');
	expect(imageUrl('/a.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/a.jpg');
	expect(imageUrl(null)).toBeNull();
	expect(providersFor(movie, 'it')?.link).toBe('https://justwatch/it');
	expect(providersFor(movie, 'de')).toBeNull();
	expect(directors(movie).map((d) => d.name)).toEqual(['James Cameron']);
	expect(topCast(movie, 1).map((c) => c.name)).toEqual(['Leonardo DiCaprio']);
});
