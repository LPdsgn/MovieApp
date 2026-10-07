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
	// Skeumorfismo dell'originale: ombra esterna nera 20% (sparisce da premuto), riflesso bianco sul bordo
	// superiore e ombra interna sul bordo inferiore. Le ombre inset esistono da React Native 0.76.
	const relief = (pressed: boolean): ViewStyle => ({
		boxShadow: [
			...(pressed ? [] : ['0 5px 5px rgba(0, 0, 0, 0.2)']),
			'inset 0 2px 1px rgba(255, 255, 255, 0.25)',
			'inset 0 -3px 3px rgba(0, 0, 0, 0.18)',
		].join(', '),
		transform: [{ scale: pressed ? 0.95 : 1 }],
	});
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			onPress={(e) => {
				if (haptic) Haptics.impactAsync(haptic).catch(() => {});
				onPress?.(e);
			}}
			style={({ pressed }) => [dimension, relief(pressed)]}
			className={cn(
				'items-center justify-center',
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
