/**
 * Motore di raccomandazione v1: quattro funzioni pure, `(artefatto, eventi) → prossime carte`.
 * Niente I/O qui: i dati li carica `index.ts`. Motivazioni in docs/valutazione-strategie-ml.md.
 */

import type { Neighbor } from '@/lib/artifact/blob';

export const ENGINE = {
	/** Finisce in ogni evento: distingue i log quando il motore cambia. */
	algorithm: 'v1-tfidf-knn',
	/** Probabilità che una carta arrivi dal serbatoio dei popolari invece che dal ranking. */
	epsilon: 0.12,
	/** Peso del prior di popolarità nel ranking: decide le prime carte, poi fa da spareggio. */
	lambdaPrior: 0.1,
	/** MMR: 1 = solo pertinenza, 0 = solo diversità. */
	mmrLambda: 0.7,
	/** Film più popolari per sitelink che fanno da serbatoio (prime carte, esplorazione). */
	poolSize: 300,
	/** Candidati che passano dal ranking al riordino, per cui si caricano le feature. */
	shortlist: 60,
} as const;

export interface CatalogEntry {
	qid: number;
	tmdbId: number;
	sitelinks: number;
	/** ISO YYYY-MM-DD; null = sconosciuta, trattata come non uscito. */
	released: string | null;
	/** Generi Wikidata per adulti: escluso salvo impostazione. */
	adult: boolean;
}

/** { P136: [qid, ...], P179: [...] } */
export type Features = Record<string, number[]>;

export interface Ranked {
	qid: number;
	score: number;
}

export interface Card {
	qid: number;
	/** Probabilità con cui la carta è stata scelta: 1−ε se dal ranking, ε se esplorazione. */
	propensity: number;
	explored: boolean;
}

// --- 1. Retrieval ----------------------------------------------------------

/**
 * Candidati con la loro affinità: Σ voto × similarità sui vicini dei film votati,
 * più il serbatoio dei popolari ad affinità 0. I film già visti sono esclusi.
 */
export function retrieve(
	votes: Map<number, number>,
	neighborsOf: Map<number, Neighbor[]>,
	popular: number[],
	seen: Set<number>
): Map<number, number> {
	const affinity = new Map<number, number>();
	for (const [qid, vote] of votes) {
		for (const { qid: n, score } of neighborsOf.get(qid) ?? []) {
			if (seen.has(n)) continue;
			affinity.set(n, (affinity.get(n) ?? 0) + vote * score);
		}
	}
	for (const qid of popular) {
		if (!seen.has(qid) && !affinity.has(qid)) affinity.set(qid, 0);
	}
	return affinity;
}

// --- 2. Ranking ------------------------------------------------------------

/** Prior di popolarità in [0, 1], logaritmico: la differenza fra 10 e 20 sitelink conta più di quella fra 150 e 160. */
export function prior(sitelinks: number, maxSitelinks: number): number {
	if (maxSitelinks <= 1 || sitelinks <= 1) return 0;
	return Math.min(1, Math.log(sitelinks) / Math.log(maxSitelinks));
}

/** `affinità + λ·prior`, dal più alto. I candidati fuori catalogo spariscono. */
export function rank(
	affinity: Map<number, number>,
	catalog: Map<number, CatalogEntry>,
	maxSitelinks: number,
	lambda: number = ENGINE.lambdaPrior
): Ranked[] {
	const out: Ranked[] = [];
	for (const [qid, a] of affinity) {
		const entry = catalog.get(qid);
		if (entry) out.push({ qid, score: a + lambda * prior(entry.sitelinks, maxSitelinks) });
	}
	return out.sort((x, y) => y.score - x.score || x.qid - y.qid);
}

// --- 3. Riordino -----------------------------------------------------------

export function isReleased(entry: CatalogEntry, today: string): boolean {
	return entry.released !== null && entry.released <= today;
}

