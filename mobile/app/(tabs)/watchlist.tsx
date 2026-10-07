import * as React from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Image } from '@/components/styled';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';

const EMPTY = require('@/assets/images/WatchlistEmptyStatePlaceholder.png');

/** Provvisoria: stato vuoto. La griglia arriva con il task "dettaglio, watchlist e impostazioni". */
export default function WatchlistScreen() {
	return (
		<Screen>
			<View className="flex-1 pt-safe">
				<Text className="px-5 pt-4 text-4xl font-bold text-foreground">
					{t('tab.watchlist')}
				</Text>
				<View className="flex-1 items-center justify-center gap-4 px-8">
					<Image source={EMPTY} contentFit="contain" className="h-56 w-56" />
					<Text className="text-center text-lg font-semibold text-muted-foreground">
						{t('watchlist.empty')}
					</Text>
				</View>
			</View>
		</Screen>
	);
}
