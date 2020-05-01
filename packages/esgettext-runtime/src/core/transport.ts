export interface Transport {
	get: (path: string) => Promise<ArrayBuffer>;
}
