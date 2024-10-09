import { promises as fs } from 'fs';
import { Transport } from './transport.interface';

export class TransportFs implements Transport {
	async loadFile(filename: string): Promise<ArrayBuffer> {
		const data = await fs.readFile(filename);

		return data.buffer.slice(
			data.byteOffset,
			data.byteOffset + data.byteLength,
		) as ArrayBuffer;
	}
}
