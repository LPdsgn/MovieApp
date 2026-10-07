import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRightIcon, SearchIcon } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Pressable, TextInput, useWindowDimensions, View } from 'react-native';

import { MovieMeta } from '@/components/movie/movie-meta';
import { PosterImage } from '@/components/movie/poster-image';
import { Screen } from '@/components/screen';
import { Image } from '@/components/styled';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import type { MovieDetails } from '@/lib/tmdb';
import { deviceLanguage, movieQueryKey, useMovie } from '@/lib/tmdb/hooks';
import { COLORS } from '@/lib/theme';
import { getWatchlist, type WatchlistEntry } from '@/lib/userdb';
import { useUserDb } from '@/lib/userdb/provider';

const EMPTY = require('@/assets/images/WatchlistEmptyStatePlaceholder.png');

/** Watchlist: griglia a due colonne dalla più recente, ricerca sui titoli già in cache, stato vuoto. */
export default function WatchlistScreen() {
	const user = useUserDb();
	const queryClient = useQueryClient();
	const [entries, setEntries] = React.useState<WatchlistEntry[] | null>(null);
	const [query, setQuery] = React.useState('');
	const { width } = useWindowDimensions();
	const cellWidth = (width - 16 * 2 - 14) / 2;

	useFocusEffect(
		React.useCallback(() => {
			let cancelled = false;
			getWatchlist(user).then((rows) => {
				if (!cancelled) setEntries(rows);
			});
			return () => {
				cancelled = true;
			};
		}, [user])
	);

	const visible = React.useMemo(() => {
		if (!entries) return [];
		const q = query.trim().toLowerCase();
		if (!q) return entries;
		const lang = deviceLanguage();
		return entries.filter((e) =>
			queryClient
				.getQueryData<MovieDetails>(movieQueryKey(e.tmdbId, lang))
				?.title.toLowerCase()
				.includes(q)
		);
	}, [entries, query, queryClient]);

	return (
		<Screen>
			<View className="flex-1 pt-safe">
				<Text className="px-5 pt-4 text-4xl font-bold text-foreground">
					{t('tab.watchlist')}
				</Text>
				{entries && entries.length > 0 && (
					<View className="mx-4 mt-3 flex-row items-center gap-2 rounded-xl bg-white/10 px-3">
						<Icon as={SearchIcon} className="text-muted-foreground" size={18} />
						<TextInput
							value={query}
							onChangeText={setQuery}
							placeholder={t('watchlist.search')}
							placeholderTextColor={COLORS.ink600}
							className="flex-1 py-2.5 text-base text-foreground"
							accessibilityLabel={t('watchlist.search')}
							clearButtonMode="while-editing"
							autoCorrect={false}
						/>
					</View>
				)}
				{entries && entries.length === 0 ? (
					<View className="flex-1 items-center justify-center gap-4 px-8">
						<Image source={EMPTY} contentFit="contain" className="h-56 w-56" />
						<Text className="text-center text-lg font-semibold text-muted-foreground">
							{t('watchlist.empty')}
						</Text>
					</View>
				) : (
					<FlatList
						data={visible}
						keyExtractor={(e) => String(e.qid)}
						numColumns={2}
						contentContainerClassName="gap-6 p-4"
						columnWrapperClassName="gap-3.5"
						renderItem={({ item }) => <WatchlistCell entry={item} width={cellWidth} />}
					/>
				)}
			</View>
		</Screen>
	);
}

/** Cella come `MovieCardGridItem`: poster e barra inferiore traslucida con titolo, durata, anno e chevron. */
function WatchlistCell({ entry, width }: { entry: WatchlistEntry; width: number }) {
	const router = useRouter();
	const movie = useMovie(entry.tmdbId);
	return (
		<Pressable
			style={{ width }}
			className="overflow-hidden rounded-md bg-background active:opacity-80"
			accessibilityRole="button"
			accessibilityLabel={movie.data?.title ?? String(entry.tmdbId)}
			onPress={() =>
				router.push({
					pathname: '/movie/[tmdbId]',
					params: { tmdbId: String(entry.tmdbId), qid: String(entry.qid) },
				})
			}>
			<PosterImage path={movie.data?.poster_path} size="w342" />
			<View className="absolute right-0 bottom-0 left-0 flex-row items-center gap-2 bg-black/50 p-3">
				<View className="flex-1 gap-1">
					<Text className="text-base font-semibold text-white" numberOfLines={1}>
						{movie.data?.title ?? '…'}
					</Text>
					<MovieMeta
						runtime={movie.data?.runtime}
						releaseDate={movie.data?.release_date}
						className="gap-2.5"
						textClassName="text-[13px]"
					/>
				</View>
				<Icon as={ChevronRightIcon} className="text-white" size={18} />
			</View>
		</Pressable>
	);
}
