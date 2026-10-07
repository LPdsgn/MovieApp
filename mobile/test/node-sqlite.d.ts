// Il minimo di node:sqlite che usano i test. Niente @types/node: i suoi globali
// confliggono con quelli di React Native.
declare module 'node:sqlite' {
	export class DatabaseSync {
		constructor(path: string, options?: { readOnly?: boolean });
		exec(sql: string): void;
		prepare(sql: string): {
			run(...params: unknown[]): unknown;
			get(...params: unknown[]): unknown;
			all(...params: unknown[]): unknown[];
		};
		close(): void;
	}
}

declare module 'node:fs' {
	export function existsSync(path: string): boolean;
}

// Fornito da jest ai test; il tsconfig non include i tipi di node.
declare const __dirname: string;
