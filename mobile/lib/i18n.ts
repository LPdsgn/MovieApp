/**
 * Stringhe dell'app in it, en, de, come l'originale, con fallback inglese.
 * Dizionario tipizzato fatto in casa: niente plurali né interpolazione, quindi niente libreria.
 * Chiavi dell'originale corrette (docs/specifica-ui.md) più quelle che l'originale non traduceva.
 */

import { deviceLanguage } from '@/lib/tmdb/hooks';
import type { Language } from '@/lib/tmdb';

const en = {
	// Tab
	'tab.discover': 'Discover',
	'tab.watchlist': 'Watchlist',
	'tab.settings': 'Settings',
	// Discover
	'discover.cta': 'Tap to start!',
	'discover.history': 'History',
	'discover.error': 'Could not load movies',
	'common.retry': 'Retry',
	'common.close': 'Close',
	'common.cancel': 'Cancel',
	'common.back': 'Back',
	// Mazzo
	'swipe.yep': 'YEP',
	'swipe.nope': 'NOPE',
	'swipe.saved': 'SAVED',
	'swipe.discard': 'Discard',
	'swipe.like': 'Like',
	'swipe.save': 'Save to watchlist',
	'swipe.open': 'Open details',
	'swipe.empty': 'No more movies for now',
	// Storico
	'history.title': 'History',
	'history.filter': 'Filter',
	'history.loved': 'Loved',
	'history.discarded': 'Discarded',
	'history.all': 'All',
	'history.empty': 'The movies you swipe will show up here',
	// Watchlist
	'watchlist.empty': 'Bookmark movies to find them here',
	'watchlist.search': 'Search',
	// Dettaglio
	'movie.cast': 'Actors',
	'movie.streaming': 'Available for streaming on',
	'movie.rent': 'Available to rent on',
	'movie.buy': 'Available to buy on',
	'movie.providersBy': 'Streaming data by JustWatch',
	'movie.bookmark': 'Save to watchlist',
	'movie.unbookmark': 'Remove from watchlist',
	'movie.error': 'Could not load this movie',
	// Impostazioni
	'settings.platforms': 'Streaming platforms',
	'settings.storage': 'Storage',
	'settings.about': 'About',
	'settings.content': 'Content',
	'settings.adult': 'Show adult content',
	'storage.clearWatchlist': 'Clear watchlist',
	'storage.clearHistory': 'Clear history',
	'storage.resetRecommendations': 'Reset recommendations',
	'storage.clearCache': 'Clear image cache',
	'storage.confirmWatchlist': 'Clear the whole watchlist?',
	'storage.confirmHistory': 'Hide the whole history? Your recommendations keep learning from it.',
	'storage.confirmReset':
		'Reset recommendations? All your swipes are deleted and the app starts over.',
	'storage.confirmCache': 'Clear cached images?',
	'storage.clear': 'Clear',
	// About
	'about.text':
		'MoovieFinder is an intuitive tool to find something new to watch in an easy way, powered by dynamic suggestions automatically updated according to your previous choices.',
	'about.contributions': 'Contributions',
	'about.tmdb': 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
	'about.wikidata':
		'Movie catalogue and recommendation features come from Wikidata, released under CC0.',
	'about.team': 'MoovieFinder is brought to you by',
} as const;

export type Key = keyof typeof en;
type Dictionary = Record<Key, string>;

const it: Dictionary = {
	'tab.discover': 'Scopri',
	'tab.watchlist': 'Lista film',
	'tab.settings': 'Impostazioni',
	'discover.cta': 'Tocca per iniziare!',
	'discover.history': 'Cronologia',
	'discover.error': 'Impossibile caricare i film',
	'common.retry': 'Riprova',
	'common.close': 'Chiudi',
	'common.cancel': 'Annulla',
	'common.back': 'Indietro',
	'swipe.yep': 'YEP',
	'swipe.nope': 'NOPE',
	'swipe.saved': 'SALVATO',
	'swipe.discard': 'Scarta',
	'swipe.like': 'Mi piace',
	'swipe.save': 'Salva nella lista film',
	'swipe.open': 'Apri il dettaglio',
	'swipe.empty': 'Per ora non ci sono altri film',
	'history.title': 'Cronologia',
	'history.filter': 'Filtra',
	'history.loved': 'Piaciuti',
	'history.discarded': 'Scartati',
	'history.all': 'Tutti',
	'history.empty': 'I film che fai scorrere compariranno qui',
	'watchlist.empty': 'Aggiungi i film alla lista per trovarli qui',
	'watchlist.search': 'Cerca',
	'movie.cast': 'Attori',
	'movie.streaming': 'Disponibile per lo streaming su',
	'movie.rent': 'Disponibile per il noleggio su',
	'movie.buy': "Disponibile per l'acquisto su",
	'movie.providersBy': 'Dati di streaming di JustWatch',
	'movie.bookmark': 'Salva nella lista film',
	'movie.unbookmark': 'Togli dalla lista film',
	'movie.error': 'Impossibile caricare questo film',
	'settings.platforms': 'Piattaforme di streaming',
	'settings.storage': 'Memoria',
	'settings.about': 'Informazioni',
	'settings.content': 'Contenuti',
	'settings.adult': 'Mostra contenuti per adulti',
	'storage.clearWatchlist': 'Svuota la lista film',
	'storage.clearHistory': 'Svuota la cronologia',
	'storage.resetRecommendations': 'Azzera le raccomandazioni',
	'storage.clearCache': 'Svuota la cache delle immagini',
	'storage.confirmWatchlist': 'Svuotare tutta la lista film?',
	'storage.confirmHistory':
		'Nascondere tutta la cronologia? Le raccomandazioni continuano a tenerne conto.',
	'storage.confirmReset':
		"Azzerare le raccomandazioni? Tutti i tuoi swipe vengono cancellati e l'app riparte da zero.",
	'storage.confirmCache': 'Svuotare le immagini in cache?',
	'storage.clear': 'Svuota',
	'about.text':
		'MoovieFinder è uno strumento intuitivo per trovare qualcosa di nuovo da guardare in modo semplice, alimentato da suggerimenti dinamici aggiornati automaticamente in base alle tue scelte precedenti.',
	'about.contributions': 'Contributi',
	'about.tmdb':
		"Questo prodotto utilizza l'API di TMDB ma non è approvato né certificato da TMDB.",
	'about.wikidata':
		'Catalogo dei film e caratteristiche per le raccomandazioni provengono da Wikidata, con licenza CC0.',
	'about.team': 'MoovieFinder è realizzato da',
};

