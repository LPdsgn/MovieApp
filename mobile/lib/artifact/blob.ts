/**
 * Decodifica del BLOB della tabella `neighbors` dell'artefatto.
 *
 * Formato (schema versione 2, vedi pipeline/src/moovie_pipeline/artifact.py):
 * K record da 6 byte, little-endian, dal più simile: uint32 qid del vicino, uint16 coseno × 65535.
 */

export const NEIGHBOR_RECORD_BYTES = 6;
const SCORE_SCALE = 65535;

export interface Neighbor {
	qid: number;
	score: number;
}

export function decodeNeighbors(blob: Uint8Array): Neighbor[] {
	if (blob.byteLength % NEIGHBOR_RECORD_BYTES !== 0) {
		throw new Error(`BLOB dei vicini malformato: ${blob.byteLength} byte`);
	}
	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	const out: Neighbor[] = [];
	for (let offset = 0; offset < blob.byteLength; offset += NEIGHBOR_RECORD_BYTES) {
		out.push({
			qid: view.getUint32(offset, true),
			score: view.getUint16(offset + 4, true) / SCORE_SCALE,
		});
	}
	return out;
}
