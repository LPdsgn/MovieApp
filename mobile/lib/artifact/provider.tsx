import { SQLiteProvider } from 'expo-sqlite';
import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { ARTIFACT_ASSET, artifactDatabaseName, readMeta } from './index';

/**
 * Copia l'artefatto dal bundle al primo avvio e lo apre. Finché non è pronto non rende nulla;
 * su errore mostra l'errore, mai un segnaposto (vedi CLAUDE.md, "Errori dell'app originale").
 */
export function ArtifactProvider({ children }: { children: React.ReactNode }) {
	const [error, setError] = React.useState<Error | null>(null);

	if (error) {
		return (
			<View className="flex-1 items-center justify-center gap-2 p-6" accessibilityRole="alert">
				<Text className="text-lg font-semibold">Dati dei film non disponibili</Text>
				<Text className="text-center text-muted-foreground">{error.message}</Text>
			</View>
		);
	}

	return (
		<SQLiteProvider
			databaseName={artifactDatabaseName()}
			assetSource={{ assetId: ARTIFACT_ASSET }}
			onInit={async (db) => {
				await readMeta(db); // verifica la versione dello schema prima di rendere l'app
			}}
			onError={setError}>
			{children}
		</SQLiteProvider>
	);
}
