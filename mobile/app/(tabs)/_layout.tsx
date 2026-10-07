import { Tabs } from 'expo-router';
import { BookmarkIcon, GlobeIcon, SettingsIcon } from 'lucide-react-native';
import * as React from 'react';

import { Icon } from '@/components/ui/icon';
import { t } from '@/lib/i18n';
import { COLORS } from '@/lib/theme';

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: COLORS.accent,
				tabBarInactiveTintColor: COLORS.ink600,
				tabBarStyle: { backgroundColor: COLORS.ink800, borderTopColor: COLORS.ink700 },
				sceneStyle: { backgroundColor: COLORS.ink800 },
			}}>
			<Tabs.Screen
				name="index"
				options={{
					title: t('tab.discover'),
					tabBarIcon: ({ color, size }) => <Icon as={GlobeIcon} color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="watchlist"
				options={{
					title: t('tab.watchlist'),
					tabBarIcon: ({ color, size }) => (
						<Icon as={BookmarkIcon} color={color} size={size} fill={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: t('tab.settings'),
					tabBarIcon: ({ color, size }) => (
						<Icon as={SettingsIcon} color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
