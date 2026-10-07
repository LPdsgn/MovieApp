import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary';

/**
 * Bottone circolare skeumorfico dell'originale (`SkeumorphicButtonStyle`): cerchio accent o Gray-700,
 * ombra che sparisce da premuto, scala 0,95, aptica opzionale. L'etichetta accessibile è obbligatoria:
 * nell'originale mancava (CLAUDE.md, "Nessuna accessibilità").
 */
export function CircleButton({
	icon,
	size = 60,
	variant = 'secondary',
	haptic,
	accessibilityLabel,
	className,
	iconClassName,
	children,
	onPress,
	...props
}: Omit<PressableProps, 'children'> & {
	icon?: LucideIcon;
	size?: number;
	variant?: Variant;
	haptic?: Haptics.ImpactFeedbackStyle;
	accessibilityLabel: string;
	className?: string;
	iconClassName?: string;
	children?: React.ReactNode;
}) {
	const dimension: ViewStyle = { width: size, height: size, borderRadius: size / 2 };
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			onPress={(e) => {
				if (haptic) Haptics.impactAsync(haptic).catch(() => {});
				onPress?.(e);
			}}
			style={dimension}
			className={cn(
				'items-center justify-center shadow-md shadow-black/20 active:scale-95 active:shadow-none',
				variant === 'primary' ? 'bg-primary' : 'bg-secondary',
				className
			)}
			{...props}>
			{icon ? (
				<Icon
					as={icon}
					className={cn(
						variant === 'primary' ? 'text-primary-foreground' : 'text-secondary-foreground',
						iconClassName
					)}
					size={size * 0.4}
					strokeWidth={2.5}
				/>
			) : (
				children
			)}
		</Pressable>
	);
}
