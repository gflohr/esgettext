export interface Transport {
	loadFile(url: string): Promise<ArrayBuffer>;
}
