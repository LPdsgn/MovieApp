import { BookmarkIcon, HeartIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type SwipeLabelKind = 'yep' | 'nope' | 'saved';

const STYLE: Record<SwipeLabelKind, { icon: typeof HeartIcon; pill: string; text: string }> = {
	// YEP: accent su pillola traslucida con bordo accent; NOPE: bianco; SALVATO: Gray-800 su accent pieno.
	yep: {
		icon: HeartIcon,
		pill: 'border-[3.5px] border-primary bg-black/40',
		text: 'text-primary',
	},
	nope: { icon: XIcon, pill: 'border-[3.5px] border-white bg-black/40', text: 'text-white' },
	saved: { icon: BookmarkIcon, pill: 'bg-primary', text: 'text-primary-foreground' },
};

/** Etichette YEP / NOPE / SALVATO sovrapposte alla carta durante lo swipe. */
export function SwipeLabel({ kind }: { kind: SwipeLabelKind }) {
	const { icon, pill, text } = STYLE[kind];
	const label =
		kind === 'yep' ? t('swipe.yep') : kind === 'nope' ? t('swipe.nope') : t('swipe.saved');
	return (
		<View className={cn('flex-row items-center gap-2 rounded-full px-5 py-2.5', pill)}>
			<Icon
				as={icon}
				className={text}
				size={20}
				fill={kind === 'nope' ? 'transparent' : 'currentColor'}
			/>
			<Text className={cn('text-xl font-black', text)}>{label}</Text>
		</View>
	);
}
