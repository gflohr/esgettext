import got from 'got';
import { Transport } from './transport.interface';

export class TransportHttp implements Transport {
	loadFile(url: string, _encoding: string): Promise<string> {
		return new Promise((resolve, reject) => {
			got(url)
				.then((response: { body: string | PromiseLike<string> }) =>
					resolve(response.body),
				)
				.catch((e: string) => reject(e));
		});
	}
}
