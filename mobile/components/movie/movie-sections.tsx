import { Linking, Pressable, ScrollView, View } from 'react-native';

import { Image } from '@/components/styled';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import {
	type CountryProviders,
	imageUrl,
	type MovieDetails,
	type Provider,
	providersFor,
	topCast,
} from '@/lib/tmdb';
import { deviceLanguage } from '@/lib/tmdb/hooks';

const CAST_PLACEHOLDER = require('@/assets/images/cast-placeholder.png');

function SectionTitle({ children }: { children: string }) {
	return (
		<Text className="text-base tracking-wide text-muted-foreground uppercase">{children}</Text>
	);
}

/** "Attori": schede da 100 pt con foto 2:3 e nome su una riga, come `MovieCredits`. */
export function CastRow({ movie }: { movie: MovieDetails }) {
	const cast = topCast(movie, 10);
	if (cast.length === 0) return null;
	return (
		<View className="gap-2">
			<SectionTitle>{t('movie.cast')}</SectionTitle>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="gap-3">
				{cast.map((c) => {
					const uri = imageUrl(c.profile_path, 'w185');
					return (
						<View key={c.id} className="w-[100px] gap-1">
							<Image
								source={uri ? { uri } : CAST_PLACEHOLDER}
								placeholder={CAST_PLACEHOLDER}
								contentFit="cover"
								className="aspect-[2/3] w-full rounded-md bg-card"
								accessibilityLabel={c.name}
							/>
							<Text className="text-xs font-semibold text-white" numberOfLines={1}>
								{c.name}
							</Text>
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
}

function ProviderIcons({ providers, link }: { providers: Provider[]; link: string }) {
	return (
		<View className="flex-row flex-wrap gap-4">
			{[...providers]
				.sort((a, b) => a.display_priority - b.display_priority)
				.map((p) => (
					<Pressable
						key={p.provider_id}
						accessibilityRole="link"
						accessibilityLabel={p.provider_name}
						onPress={() => Linking.openURL(link).catch(() => {})}
						className="active:opacity-70">
						<Image
							source={{ uri: imageUrl(p.logo_path, 'w185') ?? undefined }}
							contentFit="cover"
							className="h-[45px] w-[45px] rounded-full bg-card"
						/>
					</Pressable>
				))}
		</View>
	);
}

/**
 * Provider della regione dell'utente in tre blocchi, con le etichette giuste (nell'originale noleggio e
 * acquisto erano invertite). Icone e attribuzione aprono la pagina JustWatch del film: è l'attribuzione
 * richiesta dall'endpoint /watch/providers.
 */
export function ProvidersSection({ movie }: { movie: MovieDetails }) {
	const providers: CountryProviders | null = providersFor(movie, deviceLanguage());
	if (!providers) return null;
	const blocks = [
		{ title: t('movie.streaming'), items: providers.flatrate },
		{ title: t('movie.rent'), items: providers.rent },
		{ title: t('movie.buy'), items: providers.buy },
	].filter((b) => b.items && b.items.length > 0);
	if (blocks.length === 0) return null;
	return (
		<View className="gap-4">
			{blocks.map((b) => (
				<View key={b.title} className="gap-2">
					<SectionTitle>{b.title}</SectionTitle>
					<ProviderIcons providers={b.items!} link={providers.link} />
				</View>
			))}
			<Pressable
				accessibilityRole="link"
				onPress={() => Linking.openURL(providers.link).catch(() => {})}
				className="active:opacity-70">
				<Text className="text-xs text-muted-foreground underline">
					{t('movie.providersBy')}
				</Text>
			</Pressable>
		</View>
	);
}
