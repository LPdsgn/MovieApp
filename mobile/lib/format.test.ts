import { formatRuntime, starsOf, yearOf } from './format';

test('formatRuntime come l’originale', () => {
	expect(formatRuntime(100)).toBe('1h40m');
	expect(formatRuntime(60)).toBe('1h0m');
	expect(formatRuntime(45)).toBe('0h45m');
	expect(formatRuntime(null)).toBe('-');
	expect(formatRuntime(0)).toBe('-');
});

test('yearOf', () => {
	expect(yearOf('1997-11-18')).toBe('1997');
	expect(yearOf('')).toBe('-');
	expect(yearOf(undefined)).toBe('-');
});

test('starsOf arrotonda il voto su 10 a stelle su 5', () => {
	expect(starsOf(6.4)).toBe(3);
	expect(starsOf(10)).toBe(5);
	expect(starsOf(0.4)).toBe(0);
	expect(starsOf(null)).toBe(0);
});
