import { readFile } from 'fs';
import { Transport } from '../transport.interface';

export class TransportFs implements Transport {
	loadFile(url: string, encoding: string): Promise<string> {
		return new Promise(function (resolve, reject) {
			readFile(url, encoding, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
	}
}
