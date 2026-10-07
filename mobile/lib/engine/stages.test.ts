import type { Neighbor } from '@/lib/artifact/blob';

import {
	type CatalogEntry,
	type Features,
	isReleased,
	jaccard,
	pickCards,
	prior,
	rank,
	rerank,
	retrieve,
} from './stages';

const entry = (
	qid: number,
	sitelinks = 50,
	released: string | null = '2000-01-01'
): CatalogEntry => ({
	qid,
	tmdbId: qid * 10,
	sitelinks,
	released,
});
const catalog = new Map([1, 2, 3, 4, 5, 6].map((q) => [q, entry(q)]));

// Generatore deterministico: restituisce in sequenza i valori dati, poi 0.5.
const seq = (...values: number[]) => {
	let i = 0;
	return () => values[i++] ?? 0.5;
};

describe('retrieve', () => {
	const neighborsOf = new Map<number, Neighbor[]>([
		[
			1,
			[
				{ qid: 2, score: 0.5 },
				{ qid: 3, score: 0.2 },
			],
		],
		[
			4,
			[
				{ qid: 2, score: 0.4 },
				{ qid: 5, score: 0.3 },
			],
		],
	]);

	test('somma voto × similarità e aggiunge i popolari a zero, senza i già visti', () => {
		const votes = new Map([
			[1, 1],
			[4, -1],
		]);
		const out = retrieve(votes, neighborsOf, [3, 6, 1], new Set([1, 4]));
		expect(Object.fromEntries(out)).toEqual({ 2: expect.closeTo(0.1, 6), 3: 0.2, 5: -0.3, 6: 0 });
	});

	test('senza voti restano solo i popolari', () => {
		expect([...retrieve(new Map(), neighborsOf, [6, 3], new Set([3])).keys()]).toEqual([6]);
	});
});

describe('rank', () => {
	test('prior logaritmico in [0, 1]', () => {
		expect(prior(1, 169)).toBe(0);
		expect(prior(169, 169)).toBe(1);
		expect(prior(13, 169)).toBeGreaterThan(0.4);
		expect(prior(13, 169)).toBeLessThan(prior(26, 169));
	});

	test('ordina per affinità + λ·prior e scarta i qid fuori catalogo', () => {
		const affinity = new Map([
			[1, 0.1],
			[2, 0.1],
			[3, 0.5],
			[99, 9],
		]);
		const cat = new Map([
			[1, entry(1, 10)],
			[2, entry(2, 160)],
			[3, entry(3, 10)],
		]);
		expect(rank(affinity, cat, 169).map((r) => r.qid)).toEqual([3, 2, 1]);
	});
});

describe('rerank', () => {
	test('isReleased: data nota e non futura', () => {
		expect(isReleased(entry(1, 10, '2026-10-07'), '2026-10-07')).toBe(true);
		expect(isReleased(entry(1, 10, '2026-10-08'), '2026-10-07')).toBe(false);
		expect(isReleased(entry(1, 10, null), '2026-10-07')).toBe(false);
	});

	test('jaccard', () => {
		expect(jaccard(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3);
		expect(jaccard(new Set(), new Set(['a']))).toBe(0);
	});

	test('mai due film della stessa saga di fila, se c’è un’alternativa', () => {
		const features = new Map<number, Features>([
			[1, { P179: [100] }],
			[2, { P179: [100] }],
			[3, { P179: [200] }],
		]);
		const ranked = [
			{ qid: 1, score: 1 },
			{ qid: 2, score: 0.9 },
			{ qid: 3, score: 0.1 },
		];
		expect(rerank(ranked, features, 3, 1)).toEqual([1, 3, 2]);
		// senza alternativa la regola cede
		expect(rerank(ranked.slice(0, 2), features, 2, 1)).toEqual([1, 2]);
	});

	test('MMR preferisce un candidato diverso a un quasi-duplicato', () => {
		const features = new Map<number, Features>([
			[1, { P136: [1, 2], P57: [7] }],
			[2, { P136: [1, 2], P57: [7] }], // identico a 1
			[3, { P136: [3], P57: [8] }], // tutto diverso
			[4, { P136: [4] }],
		]);
		const ranked = [
			{ qid: 1, score: 1 },
			{ qid: 2, score: 0.9 },
			{ qid: 3, score: 0.85 },
			{ qid: 4, score: 0.1 },
		];
		expect(rerank(ranked, features, 2, 0.7)).toEqual([1, 3]);
		expect(rerank(ranked, features, 2, 1)).toEqual([1, 2]); // λ=1: solo pertinenza
	});

	test('vuoto e n=0', () => {
		expect(rerank([], new Map(), 3)).toEqual([]);
		expect(rerank([{ qid: 1, score: 1 }], new Map(), 0)).toEqual([]);
	});
});

describe('pickCards', () => {
	test('sfruttamento con rng alto, esplorazione con rng basso, propensità coerenti', () => {
		const cards = pickCards([1, 2, 3], [8, 9], 3, seq(0.9, 0.05, 0.99, 0.9), 0.1);
		expect(cards.map((c) => c.qid)).toEqual([1, 9, 2]);
		expect(cards.map((c) => c.propensity)).toEqual([0.9, 0.1, 0.9]);
		expect(cards.map((c) => c.explored)).toEqual([false, true, false]);
	});

	test('senza ranking pesca dal serbatoio; senza nulla restituisce meno carte', () => {
		expect(
			pickCards([], [8, 9], 2, seq(0, 0.5))
				.map((c) => c.qid)
				.sort()
		).toEqual([8, 9]);
		expect(pickCards([1], [], 3)).toHaveLength(1);
	});

	test('il serbatoio non ripropone carte già nel ranking', () => {
		const cards = pickCards([1, 2], [1, 2], 4, seq(0.9, 0.9), 0.1);
		expect(cards.map((c) => c.qid)).toEqual([1, 2]);
	});
});

describe('coerenza con docs/campioni-vicini.md', () => {
	// Vicini di Titanic (Q44578) nel catalogo completo, come misurati il 07/10/2026.
	const titanicNeighbors: Neighbor[] = [
		{ qid: 983912, score: 0.18 }, // Ghosts of the Abyss
		{ qid: 2407956, score: 0.148 }, // Aliens of the Deep
		{ qid: 110397, score: 0.103 }, // True Lies
		{ qid: 29580929, score: 0.089 }, // Avatar: Fire and Ash
		{ qid: 3604746, score: 0.081 }, // Avatar: The Way of Water
		{ qid: 104814, score: 0.08 }, // Aliens
	];
	const cat = new Map(titanicNeighbors.map((n) => [n.qid, entry(n.qid, 40)]));

	test('un like a Titanic porta in testa Ghosts of the Abyss', () => {
		const affinity = retrieve(
			new Map([[44578, 1]]),
			new Map([[44578, titanicNeighbors]]),
			[],
			new Set([44578])
		);
		expect(rank(affinity, cat, 169)[0].qid).toBe(983912);
	});

	test('un dislike a Titanic manda in coda i film di Cameron, sotto i popolari', () => {
		const popular = new Map([[597, entry(597, 169)]]);
		const affinity = retrieve(
			new Map([[44578, -1]]),
			new Map([[44578, titanicNeighbors]]),
			[597],
			new Set([44578])
		);
		const ranked = rank(affinity, new Map([...cat, ...popular]), 169);
		expect(ranked[0].qid).toBe(597);
		expect(ranked.at(-1)!.qid).toBe(983912);
	});
});
