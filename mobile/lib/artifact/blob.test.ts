import { decodeNeighbors, NEIGHBOR_RECORD_BYTES } from './blob';

function encode(entries: [qid: number, score: number][]): Uint8Array {
	const out = new Uint8Array(entries.length * NEIGHBOR_RECORD_BYTES);
	const view = new DataView(out.buffer);
	entries.forEach(([qid, score], i) => {
		view.setUint32(i * NEIGHBOR_RECORD_BYTES, qid, true);
		view.setUint16(i * NEIGHBOR_RECORD_BYTES + 4, Math.round(score * 65535), true);
	});
	return out;
}

test('decodifica i record nell’ordine del BLOB', () => {
	const blob = encode([
		[983912, 0.18],
		[4294967295, 1],
		[1, 0],
	]);
	const out = decodeNeighbors(blob);
	expect(out.map((n) => n.qid)).toEqual([983912, 4294967295, 1]);
	expect(out[0].score).toBeCloseTo(0.18, 4);
	expect(out[1].score).toBe(1);
	expect(out[2].score).toBe(0);
});

test('accetta un BLOB vuoto e una vista con offset', () => {
	expect(decodeNeighbors(new Uint8Array(0))).toEqual([]);
	const padded = new Uint8Array(2 + NEIGHBOR_RECORD_BYTES);
	padded.set(encode([[7, 0.5]]), 2);
	expect(decodeNeighbors(padded.subarray(2))).toEqual([{ qid: 7, score: expect.closeTo(0.5, 4) }]);
});

test('rifiuta una lunghezza non multipla del record', () => {
	expect(() => decodeNeighbors(new Uint8Array(7))).toThrow(/malformato/);
});
