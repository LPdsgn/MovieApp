import { type Href, Link } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { type Key, t } from '@/lib/i18n';

const ROWS: { href: Href; label: Key }[] = [
	{ href: '/settings/platforms', label: 'settings.platforms' },
	{ href: '/settings/storage', label: 'settings.storage' },
	{ href: '/settings/about', label: 'settings.about' },
];

/** Impostazioni: lista piatta con tre righe, come `SettingsTab`. */
export default function SettingsScreen() {
	return (
		<Screen>
			<View className="flex-1 pt-safe">
				<Text className="px-5 pt-4 pb-3 text-4xl font-bold text-foreground">
					{t('tab.settings')}
				</Text>
				<View className="px-4">
					{ROWS.map((row) => (
						<React.Fragment key={row.href as string}>
							<Separator className="bg-white/10" />
							<Link href={row.href} asChild>
								<Pressable
									accessibilityRole="button"
									className="flex-row items-center justify-between py-4 active:opacity-60">
									<Text className="text-lg text-foreground">{t(row.label)}</Text>
									<Icon
										as={ChevronRightIcon}
										className="text-muted-foreground"
										size={20}
									/>
								</Pressable>
							</Link>
						</React.Fragment>
					))}
					<Separator className="bg-white/10" />
				</View>
			</View>
		</Screen>
	);
}
