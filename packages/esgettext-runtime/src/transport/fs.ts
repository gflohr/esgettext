import { readFile } from 'fs';
import { Transport } from './transport.interface';

export class TransportFs implements Transport {
	loadFile(url: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			readFile(url, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
	}
}
