import { Transport } from './transport.interface';

/* eslint-disable @typescript-eslint/explicit-function-return-type */

export class TransportHttp implements Transport {
	loadFile(url: string): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.responseType = 'arraybuffer';
			xhr.open('GET', url, true);
			xhr.onload = () => {
				if (xhr.readyState === 4 && xhr.status === 200) {
					resolve(xhr.response);
				} else {
					reject(new Error('get failed with status ' + xhr.status));
				}
			};
			xhr.onerror = err => reject(err);
			xhr.send();
		});
	}
}
