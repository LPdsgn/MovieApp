import { useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { HeartIcon, ListFilterIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { PosterImage } from '@/components/movie/poster-image';
import { Screen } from '@/components/screen';
import { Image } from '@/components/styled';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import type { MovieDetails } from '@/lib/tmdb';
import { deviceLanguage, movieQueryKey, useMovie } from '@/lib/tmdb/hooks';
import { getHistory, type HistoryEntry, type HistoryFilter } from '@/lib/userdb';
import { useUserDb } from '@/lib/userdb/provider';

const EMPTY = require('@/assets/images/HistoryEmptyStatePlaceholder.png');

/** Storico: griglia a tre colonne dal più recente, filtri, ricerca sui titoli già in cache. */
export default function HistoryScreen() {
	const user = useUserDb();
	const queryClient = useQueryClient();
	const [filter, setFilter] = React.useState<HistoryFilter>('all');
	const [entries, setEntries] = React.useState<HistoryEntry[] | null>(null);
	const [query, setQuery] = React.useState('');

	useFocusEffect(
		React.useCallback(() => {
			let cancelled = false;
			getHistory(user, filter).then((rows) => {
				if (!cancelled) setEntries(rows);
			});
			return () => {
				cancelled = true;
			};
		}, [user, filter])
	);

	// La ricerca filtra solo sui titoli già scaricati: i titoli sono contenuto TMDB e non stanno su disco.
	const visible = React.useMemo(() => {
		if (!entries) return [];
		const q = query.trim().toLowerCase();
		if (!q) return entries;
		const lang = deviceLanguage();
		return entries.filter((e) => {
			const movie = queryClient.getQueryData<MovieDetails>(movieQueryKey(e.tmdbId, lang));
			return movie?.title.toLowerCase().includes(q);
		});
	}, [entries, query, queryClient]);

	return (
		<Screen>
			<Stack.Screen
				options={{
					title: t('history.title'),
					headerLargeTitle: false,
					headerSearchBarOptions: {
						placeholder: t('watchlist.search'),
						onChangeText: (e) => setQuery(e.nativeEvent.text),
					},
					headerRight: () => <FilterMenu value={filter} onChange={setFilter} />,
				}}
			/>
			{entries && entries.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-4 px-8">
					<Image source={EMPTY} contentFit="contain" className="h-56 w-56" />
					<Text className="text-center text-lg font-semibold text-muted-foreground">
						{t('history.empty')}
					</Text>
				</View>
			) : (
				<FlatList
					data={visible}
					keyExtractor={(e) => String(e.qid)}
					numColumns={3}
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="gap-3.5 p-4"
					columnWrapperClassName="gap-3.5"
					renderItem={({ item }) => <HistoryCell entry={item} />}
				/>
			)}
		</Screen>
	);
}

function FilterMenu({
	value,
	onChange,
}: {
	value: HistoryFilter;
	onChange: (f: HistoryFilter) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={t('history.filter')}
					hitSlop={12}>
					<Icon as={ListFilterIcon} className="text-primary" size={24} />
				</Pressable>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(v) => onChange(v as HistoryFilter)}>
					<DropdownMenuRadioItem value="loved">
						<Text>{t('history.loved')}</Text>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="discarded">
						<Text>{t('history.discarded')}</Text>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="all">
						<Text>{t('history.all')}</Text>
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Cella: poster con overlay e icona del voto, titolo su una riga. */
function HistoryCell({ entry }: { entry: HistoryEntry }) {
	const router = useRouter();
	const movie = useMovie(entry.tmdbId);
	const loved = entry.action !== 'dislike';
	return (
		<Pressable
			className="flex-1 overflow-hidden rounded-md bg-background active:opacity-80"
			accessibilityRole="button"
			accessibilityLabel={movie.data?.title ?? String(entry.tmdbId)}
			onPress={() =>
				router.push({ pathname: '/movie/[tmdbId]', params: { tmdbId: String(entry.tmdbId) } })
			}>
			<View>
				<PosterImage path={movie.data?.poster_path} size="w342" />
				<View className="bg-ink-700/60 absolute inset-0 items-center justify-center">
					<Icon
						as={loved ? HeartIcon : XIcon}
						size={34}
						className={loved ? 'text-primary' : 'text-white'}
						fill={loved ? '#FFD400' : 'transparent'}
					/>
				</View>
			</View>
			<Text className="p-2 text-sm font-semibold text-foreground" numberOfLines={1}>
				{movie.data?.title ?? '…'}
			</Text>
		</Pressable>
	);
}
