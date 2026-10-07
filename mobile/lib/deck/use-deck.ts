import type { SQLiteDatabase } from 'expo-sqlite';
import * as React from 'react';

import { readMeta } from '@/lib/artifact';
import { type Catalog, ENGINE, loadCatalog, recommend, type Recommendation } from '@/lib/engine';
import { prefetchMovie } from '@/lib/tmdb/hooks';
import { type Action, type Db, recordEvent, type Source } from '@/lib/userdb';

export const DECK_SIZE = 3;

// Catalogo e versione dell'artefatto una volta per database, per tutta la sessione.
const catalogs = new WeakMap<SQLiteDatabase, Promise<{ catalog: Catalog; version: string }>>();
function loadOnce(artifact: SQLiteDatabase) {
	let p = catalogs.get(artifact);
	if (!p) {
		p = Promise.all([loadCatalog(artifact), readMeta(artifact)]).then(([catalog, meta]) => ({
			catalog,
			version: meta.dataVersion,
		}));
		catalogs.set(artifact, p);
	}
	return p;
}

export type DeckStatus = 'loading' | 'ready' | 'error';

export interface Deck {
	/** Dalla carta in cima (indice 0) a quella in fondo. */
	cards: Recommendation[];
	status: DeckStatus;
	error: Error | null;
	/** Salva l'evento **prima** di chiedere la carta successiva (CLAUDE.md, "Swipe persi o applicati tardi"). */
	swipe: (card: Recommendation, action: Action, source: Source) => Promise<void>;
	reload: () => void;
}

export function useDeck(artifact: SQLiteDatabase, user: Db): Deck {
	const [cards, setCards] = React.useState<Recommendation[]>([]);
	const [attempt, setAttempt] = React.useState(0);
	// Esito dell'ultimo tentativo di caricamento: lo stato "loading" è attempt ≠ loaded.attempt,
	// così l'effetto non chiama setState in modo sincrono (regola del React Compiler).
	const [loaded, setLoaded] = React.useState<{ attempt: number; error: Error | null }>({
		attempt: -1,
		error: null,
	});
	const versionRef = React.useRef('');

	React.useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const { catalog, version } = await loadOnce(artifact);
				versionRef.current = version;
				const next = await recommend(artifact, catalog, user, { n: DECK_SIZE });
				if (cancelled) return;
				setCards(next);
				setLoaded({ attempt, error: null });
				for (const c of next) prefetchMovie(c.tmdbId);
			} catch (e) {
				if (cancelled) return;
				setLoaded({ attempt, error: e instanceof Error ? e : new Error(String(e)) });
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [artifact, user, attempt]);

	const status: DeckStatus =
		loaded.attempt !== attempt ? 'loading' : loaded.error ? 'error' : 'ready';

	const swipe = React.useCallback(
		async (card: Recommendation, action: Action, source: Source) => {
			await recordEvent(user, {
				qid: card.qid,
				tmdbId: card.tmdbId,
				action,
				source,
				algorithm: ENGINE.algorithm,
				artifact: versionRef.current,
				propensity: card.propensity,
			});
			const remaining = cards.filter((c) => c.qid !== card.qid);
			setCards(remaining);
			try {
				const { catalog } = await loadOnce(artifact);
				const [next] = await recommend(artifact, catalog, user, {
					n: 1,
					exclude: remaining.map((c) => c.qid),
				});
				if (next) {
					prefetchMovie(next.tmdbId);
					setCards((current) =>
						current.some((c) => c.qid === next.qid) ? current : [...current, next]
					);
				}
			} catch {
				// Lo swipe è salvo. Il rifornimento fallito accorcia il mazzo: a mazzo vuoto compare "riprova".
			}
		},
		[artifact, user, cards]
	);

	const reload = React.useCallback(() => setAttempt((a) => a + 1), []);

	return { cards, status, error: loaded.error, swipe, reload };
}
