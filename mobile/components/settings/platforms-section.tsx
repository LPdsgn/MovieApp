import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import {
	parsePlatforms,
	type PlatformId,
	PLATFORMS,
	PLATFORMS_SETTING,
	serializePlatforms,
} from '@/lib/platforms';
import { getSetting, setSetting } from '@/lib/userdb';
import { useUserDb } from '@/lib/userdb/provider';

/** Piattaforme di streaming: quattro voci fisse con spunta, salvate in `settings` (l'originale non le salvava). */
export function PlatformsSection() {
	const user = useUserDb();
	const [selected, setSelected] = React.useState<Set<PlatformId> | null>(null);

	React.useEffect(() => {
		let cancelled = false;
		getSetting(user, PLATFORMS_SETTING).then((v) => {
			if (!cancelled) setSelected(parsePlatforms(v));
		});
		return () => {
			cancelled = true;
		};
	}, [user]);

	const toggle = (id: PlatformId) => {
		if (!selected) return;
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		setSelected(next);
		setSetting(user, PLATFORMS_SETTING, serializePlatforms(next)).catch(() => {});
	};

	return (
		<View>
			{PLATFORMS.map((p) => {
				const checked = selected?.has(p.id) ?? false;
				return (
					<React.Fragment key={p.id}>
						<Pressable
							accessibilityRole="checkbox"
							accessibilityState={{ checked }}
							accessibilityLabel={p.name}
							onPress={() => toggle(p.id)}
							className="flex-row items-center justify-between py-4 active:opacity-60">
							<Text className="text-lg text-foreground">{p.name}</Text>
							<Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
						</Pressable>
						<Separator className="bg-white/10" />
					</React.Fragment>
				);
			})}
		</View>
	);
}
