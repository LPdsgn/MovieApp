import * as React from 'react';

import { Image } from '@/components/styled';
import { imageUrl, type PosterSize } from '@/lib/tmdb';

const PLACEHOLDER = require('@/assets/images/Placeholder.png');

/** Poster 2:3 con segnaposto dell'originale. `expo-image` tiene la cache su disco solo per le immagini. */
export function PosterImage({
	path,
	size = 'w500',
	className,
	accessibilityLabel,
}: {
	path: string | null | undefined;
	size?: PosterSize;
	className?: string;
	accessibilityLabel?: string;
}) {
	const uri = imageUrl(path, size);
	return (
		<Image
			source={uri ? { uri } : PLACEHOLDER}
			placeholder={PLACEHOLDER}
			contentFit="cover"
			transition={150}
			className={className ?? 'aspect-[2/3] w-full'}
			accessibilityLabel={accessibilityLabel}
			accessibilityIgnoresInvertColors
		/>
	);
}
