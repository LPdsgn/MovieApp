// Integrazione sull'artefatto vero (assets/db/moovie.db, non in git): salta se il file manca, come in CI.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { type Db, migrate, recordEvent } from '@/lib/userdb';

import { loadCatalog, recommend } from './index';

const ARTIFACT = `${__dirname}/../../assets/db/moovie.db`;
const TITANIC = 44578;

function wrap(d: DatabaseSync): Db {
	return {
		execAsync: async (sql) => {
			d.exec(sql);
		},
		runAsync: async (sql, ...params) => d.prepare(sql).run(...params),
		getFirstAsync: async (sql, ...params) => (d.prepare(sql).get(...params) as never) ?? null,
		getAllAsync: async (sql, ...params) => d.prepare(sql).all(...params) as never,
		withTransactionAsync: async (task) => {
			d.exec('BEGIN');
			try {
				await task();
				d.exec('COMMIT');
			} catch (e) {
				d.exec('ROLLBACK');
				throw e;
			}
		},
	};
}

const maybe = existsSync(ARTIFACT) ? describe : describe.skip;

maybe('motore sull’artefatto reale', () => {
	const artifact = wrap(
		new DatabaseSync(ARTIFACT, { readOnly: true })
	) as unknown as SQLiteDatabase;
	let user: Db;
	beforeEach(async () => {
		user = wrap(new DatabaseSync(':memory:'));
		await migrate(user);
	});
	const seq = (...v: number[]) => {
		let i = 0;
		return () => v[i++] ?? 0.99;
	};

	test('a freddo propone film popolari, usciti e tutti diversi', async () => {
		const catalog = await loadCatalog(artifact);
		expect(catalog.byQid.size).toBeGreaterThan(20000);
		const cards = await recommend(artifact, catalog, user, { n: 3, rng: seq(0.99) });
		expect(cards).toHaveLength(3);
		expect(new Set(cards.map((c) => c.qid)).size).toBe(3);
		for (const c of cards) {
			const entry = catalog.byQid.get(c.qid)!;
			expect(entry.adult).toBe(false);
			expect(entry.sitelinks).toBeGreaterThan(100);
			expect(entry.released!).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(c.propensity).toBeCloseTo(0.88);
		}
	});

	test('dopo un like a Titanic la prima carta è un vicino di Titanic e Titanic non torna', async () => {
		const catalog = await loadCatalog(artifact);
		await recordEvent(user, {
			qid: TITANIC,
			tmdbId: 597,
			action: 'like',
			source: 'swipe',
			algorithm: 'test',
			artifact: 'test',
			propensity: 1,
		});
		const cards = await recommend(artifact, catalog, user, { n: 3, rng: seq(0.99) });
		// docs/campioni-vicini.md: i primi vicini sono i film di Cameron
		expect([983912, 2407956, 110397]).toContain(cards[0].qid);
		expect(cards.map((c) => c.qid)).not.toContain(TITANIC);
	});
});
