/**
 * Geometria dello swipe, pura e con le soglie dell'originale (`swipableCard.swift`, `MovieCard.swift`).
 * Le funzioni sono worklet: Reanimated le chiama sul thread UI dentro gesti e stili animati.
 * Lavora in frazioni dello schermo: `px` = spostamento orizzontale / larghezza, `py` = verticale / altezza.
 */

import type { Action } from '@/lib/userdb';

export const SWIPE = {
	/** Oltre questa frazione della larghezza, a destra è like e a sinistra scarto. */
	horizontal: 0.3,
	/** Oltre questa frazione dell'altezza verso il basso è watchlist. */
	vertical: 0.2,
	/** Offset di uscita in punti, come l'originale. */
	exitX: 500,
	exitY: 800,
	/** Durata dell'uscita in ms. */
	duration: 300,
} as const;

/** Azione decisa al rilascio, o null se la carta torna a posto. Precedenza: destra, sinistra, giù. */
export function swipeDecision(
	dx: number,
	dy: number,
	width: number,
	height: number
): Action | null {
	'worklet';
	const px = dx / width;
	const py = dy / height;
	if (px > SWIPE.horizontal) return 'like';
	if (px < -SWIPE.horizontal) return 'dislike';
	if (py > SWIPE.vertical) return 'watchlist';
	return null;
}

/** Rotazione in gradi durante il trascinamento: `(px / 0,2) × 4`. */
export function rotationFor(dx: number, width: number): number {
	'worklet';
	return (dx / width / 0.2) * 4;
}

/** Opacità delle etichette YEP, NOPE e SALVATO, in [0, 1], con le formule dell'originale. */
export function labelOpacities(
	dx: number,
	dy: number,
	width: number,
	height: number
): { yep: number; nope: number; saved: number } {
	'worklet';
	const px = dx / width;
	const py = dy / height;
	const clamp = (v: number) => Math.min(1, Math.max(0, v));
	const vertical = (py - 0.1) * 5;
	return {
		yep: clamp((px - 0.2) * 5),
		nope: clamp((px + 0.2) * -5),
		saved: clamp(vertical - Math.abs(vertical * (px / 0.2))),
	};
}

/** Dove esce la carta per ogni azione, in punti. */
export function exitOffset(action: Action): { x: number; y: number; rotation: number } {
	'worklet';
	switch (action) {
		case 'like':
			return { x: SWIPE.exitX, y: 0, rotation: 15 };
		case 'dislike':
			return { x: -SWIPE.exitX, y: 0, rotation: -15 };
		case 'watchlist':
			return { x: 0, y: SWIPE.exitY, rotation: 0 };
	}
}

/** Rotazione di riposo di una carta nel mazzo, fra −4° e +4°, stabile per film (niente scatti al re-render). */
export function restingRotation(qid: number): number {
	return (qid % 9) - 4;
}
