/** Preferenze dell'utente nella tabella `settings`, con default. */

import { type Db, getSetting, setSetting } from '@/lib/userdb';

export const SHOW_ADULT_SETTING = 'show_adult';

/** "Mostra contenuti per adulti": spenta per default (decisione del 07/10/2026). */
export async function getShowAdult(db: Db): Promise<boolean> {
	return (await getSetting(db, SHOW_ADULT_SETTING)) === '1';
}

export function setShowAdult(db: Db, value: boolean): Promise<void> {
	return setSetting(db, SHOW_ADULT_SETTING, value ? '1' : '0');
}
