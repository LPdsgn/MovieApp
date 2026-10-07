/**
 * Database locale dell'utente: eventi grezzi, watchlist, impostazioni.
 * Separato dall'artefatto, così un aggiornamento dei dati non tocca l'utente.
 * Su disco solo id (QID e id TMDB), mai contenuti TMDB.
 *
 * Le funzioni accettano un `Db` minimo, che `SQLiteDatabase` di expo-sqlite soddisfa
 * e che nei test è un adattatore su `node:sqlite`.
 */

export type Param = string | number | null;

export interface Db {
	execAsync(sql: string): Promise<void>;
	runAsync(sql: string, ...params: Param[]): Promise<unknown>;
	getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null>;
	getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]>;
	withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export const USER_DB_NAME = 'user.db';

/** Una voce per versione: la migrazione N porta da N-1 a N. Mai modificare quelle già rilasciate. */
export const MIGRATIONS: readonly string[] = [
	`
	CREATE TABLE events (
		id         INTEGER PRIMARY KEY,
		qid        INTEGER NOT NULL,
		tmdb_id    INTEGER NOT NULL,
		action     TEXT    NOT NULL CHECK (action IN ('like', 'dislike', 'watchlist')),
		at         TEXT    NOT NULL,              -- ISO 8601 UTC
		source     TEXT    NOT NULL CHECK (source IN ('swipe', 'button', 'detail')),
		algorithm  TEXT    NOT NULL,              -- versione del motore che ha proposto la carta
		artifact   TEXT    NOT NULL,              -- data_version dell'artefatto
		propensity REAL                           -- probabilità con cui la carta è stata scelta; NULL se non da una carta
	);
	CREATE INDEX events_qid ON events (qid);
	CREATE TABLE watchlist (
		qid      INTEGER PRIMARY KEY,
		tmdb_id  INTEGER NOT NULL,
		added_at TEXT    NOT NULL
	);
	CREATE TABLE settings (
		key   TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
	`,
];

export async function migrate(db: Db): Promise<void> {
	const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
	let version = row?.user_version ?? 0;
	if (version > MIGRATIONS.length) {
		throw new Error(
			`Database utente alla versione ${version}, l'app conosce fino alla ${MIGRATIONS.length}`
		);
	}
	for (; version < MIGRATIONS.length; version++) {
		await db.execAsync(MIGRATIONS[version]);
		await db.execAsync(`PRAGMA user_version = ${version + 1}`);
	}
}

export type Action = 'like' | 'dislike' | 'watchlist';
export type Source = 'swipe' | 'button' | 'detail';

/** Peso di ogni azione per il motore. Salvare in watchlist vale come un like (decisione del 07/10/2026). */
export const VOTE: Record<Action, number> = { like: 1, watchlist: 1, dislike: -1 };

export interface NewEvent {
	qid: number;
	tmdbId: number;
	action: Action;
	source: Source;
	algorithm: string;
	artifact: string;
	propensity: number | null;
	/** Default: adesso. */
	at?: string;
}

export const now = (): string => new Date().toISOString();

