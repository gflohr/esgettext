import { readFile } from 'fs';
import { Transport } from './transport.interface';

export class TransportFs implements Transport {
	loadFile(url: string): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			readFile(url, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
	}
}
