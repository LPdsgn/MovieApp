import { type Href, Link } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, Switch, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { type Key, t } from '@/lib/i18n';
import { getShowAdult, setShowAdult } from '@/lib/preferences';
import { COLORS } from '@/lib/theme';
import { useUserDb } from '@/lib/userdb/provider';

const ROWS: { href: Href; label: Key }[] = [
	{ href: '/settings/platforms', label: 'settings.platforms' },
	{ href: '/settings/storage', label: 'settings.storage' },
	{ href: '/settings/about', label: 'settings.about' },
];

/** Impostazioni: lista piatta con tre righe, come `SettingsTab`. */
export default function SettingsScreen() {
	const user = useUserDb();
	const [showAdult, setShowAdultState] = React.useState<boolean | null>(null);
	React.useEffect(() => {
		let cancelled = false;
		getShowAdult(user).then((v) => {
			if (!cancelled) setShowAdultState(v);
		});
		return () => {
			cancelled = true;
		};
	}, [user]);
	const toggleAdult = (value: boolean) => {
		setShowAdultState(value);
		setShowAdult(user, value).catch(() => {});
	};
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
					<View className="flex-row items-center justify-between py-4">
						<Text className="text-lg text-foreground">{t('settings.adult')}</Text>
						<Switch
							value={showAdult ?? false}
							disabled={showAdult === null}
							onValueChange={toggleAdult}
							trackColor={{ true: COLORS.accent, false: COLORS.ink650 }}
							thumbColor={COLORS.white}
							accessibilityLabel={t('settings.adult')}
						/>
					</View>
					<Separator className="bg-white/10" />
				</View>
			</View>
		</Screen>
	);
}
