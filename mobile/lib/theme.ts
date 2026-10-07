import { DarkTheme, type Theme } from 'expo-router/react-navigation';

/** Stessi valori di global.css (palette dei colorset Swift), per React Navigation. Tema solo scuro. */
export const COLORS = {
	accent: '#FFD400',
	accentDark: '#FFC300',
	ink600: '#797979',
	ink650: '#5B5B5B',
	ink700: '#3D3D3D',
	ink800: '#1F1F1F',
	ink900: '#0A0A0A',
	white: '#FFFFFF',
	destructive: '#E5484D',
} as const;

export const NAV_THEME: Theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: COLORS.ink800,
		border: COLORS.ink650,
		card: COLORS.ink800,
		notification: COLORS.destructive,
		primary: COLORS.accent,
		text: COLORS.white,
	},
};
