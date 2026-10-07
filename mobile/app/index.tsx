import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { type ArtifactMeta, readMeta } from '@/lib/artifact';
import { loadCatalog, recommend, type Recommendation } from '@/lib/engine';
import { useUserDb } from '@/lib/userdb/provider';

/** Schermata provvisoria: verifica artefatto, database utente e motore, fino alle prime carte. */
export default function Screen() {
	const artifact = useSQLiteContext();
	const user = useUserDb();
	const [meta, setMeta] = React.useState<ArtifactMeta | null>(null);
	const [cards, setCards] = React.useState<Recommendation[]>([]);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const m = await readMeta(artifact);
				const catalog = await loadCatalog(artifact);
				const next = await recommend(artifact, catalog, user, { n: 3 });
				if (cancelled) return;
				setMeta(m);
				setCards(next);
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : String(e));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [artifact, user]);

	return (
		<>
			<Stack.Screen options={{ title: 'MoovieFinder' }} />
			<View className="flex-1 items-center justify-center gap-2 p-6">
				{error ? (
					<Text className="text-destructive" accessibilityRole="alert">
						{error}
					</Text>
				) : meta ? (
					<>
						<Text className="font-mono text-sm">
							artefatto {meta.dataVersion} · schema {meta.schemaVersion} · {meta.movieCount}{' '}
							film
						</Text>
						{cards.map((c) => (
							<Text key={c.qid} className="font-mono text-xs text-muted-foreground">
								Q{c.qid} · tmdb {c.tmdbId} · p={c.propensity}
								{c.explored ? ' · esplorazione' : ''}
							</Text>
						))}
					</>
				) : (
					<Text className="text-muted-foreground">Caricamento…</Text>
				)}
			</View>
		</>
	);
}
