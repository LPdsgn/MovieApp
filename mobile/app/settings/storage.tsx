import { useQueryClient } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { type Key, t } from '@/lib/i18n';
import { clearHistory, clearWatchlist, resetRecommendations } from '@/lib/userdb';
import { useUserDb } from '@/lib/userdb/provider';

/**
 * Memoria: le tre azioni dell'originale più "azzera le raccomandazioni" (decisione del 07/10/2026:
 * svuotare lo storico nasconde, azzerare cancella gli eventi). Ogni azione chiede conferma.
 */
export default function StorageScreen() {
	const user = useUserDb();
	const queryClient = useQueryClient();

	const actions: {
		label: Key;
		confirm: Key;
		variant: 'default' | 'secondary' | 'ghost';
		run: () => Promise<unknown>;
	}[] = [
		{
			label: 'storage.clearWatchlist',
			confirm: 'storage.confirmWatchlist',
			variant: 'default',
			run: () => clearWatchlist(user),
		},
		{
			label: 'storage.clearHistory',
			confirm: 'storage.confirmHistory',
			variant: 'secondary',
			run: () => clearHistory(user),
		},
		{
			label: 'storage.resetRecommendations',
			confirm: 'storage.confirmReset',
			variant: 'secondary',
			run: () => resetRecommendations(user),
		},
		{
			label: 'storage.clearCache',
			confirm: 'storage.confirmCache',
			variant: 'ghost',
			run: async () => {
				await Promise.all([ExpoImage.clearDiskCache(), ExpoImage.clearMemoryCache()]);
				queryClient.clear();
			},
		},
	];

	return (
		<Screen>
			<View className="flex-1 justify-center gap-6 px-4">
				{actions.map((a) => (
					<ConfirmButton
						key={a.label}
						label={t(a.label)}
						confirm={t(a.confirm)}
						variant={a.variant}
						onConfirm={a.run}
					/>
				))}
			</View>
		</Screen>
	);
}

function ConfirmButton({
	label,
	confirm,
	variant,
	onConfirm,
}: {
	label: string;
	confirm: string;
	variant: 'default' | 'secondary' | 'ghost';
	onConfirm: () => Promise<unknown>;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant={variant} size="lg" className="rounded-lg">
					<Text
						className={
							variant === 'default'
								? 'text-primary-foreground'
								: variant === 'ghost'
									? 'text-primary'
									: 'text-white'
						}>
						{label}
					</Text>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{label}</AlertDialogTitle>
					<AlertDialogDescription>{confirm}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						<Text>{t('common.cancel')}</Text>
					</AlertDialogCancel>
					<AlertDialogAction onPress={() => onConfirm().catch(() => {})}>
						<Text>{t('storage.clear')}</Text>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
