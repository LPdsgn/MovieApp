import { CalendarIcon, ClockIcon, StarIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatRuntime, starsOf, yearOf } from '@/lib/format';
import type { Genre } from '@/lib/tmdb';
import { cn } from '@/lib/utils';

/** Fino a 3 chip di genere, come `MovieGenres`. */
export function GenreChips({ genres, className }: { genres: Genre[]; className?: string }) {
	return (
		<View className={cn('flex-row flex-wrap gap-2', className)}>
			{genres.slice(0, 3).map((g) => (
				<Badge key={g.id} variant="secondary" className="rounded-full bg-black/40 px-2 py-0.5">
					<Text className="text-xs font-medium text-white">{g.name}</Text>
				</Badge>
			))}
		</View>
	);
}

/** Durata e anno con icone, a distanza 20 come nell'originale. */
export function MovieMeta({
	runtime,
	releaseDate,
	className,
	textClassName,
}: {
	runtime: number | null | undefined;
	releaseDate: string | null | undefined;
	className?: string;
	textClassName?: string;
}) {
	return (
		<View className={cn('flex-row items-center gap-5', className)}>
			<View className="flex-row items-center gap-1.5">
				<Icon as={ClockIcon} className={cn('text-white', textClassName)} size={16} />
				<Text className={cn('text-base text-white', textClassName)}>
					{formatRuntime(runtime)}
				</Text>
			</View>
			<View className="flex-row items-center gap-1.5">
				<Icon as={CalendarIcon} className={cn('text-white', textClassName)} size={16} />
				<Text className={cn('text-base text-white', textClassName)}>{yearOf(releaseDate)}</Text>
			</View>
		</View>
	);
}

/** Cinque stelle in AccentDark, piene secondo `round(voto/2)`. */
export function StarsRating({ voteAverage }: { voteAverage: number | null | undefined }) {
	const filled = starsOf(voteAverage);
	return (
		<View
			className="flex-row gap-1.5"
			accessibilityRole="text"
			accessibilityLabel={`${filled} su 5`}>
			{Array.from({ length: 5 }, (_, i) => (
				<Icon
					key={i}
					as={StarIcon}
					size={18}
					className="text-accent"
					fill={i < filled ? '#FFC300' : 'transparent'}
				/>
			))}
		</View>
	);
}
