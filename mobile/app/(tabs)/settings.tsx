import * as React from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';

/** Provvisoria: solo il titolo. Le voci arrivano con il task "dettaglio, watchlist e impostazioni". */
export default function SettingsScreen() {
	return (
		<Screen>
			<View className="flex-1 pt-safe">
				<Text className="px-5 pt-4 text-4xl font-bold text-foreground">
					{t('tab.settings')}
				</Text>
			</View>
		</Screen>
	);
}
