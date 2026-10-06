/**
 * Proxy TMDB su Cloudflare Workers: tiene la chiave fuori dal client.
 *
 * Inoltra solo i percorsi che l'app usa e solo i parametri previsti: senza lista chiusa
 * sarebbe un relay TMDB aperto a chiunque trovi l'URL, con la nostra quota.
 */

export interface Env {
	/** Chiave v3 (32 esadecimali) o token di lettura v4 (JWT). */
	TMDB_TOKEN: string;
}

const TMDB = 'https://api.themoviedb.org';
const ALLOWED_PATHS = [/^\/3\/movie\/\d+$/];
const ALLOWED_APPEND = new Set(['credits', 'watch/providers']);
const LANGUAGES = new Set(['it-IT', 'en-US', 'de-DE']);
// Un giorno: l'edge assorbe le richieste ripetute e restiamo lontani dai 6 mesi dei termini TMDB.
const CACHE_SECONDS = 86_400;

/** URL TMDB da chiamare per una richiesta in ingresso, o null se non è ammessa. */
export function upstream(url: URL): URL | null {
	if (!ALLOWED_PATHS.some((re) => re.test(url.pathname))) return null;
	const target = new URL(url.pathname, TMDB);
	const language = url.searchParams.get('language');
	if (language && LANGUAGES.has(language)) target.searchParams.set('language', language);
	const append = (url.searchParams.get('append_to_response') ?? '')
		.split(',')
		.filter((part) => ALLOWED_APPEND.has(part));
	if (append.length) target.searchParams.set('append_to_response', append.join(','));
	return target;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'GET') return new Response(null, { status: 405 });
		const target = upstream(new URL(request.url));
		if (!target) return new Response(null, { status: 404 });

		const headers = new Headers({ accept: 'application/json' });
		if (env.TMDB_TOKEN.startsWith('eyJ'))
			headers.set('authorization', `Bearer ${env.TMDB_TOKEN}`);
		else target.searchParams.set('api_key', env.TMDB_TOKEN);

		const response = await fetch(target, {
			headers,
			cf: { cacheEverything: true, cacheTtl: CACHE_SECONDS },
		});
		// Status TMDB passato così com'è: un 404 o un 401 devono arrivare espliciti all'app.
		return new Response(response.body, {
			status: response.status,
			headers: {
				'content-type': 'application/json',
				'cache-control': `public, max-age=${CACHE_SECONDS}`,
				'access-control-allow-origin': '*',
			},
		});
	},
};
