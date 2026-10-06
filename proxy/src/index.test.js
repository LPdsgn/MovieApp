// Test con il runner di Node: niente dipendenze. Importa il .ts grazie al type stripping di Node 22.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import worker, { upstream } from './index.ts';

const env = { TMDB_TOKEN: '0123456789abcdef0123456789abcdef' };
const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

test('upstream accetta solo /3/movie/{id}', () => {
	assert.equal(
		upstream(new URL('https://p/3/movie/597')).toString(),
		'https://api.themoviedb.org/3/movie/597'
	);
	assert.equal(upstream(new URL('https://p/3/movie/597/images')), null);
	assert.equal(upstream(new URL('https://p/3/search/movie?query=x')), null);
	assert.equal(upstream(new URL('https://p/3/movie/abc')), null);
});

test('upstream filtra lingua e append_to_response', () => {
	const url = new URL(
		'https://p/3/movie/597?language=it-IT&append_to_response=credits,images,watch/providers&api_key=x'
	);
	assert.equal(
		upstream(url).toString(),
		'https://api.themoviedb.org/3/movie/597?language=it-IT&append_to_response=credits%2Cwatch%2Fproviders'
	);
	assert.equal(upstream(new URL('https://p/3/movie/597?language=fr-FR')).search, '');
});

test('fetch rifiuta metodi e percorsi non previsti senza chiamare TMDB', async () => {
	globalThis.fetch = () => assert.fail('TMDB non va chiamato');
	const post = await worker.fetch(new Request('https://p/3/movie/597', { method: 'POST' }), env);
	assert.equal(post.status, 405);
	const other = await worker.fetch(new Request('https://p/3/search/movie'), env);
	assert.equal(other.status, 404);
});

test('fetch aggiunge la chiave v3 e passa lo status di TMDB', async () => {
	let called;
	globalThis.fetch = async (target) => {
		called = new URL(target);
		return new Response('{"id":597}', { status: 200 });
	};
	const res = await worker.fetch(new Request('https://p/3/movie/597?language=it-IT'), env);
	assert.equal(called.searchParams.get('api_key'), env.TMDB_TOKEN);
	assert.equal(called.searchParams.get('language'), 'it-IT');
	assert.equal(res.status, 200);
	assert.equal(res.headers.get('cache-control'), 'public, max-age=86400');
	assert.deepEqual(await res.json(), { id: 597 });
});

test('fetch usa il bearer con un token v4', async () => {
	let headers;
	globalThis.fetch = async (target, init) => {
		headers = init.headers;
		assert.equal(new URL(target).searchParams.has('api_key'), false);
		return new Response('{}', { status: 404 });
	};
	const res = await worker.fetch(new Request('https://p/3/movie/1'), {
		TMDB_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.x.y',
	});
	assert.equal(headers.get('authorization'), 'Bearer eyJhbGciOiJIUzI1NiJ9.x.y');
	assert.equal(res.status, 404);
});
