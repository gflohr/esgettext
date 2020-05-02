import { Transport } from './transport.interface';

export class TransportHttp implements Transport {
	loadFile(url: string): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onload = () => {
				if (xhr.readyState === 4 && xhr.status === 200) {
					resolve(xhr.response);
				} else {
					reject(new Error('get failed with status ' + xhr.status));
				}
			};
			xhr.onerror = (err) => reject(err);
		});
	}
}
