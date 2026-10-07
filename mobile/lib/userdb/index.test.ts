// SQL reale su node:sqlite (Node 22), adattato all'interfaccia Db: niente mock delle query.
import { DatabaseSync } from 'node:sqlite';

import {
	clearHistory,
	clearWatchlist,
	type Db,
	getHistory,
	getSeenQids,
	getSetting,
	getVotes,
	getWatchlist,
	isInWatchlist,
	migrate,
	MIGRATIONS,
	type NewEvent,
	recordEvent,
	removeFromWatchlist,
	resetRecommendations,
	setSetting,
} from './index';

function memoryDb(): Db {
	const d = new DatabaseSync(':memory:');
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

const base = { source: 'swipe', algorithm: 'v1', artifact: '20261006', propensity: 0.9 } as const;
const ev = (qid: number, action: NewEvent['action'], at: string): NewEvent => ({
	...base,
	qid,
	tmdbId: qid * 10,
	action,
	at,
});

let db: Db;
beforeEach(async () => {
	db = memoryDb();
	await migrate(db);
});

test('migrate porta alla versione corrente ed è idempotente', async () => {
	const v = () => db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
	expect((await v())?.user_version).toBe(MIGRATIONS.length);
	await migrate(db);
	expect((await v())?.user_version).toBe(MIGRATIONS.length);
});

test('migrate rifiuta un database più nuovo dell’app', async () => {
	await db.execAsync(`PRAGMA user_version = ${MIGRATIONS.length + 1}`);
	await expect(migrate(db)).rejects.toThrow(/versione/);
});

test('lo schema rifiuta azioni e sorgenti sconosciute', async () => {
	await expect(
		recordEvent(db, { ...ev(1, 'like', '2026-10-07T10:00:00Z'), action: 'meh' as never })
	).rejects.toThrow();
	await expect(
		recordEvent(db, { ...ev(1, 'like', '2026-10-07T10:00:00Z'), source: 'api' as never })
	).rejects.toThrow();
	expect(await getSeenQids(db)).toEqual(new Set());
});

test('storico: ultimo evento per film, dal più recente, con i tre filtri', async () => {
	await recordEvent(db, ev(1, 'like', '2026-10-07T10:00:00Z'));
	await recordEvent(db, ev(2, 'dislike', '2026-10-07T10:01:00Z'));
	await recordEvent(db, ev(3, 'watchlist', '2026-10-07T10:02:00Z'));
	await recordEvent(db, ev(1, 'dislike', '2026-10-07T10:03:00Z')); // cambia idea sul film 1

	const all = await getHistory(db);
	expect(all.map((e) => [e.qid, e.action])).toEqual([
		[1, 'dislike'],
		[3, 'watchlist'],
		[2, 'dislike'],
	]);
	expect((await getHistory(db, 'loved')).map((e) => e.qid)).toEqual([3]);
	expect((await getHistory(db, 'discarded')).map((e) => e.qid)).toEqual([1, 2]);
	expect(all[0].tmdbId).toBe(10);
});

test('lo swipe watchlist aggiunge alla watchlist nella stessa transazione', async () => {
	await recordEvent(db, ev(3, 'watchlist', '2026-10-07T10:02:00Z'));
	await recordEvent(db, ev(3, 'watchlist', '2026-10-07T11:00:00Z')); // doppio: resta una riga
	expect(await getWatchlist(db)).toEqual([
		{ qid: 3, tmdbId: 30, addedAt: '2026-10-07T10:02:00Z' },
	]);
	expect(await isInWatchlist(db, 3)).toBe(true);
	await removeFromWatchlist(db, 3);
	expect(await isInWatchlist(db, 3)).toBe(false);
	expect((await getVotes(db)).get(3)).toBe(1); // il voto resta
});

test('voti per il motore: watchlist vale +1, dislike -1, ultimo evento vince', async () => {
	await recordEvent(db, ev(1, 'like', '2026-10-07T10:00:00Z'));
	await recordEvent(db, ev(2, 'dislike', '2026-10-07T10:01:00Z'));
	await recordEvent(db, ev(3, 'watchlist', '2026-10-07T10:02:00Z'));
	await recordEvent(db, ev(1, 'dislike', '2026-10-07T10:03:00Z'));
	expect(Object.fromEntries(await getVotes(db))).toEqual({ 1: -1, 2: -1, 3: 1 });
	expect(await getSeenQids(db)).toEqual(new Set([1, 2, 3]));
});

test('svuota lo storico nasconde, azzera le raccomandazioni cancella', async () => {
	await recordEvent(db, ev(1, 'like', '2026-10-07T10:00:00Z'));
	await clearHistory(db, '2026-10-07T10:30:00Z');
	await recordEvent(db, ev(2, 'like', '2026-10-07T11:00:00Z'));

	expect((await getHistory(db)).map((e) => e.qid)).toEqual([2]);
	expect((await getVotes(db)).size).toBe(2); // il motore vede ancora tutto
	expect(await getSeenQids(db)).toEqual(new Set([1, 2]));

	await resetRecommendations(db);
	expect(await getHistory(db)).toEqual([]);
	expect((await getVotes(db)).size).toBe(0);
	expect(await getSetting(db, 'history_cleared_at')).toBeNull();
});

test('watchlist ordinata dalla più recente e svuotabile senza toccare gli eventi', async () => {
	await recordEvent(db, ev(1, 'watchlist', '2026-10-07T10:00:00Z'));
	await recordEvent(db, ev(2, 'watchlist', '2026-10-07T12:00:00Z'));
	expect((await getWatchlist(db)).map((e) => e.qid)).toEqual([2, 1]);
	await clearWatchlist(db);
	expect(await getWatchlist(db)).toEqual([]);
	expect((await getVotes(db)).size).toBe(2);
});

test('impostazioni chiave/valore con sovrascrittura', async () => {
	expect(await getSetting(db, 'platforms')).toBeNull();
	await setSetting(db, 'platforms', 'netflix,prime');
	await setSetting(db, 'platforms', 'netflix');
	expect(await getSetting(db, 'platforms')).toBe('netflix');
});
