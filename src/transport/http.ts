import { Transport } from '../transport.interface';

export class TransportHttp implements Transport {
	loadFile(_url: string): Promise<string> {
		return new Promise((resolve, reject) => reject(new Error('not yet implemented')));
	}
}
