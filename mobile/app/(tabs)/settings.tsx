import { Link } from 'expo-router';
import { ChevronRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { Screen } from '@/components/screen';
import { PlatformsSection } from '@/components/settings/platforms-section';
import { StorageSection } from '@/components/settings/storage-section';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import { getShowAdult, setShowAdult } from '@/lib/preferences';
import { COLORS } from '@/lib/theme';
import { useUserDb } from '@/lib/userdb/provider';

function SectionTitle({ children }: { children: string }) {
	return (
		<Text className="pt-6 pb-2 text-base font-medium tracking-wide text-primary uppercase">
			{children}
		</Text>
	);
}

/**
 * Impostazioni in una pagina sola: piattaforme, memoria e contenuti come sezioni, Informazioni come
 * unica pagina dedicata. L'originale aveva tre sottopagine per poche voci.
 */
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
			<ScrollView contentContainerClassName="px-4 pb-12 pt-safe">
				<Text className="pt-4 text-4xl font-bold text-foreground">{t('tab.settings')}</Text>

				<SectionTitle>{t('settings.platforms')}</SectionTitle>
				<PlatformsSection />

				<SectionTitle>{t('settings.storage')}</SectionTitle>
				<StorageSection />

				<SectionTitle>{t('settings.content')}</SectionTitle>
				<View className="flex-row items-center justify-between py-3">
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

				<View className="pt-6">
					<Separator className="bg-white/10" />
					<Link href="/settings/about" asChild>
						<Pressable
							accessibilityRole="button"
							className="flex-row items-center justify-between py-4 active:opacity-60">
							<Text className="text-lg text-foreground">{t('settings.about')}</Text>
							<Icon as={ChevronRightIcon} className="text-muted-foreground" size={20} />
						</Pressable>
					</Link>
					<Separator className="bg-white/10" />
				</View>
			</ScrollView>
		</Screen>
	);
}