/** Salva l'evento e, se è un `watchlist`, aggiorna la watchlist nella stessa transazione. */
export async function recordEvent(db: Db, event: NewEvent): Promise<void> {
	const at = event.at ?? now();
	await db.withTransactionAsync(async () => {
		await db.runAsync(
			`INSERT INTO events (qid, tmdb_id, action, at, source, algorithm, artifact, propensity)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			event.qid,
			event.tmdbId,
			event.action,
			at,
			event.source,
			event.algorithm,
			event.artifact,
			event.propensity
		);
		if (event.action === 'watchlist') {
			await db.runAsync(
				'INSERT OR IGNORE INTO watchlist (qid, tmdb_id, added_at) VALUES (?, ?, ?)',
				event.qid,
				event.tmdbId,
				at
			);
		}
	});
}

// --- Storico ---------------------------------------------------------------

export type HistoryFilter = 'all' | 'loved' | 'discarded';

export interface HistoryEntry {
	qid: number;
	tmdbId: number;
	action: Action;
	at: string;
}

const HISTORY_CLEARED_AT = 'history_cleared_at';

/**
 * Ultimo evento per film, dal più recente, dopo l'ultimo "Svuota lo storico".
 * `loved` = like e watchlist, `discarded` = dislike.
 */
export async function getHistory(db: Db, filter: HistoryFilter = 'all'): Promise<HistoryEntry[]> {
	const clearedAt = (await getSetting(db, HISTORY_CLEARED_AT)) ?? '';
	const actions =
		filter === 'loved' ? ['like', 'watchlist'] : filter === 'discarded' ? ['dislike'] : null;
	const rows = await db.getAllAsync<HistoryEntry>(
		`SELECT qid, tmdb_id AS tmdbId, action, at FROM events
		 WHERE id IN (SELECT max(id) FROM events WHERE at > ? GROUP BY qid)
		 ${actions ? `AND action IN (${actions.map(() => '?').join(', ')})` : ''}
		 ORDER BY at DESC, id DESC`,
		clearedAt,
		...(actions ?? [])
	);
	return rows;
}

/** Nasconde lo storico fino a questo momento. Gli eventi restano per il motore e le metriche. */
export function clearHistory(db: Db, at = now()): Promise<void> {
	return setSetting(db, HISTORY_CLEARED_AT, at);
}

/** Cancella tutti gli eventi: il motore riparte da zero. La watchlist resta. */
export async function resetRecommendations(db: Db): Promise<void> {
	await db.withTransactionAsync(async () => {
		await db.runAsync('DELETE FROM events');
		await db.runAsync('DELETE FROM settings WHERE key = ?', HISTORY_CLEARED_AT);
	});
}

// --- Per il motore ---------------------------------------------------------

/** Voto corrente per film (ultimo evento), su tutti gli eventi, anche quelli nascosti dallo storico. */
export async function getVotes(db: Db): Promise<Map<number, number>> {
	const rows = await db.getAllAsync<{ qid: number; action: Action }>(
		'SELECT qid, action FROM events WHERE id IN (SELECT max(id) FROM events GROUP BY qid)'
	);
	return new Map(rows.map((r) => [r.qid, VOTE[r.action]]));
}

/** Film già proposti e valutati: da escludere dalle prossime carte. */
export async function getSeenQids(db: Db): Promise<Set<number>> {
	const rows = await db.getAllAsync<{ qid: number }>('SELECT DISTINCT qid FROM events');
	return new Set(rows.map((r) => r.qid));
}

// --- Watchlist -------------------------------------------------------------

export interface WatchlistEntry {
	qid: number;
	tmdbId: number;
	addedAt: string;
}

export function getWatchlist(db: Db): Promise<WatchlistEntry[]> {
	return db.getAllAsync<WatchlistEntry>(
		'SELECT qid, tmdb_id AS tmdbId, added_at AS addedAt FROM watchlist ORDER BY added_at DESC'
	);
}

export async function isInWatchlist(db: Db, qid: number): Promise<boolean> {
	const row = await db.getFirstAsync<{ qid: number }>(
		'SELECT qid FROM watchlist WHERE qid = ?',
		qid
	);
	return row !== null;
}

/** Rimozione senza evento: per le metriche contano le aggiunte, e il voto del film resta quello dato. */
export async function removeFromWatchlist(db: Db, qid: number): Promise<void> {
	await db.runAsync('DELETE FROM watchlist WHERE qid = ?', qid);
}

export async function clearWatchlist(db: Db): Promise<void> {
	await db.runAsync('DELETE FROM watchlist');
}

// --- Impostazioni ----------------------------------------------------------

export async function getSetting(db: Db, key: string): Promise<string | null> {
	const row = await db.getFirstAsync<{ value: string }>(
		'SELECT value FROM settings WHERE key = ?',
		key
	);
	return row?.value ?? null;
}

export async function setSetting(db: Db, key: string, value: string): Promise<void> {
	await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}
