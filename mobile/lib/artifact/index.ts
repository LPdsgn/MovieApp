/**
 * Artefatto SQLite del motore di raccomandazione, prodotto dalla pipeline e incluso nel bundle.
 * Sola lettura: i dati dell'utente (eventi, watchlist) stanno in un altro database.
 */

import { Asset } from 'expo-asset';
import type { SQLiteDatabase } from 'expo-sqlite';

import { decodeNeighbors, type Neighbor } from './blob';

export const ARTIFACT_ASSET: number = require('@/assets/db/moovie.db');

/** Versione dello schema che questo codice sa leggere. Deve coincidere con `meta.schema_version`. */
export const SUPPORTED_SCHEMA_VERSION = 3;

/**
 * Nome del file locale, legato all'hash dell'asset: un artefatto nuovo nel bundle viene copiato
 * in un file nuovo, senza sovrascrivere a ogni avvio.
 * ponytail: i file delle versioni precedenti restano su disco (uno per aggiornamento dell'app);
 * la pulizia arriva con il canale di aggiornamento dell'artefatto.
 */
export function artifactDatabaseName(): string {
	const hash = Asset.fromModule(ARTIFACT_ASSET).hash ?? 'dev';
	return `moovie-${hash}.db`;
}

export interface ArtifactMeta {
	schemaVersion: number;
	dataVersion: string;
	neighborsAlgorithm: string;
	movieCount: number;
}

export async function readMeta(db: SQLiteDatabase): Promise<ArtifactMeta> {
	const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM meta');
	const meta = Object.fromEntries(rows.map((r) => [r.key, r.value]));
	const schemaVersion = Number(meta.schema_version);
	if (schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
		throw new Error(
			`Artefatto con schema ${meta.schema_version}, l'app supporta ${SUPPORTED_SCHEMA_VERSION}`
		);
	}
	const count = await db.getFirstAsync<{ n: number }>('SELECT count(*) AS n FROM movies');
	return {
		schemaVersion,
		dataVersion: meta.data_version ?? '',
		neighborsAlgorithm: meta.neighbors_algorithm ?? '',
		movieCount: count?.n ?? 0,
	};
}

export interface Movie {
	qid: number;
	tmdbId: number;
	sitelinks: number;
	/** ISO 8601 (YYYY-MM-DD); null = data sconosciuta, da trattare come non uscito. */
	released: string | null;
	/** Minuti. */
	runtime: number | null;
	/** Generi Wikidata per adulti (film pornografico e sottoclassi). */
	adult: boolean;
}

const MOVIE_COLUMNS = 'qid, tmdb_id AS tmdbId, sitelinks, released, runtime, adult';

export function getMovie(db: SQLiteDatabase, qid: number): Promise<Movie | null> {
	return db.getFirstAsync<Movie>(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE qid = ?`, qid);
}

export async function getNeighbors(db: SQLiteDatabase, qid: number): Promise<Neighbor[]> {
	const row = await db.getFirstAsync<{ data: Uint8Array }>(
		'SELECT data FROM neighbors WHERE qid = ?',
		qid
	);
	return row ? decodeNeighbors(row.data) : [];
}

/** Feature di un film come { P136: [qid, ...], P57: [...] }. */
export async function getFeatures(
	db: SQLiteDatabase,
	qid: number
): Promise<Record<string, number[]>> {
	const rows = await db.getAllAsync<{ property: string; value: number }>(
		'SELECT property, value FROM features WHERE qid = ?',
		qid
	);
	const out: Record<string, number[]> = {};
	for (const { property, value } of rows) (out[property] ??= []).push(value);
	return out;
}

/** Feature di più film in una query: { qid → { P136: [...], ... } }. Vuoto per i qid senza feature. */
export async function getFeaturesFor(
	db: SQLiteDatabase,
	qids: number[]
): Promise<Map<number, Record<string, number[]>>> {
	const out = new Map<number, Record<string, number[]>>();
	if (qids.length === 0) return out;
	const rows = await db.getAllAsync<{ qid: number; property: string; value: number }>(
		`SELECT qid, property, value FROM features WHERE qid IN (${qids.map(() => '?').join(',')})`,
		...qids
	);
	for (const { qid, property, value } of rows) {
		const f = out.get(qid) ?? {};
		(f[property] ??= []).push(value);
		out.set(qid, f);
	}
	return out;
}

export type { Neighbor } from './blob';
