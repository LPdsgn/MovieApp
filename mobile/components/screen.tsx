import * as React from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from '@/components/styled';
import { COLORS } from '@/lib/theme';

/** Sfondo di ogni schermata: gradiente verticale Gray-700 → Gray-800, come `withBackground()` dell'originale. */
export function Screen({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<LinearGradient
			colors={[COLORS.ink700, COLORS.ink800]}
			style={StyleSheet.absoluteFill}
			className={className ?? 'flex-1'}>
			{children}
		</LinearGradient>
	);
}
