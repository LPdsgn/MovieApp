import { exitOffset, labelOpacities, restingRotation, rotationFor, swipeDecision } from './swipe';

const W = 393;
const H = 852;

test('swipeDecision con le soglie dell’originale', () => {
	expect(swipeDecision(W * 0.31, 0, W, H)).toBe('like');
	expect(swipeDecision(-W * 0.31, 0, W, H)).toBe('dislike');
	expect(swipeDecision(0, H * 0.21, W, H)).toBe('watchlist');
	expect(swipeDecision(W * 0.29, 0, W, H)).toBeNull();
	expect(swipeDecision(0, H * 0.19, W, H)).toBeNull();
	expect(swipeDecision(0, -H * 0.5, W, H)).toBeNull(); // verso l'alto non fa nulla
	// precedenza all'orizzontale quando entrambe le soglie sono superate
	expect(swipeDecision(W * 0.4, H * 0.4, W, H)).toBe('like');
});

test('rotationFor: 4° ogni 20% di larghezza', () => {
	expect(rotationFor(W * 0.2, W)).toBeCloseTo(4);
	expect(rotationFor(-W * 0.1, W)).toBeCloseTo(-2);
});

test('labelOpacities cresce con il gesto e resta in [0, 1]', () => {
	expect(labelOpacities(0, 0, W, H)).toEqual({ yep: 0, nope: 0, saved: 0 });
	expect(labelOpacities(W * 0.3, 0, W, H).yep).toBeCloseTo(0.5);
	expect(labelOpacities(W * 0.9, 0, W, H).yep).toBe(1);
	expect(labelOpacities(-W * 0.3, 0, W, H).nope).toBeCloseTo(0.5);
	expect(labelOpacities(0, H * 0.3, W, H).saved).toBeCloseTo(1);
	// il movimento orizzontale smorza SALVATO
	expect(labelOpacities(W * 0.1, H * 0.2, W, H).saved).toBeCloseTo(0.25);
});

test('exitOffset e restingRotation', () => {
	expect(exitOffset('like')).toEqual({ x: 500, y: 0, rotation: 15 });
	expect(exitOffset('dislike')).toEqual({ x: -500, y: 0, rotation: -15 });
	expect(exitOffset('watchlist')).toEqual({ x: 0, y: 800, rotation: 0 });
	expect(restingRotation(44578)).toBeGreaterThanOrEqual(-4);
	expect(restingRotation(44578)).toBeLessThanOrEqual(4);
	expect(restingRotation(1)).toBe(restingRotation(1));
});