/** Proponibile: uscito e, se per adulti, solo con l'impostazione attiva. */
export function isEligible(entry: CatalogEntry, today: string, showAdult: boolean): boolean {
	return isReleased(entry, today) && (showAdult || !entry.adult);
}

function featureSet(f: Features | undefined): Set<string> {
	const s = new Set<string>();
	for (const [p, values] of Object.entries(f ?? {})) for (const v of values) s.add(`${p}:${v}`);
	return s;
}

/** Jaccard sugli insiemi di feature: basta per la diversità, non serve il TF-IDF della pipeline. */
export function jaccard(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 || b.size === 0) return 0;
	let inter = 0;
	for (const x of a) if (b.has(x)) inter++;
	return inter / (a.size + b.size - inter);
}

function sameSaga(a: Features | undefined, b: Features | undefined): boolean {
	const sa = a?.P179;
	const sb = b?.P179;
	return !!sa && !!sb && sa.some((x) => sb.includes(x));
}

/**
 * Riordino con MMR: a ogni passo il candidato che massimizza
 * `λ·pertinenza − (1−λ)·max similarità con i già scelti`, saltando chi condivide la saga (P179)
 * con la carta precedente finché c'è un'alternativa. Restituisce al massimo `n` qid.
 */
export function rerank(
	ranked: Ranked[],
	featuresOf: Map<number, Features>,
	n: number,
	lambda: number = ENGINE.mmrLambda
): number[] {
	if (ranked.length === 0 || n <= 0) return [];
	const max = ranked[0].score;
	const min = ranked[ranked.length - 1].score;
	const relevance = (s: number) => (max === min ? 1 : (s - min) / (max - min));
	const sets = new Map(ranked.map((r) => [r.qid, featureSet(featuresOf.get(r.qid))]));

	const picked: number[] = [];
	const remaining = [...ranked];
	while (picked.length < n && remaining.length > 0) {
		const last = picked.at(-1);
		let pool = remaining;
		if (last !== undefined) {
			const other = remaining.filter(
				(r) => !sameSaga(featuresOf.get(r.qid), featuresOf.get(last))
			);
			if (other.length > 0) pool = other;
		}
		let best = pool[0];
		let bestValue = -Infinity;
		for (const r of pool) {
			let maxSim = 0;
			for (const p of picked) maxSim = Math.max(maxSim, jaccard(sets.get(r.qid)!, sets.get(p)!));
			const value = lambda * relevance(r.score) - (1 - lambda) * maxSim;
			if (value > bestValue) {
				bestValue = value;
				best = r;
			}
		}
		picked.push(best.qid);
		remaining.splice(remaining.indexOf(best), 1);
	}
	return picked;
}

// --- 4. Esplorazione -------------------------------------------------------

/**
 * ε-greedy: ogni carta viene dal riordino con probabilità 1−ε, altrimenti a caso dal serbatoio.
 * `rng` in [0, 1): iniettato per i test. Mai la stessa carta due volte.
 */
export function pickCards(
	ordered: number[],
	pool: number[],
	n: number,
	rng: () => number = Math.random,
	epsilon: number = ENGINE.epsilon
): Card[] {
	const cards: Card[] = [];
	const used = new Set<number>();
	const fromOrdered = ordered.filter((q) => !used.has(q));
	const fromPool = pool.filter((q) => !ordered.includes(q));
	while (cards.length < n && (fromOrdered.length > 0 || fromPool.length > 0)) {
		const explore = fromPool.length > 0 && (fromOrdered.length === 0 || rng() < epsilon);
		let qid: number;
		if (explore) {
			qid = fromPool.splice(Math.floor(rng() * fromPool.length), 1)[0];
		} else {
			qid = fromOrdered.shift()!;
		}
		if (used.has(qid)) continue;
		used.add(qid);
		cards.push({ qid, propensity: explore ? epsilon : 1 - epsilon, explored: explore });
	}
	return cards;
}