const de: Dictionary = {
	'tab.discover': 'Entdecken',
	'tab.watchlist': 'Filmliste',
	'tab.settings': 'Einstellungen',
	'discover.cta': 'Zum Starten tippen!',
	'discover.history': 'Verlauf',
	'discover.error': 'Filme konnten nicht geladen werden',
	'common.retry': 'Erneut versuchen',
	'common.close': 'Schließen',
	'common.cancel': 'Abbrechen',
	'common.back': 'Zurück',
	'swipe.yep': 'YEP',
	'swipe.nope': 'NOPE',
	'swipe.saved': 'GESPEICHERT',
	'swipe.discard': 'Verwerfen',
	'swipe.like': 'Gefällt mir',
	'swipe.save': 'In die Filmliste speichern',
	'swipe.open': 'Details öffnen',
	'swipe.empty': 'Im Moment keine weiteren Filme',
	'history.title': 'Verlauf',
	'history.filter': 'Filtern',
	'history.loved': 'Gefallen',
	'history.discarded': 'Verworfen',
	'history.all': 'Alle',
	'history.empty': 'Die Filme, die du wischst, erscheinen hier',
	'watchlist.empty': 'Speichere Filme, um sie hier zu finden',
	'watchlist.search': 'Suchen',
	'movie.cast': 'Schauspieler',
	'movie.streaming': 'Zum Streamen verfügbar bei',
	'movie.rent': 'Zur Miete verfügbar bei',
	'movie.buy': 'Zum Kauf verfügbar bei',
	'movie.providersBy': 'Streaming-Daten von JustWatch',
	'movie.bookmark': 'In die Filmliste speichern',
	'movie.unbookmark': 'Aus der Filmliste entfernen',
	'movie.error': 'Dieser Film konnte nicht geladen werden',
	'settings.platforms': 'Streaming-Plattformen',
	'settings.storage': 'Speicher',
	'settings.about': 'Über',
	'settings.content': 'Inhalte',
	'settings.adult': 'Inhalte für Erwachsene anzeigen',
	'storage.clearWatchlist': 'Filmliste leeren',
	'storage.clearHistory': 'Verlauf leeren',
	'storage.resetRecommendations': 'Empfehlungen zurücksetzen',
	'storage.clearCache': 'Bild-Cache leeren',
	'storage.confirmWatchlist': 'Die ganze Filmliste leeren?',
	'storage.confirmHistory':
		'Den ganzen Verlauf ausblenden? Die Empfehlungen lernen weiterhin daraus.',
	'storage.confirmReset':
		'Empfehlungen zurücksetzen? Alle deine Wischgesten werden gelöscht und die App beginnt von vorn.',
	'storage.confirmCache': 'Zwischengespeicherte Bilder löschen?',
	'storage.clear': 'Leeren',
	'about.text':
		'MoovieFinder ist ein intuitives Werkzeug, um auf einfache Weise etwas Neues zum Anschauen zu finden, mit dynamischen Vorschlägen, die sich automatisch an deine bisherigen Entscheidungen anpassen.',
	'about.contributions': 'Beiträge',
	'about.tmdb':
		'Dieses Produkt verwendet die TMDB-API, wird aber von TMDB weder unterstützt noch zertifiziert.',
	'about.wikidata':
		'Filmkatalog und Merkmale für die Empfehlungen stammen aus Wikidata, veröffentlicht unter CC0.',
	'about.team': 'MoovieFinder wird dir präsentiert von',
};

export const STRINGS: Record<Language, Dictionary> = { en, it, de };

let current: Language = deviceLanguage();

/** Per i test e, in futuro, per un'impostazione della lingua. */
export function setLanguage(language: Language): void {
	current = language;
}

export function getLanguage(): Language {
	return current;
}

export function t(key: Key): string {
	return STRINGS[current][key] ?? en[key];
}
