import '@/global.css';

import { ArtifactProvider } from '@/lib/artifact/provider';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUniwind } from 'uniwind';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
	const { theme } = useUniwind();

	return (
		<ThemeProvider value={NAV_THEME[theme ?? 'light']}>
			<StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
			<ArtifactProvider>
				<Stack />
			</ArtifactProvider>
			<PortalHost />
		</ThemeProvider>
	);
}
