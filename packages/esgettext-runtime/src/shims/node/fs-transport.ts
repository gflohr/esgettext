import { readFile } from 'fs';
import { Transport } from '../../core/transport';

export class TransportFs implements Transport {
	get(url: string): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			readFile(url, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
	}
}
