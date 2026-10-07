import { parsePlatforms, serializePlatforms } from './platforms';

test('assente = tutte selezionate; il salvataggio è stabile e ignora id sconosciuti', () => {
	expect([...parsePlatforms(null)]).toEqual(['netflix', 'prime', 'disney', 'apple']);
	expect([...parsePlatforms('disney,netflix,hulu')]).toEqual(['disney', 'netflix']);
	expect(serializePlatforms(new Set(['apple', 'netflix']))).toBe('netflix,apple');
	expect(serializePlatforms(new Set())).toBe('');
	expect([...parsePlatforms('')]).toEqual([]);
});
