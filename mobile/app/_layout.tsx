import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaListener, SafeAreaProvider } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { ArtifactProvider } from '@/lib/artifact/provider';
import { NAV_THEME } from '@/lib/theme';
import { queryClient } from '@/lib/tmdb/hooks';
import { UserDbProvider } from '@/lib/userdb/provider';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

// Tema solo scuro, come l'originale: deciso prima del primo render, niente cambio a runtime.
Uniwind.setTheme('dark');

export default function RootLayout() {
	return (
		<GestureHandlerRootView className="flex-1">
			{/* Uniwind free: le utility *-safe leggono gli inset da qui (il Pro li inietta da solo). */}
			<SafeAreaProvider>
				<SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
					<ThemeProvider value={NAV_THEME}>
						<StatusBar style="light" />
						<QueryClientProvider client={queryClient}>
							<ArtifactProvider>
								<UserDbProvider>
									<Stack
										screenOptions={{
											headerTransparent: true,
											headerTintColor: NAV_THEME.colors.primary,
											headerTitleStyle: { color: NAV_THEME.colors.text },
											headerBackButtonDisplayMode: 'minimal',
											contentStyle: { backgroundColor: NAV_THEME.colors.background },
										}}>
										<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
										<Stack.Screen
											name="swipe"
											options={{ presentation: 'fullScreenModal' }}
										/>
										<Stack.Screen name="history" />
										<Stack.Screen
											name="movie/[tmdbId]"
											options={{
												// Page sheet iOS con chiusura trascinando. Non formSheet: lì la ScrollView non viene disegnata.
												presentation: 'modal',
												headerShown: false,
											}}
										/>
									</Stack>
								</UserDbProvider>
							</ArtifactProvider>
						</QueryClientProvider>
						<PortalHost />
					</ThemeProvider>
				</SafeAreaListener>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
