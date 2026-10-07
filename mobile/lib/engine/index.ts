/**
 * Orchestrazione del motore: carica i dati da artefatto e database utente e chiama gli stadi puri.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { getFeaturesFor, getNeighbors } from '@/lib/artifact';
import type { Neighbor } from '@/lib/artifact/blob';
import { type Db, getSeenQids, getVotes } from '@/lib/userdb';

import {
	type Card,
	type CatalogEntry,
	ENGINE,
	isReleased,
	pickCards,
	rank,
	rerank,
	retrieve,
} from './stages';

export { type Card, ENGINE } from './stages';

export interface Catalog {
	byQid: Map<number, CatalogEntry>;
	/** I `ENGINE.poolSize` film con più sitelink, dal più popolare. */
	popular: number[];
	maxSitelinks: number;
}

/** Tutto il catalogo in memoria: ~28.600 voci, poche MB. Si carica una volta per sessione. */
export async function loadCatalog(artifact: SQLiteDatabase): Promise<Catalog> {
	const rows = await artifact.getAllAsync<CatalogEntry>(
		'SELECT qid, tmdb_id AS tmdbId, sitelinks, released FROM movies ORDER BY sitelinks DESC, qid'
	);
	return {
		byQid: new Map(rows.map((r) => [r.qid, r])),
		popular: rows.slice(0, ENGINE.poolSize).map((r) => r.qid),
		maxSitelinks: rows[0]?.sitelinks ?? 1,
	};
}

export interface RecommendOptions {
	/** Quante carte. */
	n: number;
	/** ISO YYYY-MM-DD; default oggi. */
	today?: string;
	/** Per i test. */
	rng?: () => number;
}

export interface Recommendation extends Card {
	tmdbId: number;
}

/** `(artefatto, eventi utente) → prossime carte`, già escluse quelle viste e non uscite. */
export async function recommend(
	artifact: SQLiteDatabase,
	catalog: Catalog,
	user: Db,
	{ n, today = new Date().toISOString().slice(0, 10), rng }: RecommendOptions
): Promise<Recommendation[]> {
	const [votes, seen] = await Promise.all([getVotes(user), getSeenQids(user)]);

	const neighborsOf = new Map<number, Neighbor[]>();
	for (const qid of votes.keys()) neighborsOf.set(qid, await getNeighbors(artifact, qid));

	const eligible = (qid: number) => {
		const entry = catalog.byQid.get(qid);
		return !!entry && isReleased(entry, today);
	};
	const affinity = retrieve(votes, neighborsOf, catalog.popular, seen);
	const shortlist = rank(affinity, catalog.byQid, catalog.maxSitelinks)
		.filter((r) => eligible(r.qid))
		.slice(0, ENGINE.shortlist);
	const features = await getFeaturesFor(
		artifact,
		shortlist.map((r) => r.qid)
	);
	const ordered = rerank(shortlist, features, n);
	const pool = catalog.popular.filter((q) => !seen.has(q) && eligible(q));

	return pickCards(ordered, pool, n, rng).map((card) => ({
		...card,
		tmdbId: catalog.byQid.get(card.qid)!.tmdbId,
	}));
}
