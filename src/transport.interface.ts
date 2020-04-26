export interface Transport {
	loadFile(url: string, encoding: string): Promise<string>;
}
