import { Linking, Pressable, ScrollView, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Image } from '@/components/styled';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';

const TMDB_LOGO = require('@/assets/images/TMDB-logo.png');
const TEAM = ['Carmine Porricelli', 'Riccardo F. Ruocco', 'Luigi Pedata', 'Luca Basile'];

function SectionTitle({ children }: { children: string }) {
	return (
		<Text className="text-base font-medium tracking-wide text-primary uppercase">{children}</Text>
	);
}

/** About come l'originale: testo, contatto via mail, attribuzione TMDB (obbligatoria) e team. */
export default function AboutScreen() {
	return (
		<Screen>
			<ScrollView contentContainerClassName="gap-8 px-4 pb-16 pt-safe-offset-14">
				<Text className="text-xl text-foreground">{t('about.text')}</Text>

				<View className="gap-3">
					<SectionTitle>{t('about.contact')}</SectionTitle>
					{/* Come l'originale: bozza di mail senza destinatario preimpostato. */}
					<Pressable
						accessibilityRole="button"
						onPress={() => Linking.openURL('mailto:?subject=MoovieFinder').catch(() => {})}
						className="items-center rounded-xl bg-primary py-4 active:opacity-80">
						<Text className="text-lg font-semibold text-primary-foreground uppercase">
							{t('about.contactButton')}
						</Text>
					</Pressable>
				</View>

				<View className="gap-4">
					<SectionTitle>{t('about.contributions')}</SectionTitle>
					<Separator className="bg-white/10" />
					<View className="flex-row items-end gap-4">
						<Image
							source={TMDB_LOGO}
							contentFit="contain"
							className="h-16 w-24"
							accessibilityLabel="TMDB"
						/>
						<Text className="flex-1 text-base text-foreground">{t('about.tmdb')}</Text>
					</View>
					<Text className="text-sm text-muted-foreground">{t('movie.providersBy')}</Text>
					<Separator className="bg-white/10" />
					<View className="gap-1.5">
						<Text className="text-base text-foreground">{t('about.team')}</Text>
						{TEAM.map((name) => (
							<Text key={name} className="text-base font-semibold text-foreground">
								{name}
							</Text>
						))}
					</View>
				</View>
			</ScrollView>
		</Screen>
	);
}
