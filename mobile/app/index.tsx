import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { type ArtifactMeta, getNeighbors, readMeta } from '@/lib/artifact';

const TITANIC_QID = 44578; // campione di riferimento, vedi docs/campioni-vicini.md

/** Schermata provvisoria: verifica che l'artefatto sia caricato e leggibile. */
export default function Screen() {
	const db = useSQLiteContext();
	const [meta, setMeta] = React.useState<ArtifactMeta | null>(null);
	const [neighbors, setNeighbors] = React.useState<string>('');
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const m = await readMeta(db);
				const n = await getNeighbors(db, TITANIC_QID);
				if (cancelled) return;
				setMeta(m);
				setNeighbors(
					n
						.slice(0, 3)
						.map((x) => `Q${x.qid} (${x.score.toFixed(3)})`)
						.join(', ')
				);
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : String(e));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [db]);

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
							artefatto {meta.dataVersion} · schema {meta.schemaVersion}
						</Text>
						<Text className="font-mono text-sm">{meta.movieCount} film</Text>
						<Text className="font-mono text-sm">{meta.neighborsAlgorithm}</Text>
						<Text className="font-mono text-xs text-muted-foreground">
							Titanic → {neighbors}
						</Text>
					</>
				) : (
					<Text className="text-muted-foreground">Caricamento…</Text>
				)}
			</View>
		</>
	);
}
