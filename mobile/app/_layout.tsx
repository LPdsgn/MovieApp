import '@/global.css';

import { ArtifactProvider } from '@/lib/artifact/provider';
import { NAV_THEME } from '@/lib/theme';
import { queryClient } from '@/lib/tmdb/hooks';
import { UserDbProvider } from '@/lib/userdb/provider';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
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
			<QueryClientProvider client={queryClient}>
				<ArtifactProvider>
					<UserDbProvider>
						<Stack />
					</UserDbProvider>
				</ArtifactProvider>
			</QueryClientProvider>
			<PortalHost />
		</ThemeProvider>
	);
}
