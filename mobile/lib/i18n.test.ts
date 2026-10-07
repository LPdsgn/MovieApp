import { getLanguage, type Key, setLanguage, STRINGS, t } from './i18n';

// jest.mock viene sollevato sopra gli import: la lingua del dispositivo è "it" in questo test.
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'it' }] }));

test('la lingua parte da quella del dispositivo', () => {
	expect(getLanguage()).toBe('it');
	expect(t('tab.discover')).toBe('Scopri');
});

test('ogni lingua ha tutte le chiavi, non vuote', () => {
	const keys = Object.keys(STRINGS.en) as Key[];
	for (const lang of ['it', 'de'] as const) {
		for (const key of keys) {
			expect(STRINGS[lang][key]).toBeTruthy();
		}
		expect(Object.keys(STRINGS[lang]).sort()).toEqual([...keys].sort());
	}
});

test('setLanguage cambia lingua', () => {
	setLanguage('de');
	expect(t('tab.watchlist')).toBe('Filmliste');
	setLanguage('en');
	expect(t('tab.watchlist')).toBe('Watchlist');
});

test('le etichette di swipe restano come nell’originale', () => {
	setLanguage('it');
	expect(t('swipe.yep')).toBe('YEP');
	expect(t('swipe.nope')).toBe('NOPE');
	expect(t('swipe.saved')).toBe('SALVATO');
});
