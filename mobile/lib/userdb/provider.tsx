import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

import { migrate, USER_DB_NAME } from './index';

// Context proprio, non SQLiteProvider: quello è già usato dall'artefatto e useSQLiteContext
// restituirebbe il database più interno, rendendo l'altro irraggiungibile.
const UserDbContext = React.createContext<SQLiteDatabase | null>(null);

export function useUserDb(): SQLiteDatabase {
	const db = React.useContext(UserDbContext);
	if (!db) throw new Error('useUserDb va usato dentro UserDbProvider');
	return db;
}

/** Apre il database dell'utente e applica le migrazioni. Su errore lo mostra, mai un segnaposto. */
export function UserDbProvider({ children }: { children: React.ReactNode }) {
	const [db, setDb] = React.useState<SQLiteDatabase | null>(null);
	const [error, setError] = React.useState<Error | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		let opened: SQLiteDatabase | null = null;
		(async () => {
			try {
				opened = await openDatabaseAsync(USER_DB_NAME);
				await migrate(opened);
				if (!cancelled) setDb(opened);
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
			}
		})();
		return () => {
			cancelled = true;
			opened?.closeAsync().catch(() => {});
		};
	}, []);

	if (error) {
		return (
			<View className="flex-1 items-center justify-center gap-2 p-6" accessibilityRole="alert">
				<Text className="text-lg font-semibold">Dati personali non disponibili</Text>
				<Text className="text-center text-muted-foreground">{error.message}</Text>
			</View>
		);
	}
	if (!db) return null;
	return <UserDbContext.Provider value={db}>{children}</UserDbContext.Provider>;
}
