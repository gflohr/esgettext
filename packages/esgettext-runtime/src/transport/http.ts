import superagent from 'superagent';
import { Transport } from './transport.interface';

export class TransportHttp implements Transport {
	loadFile(url: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			superagent
				.get(url)
				.then((response: { body: string | PromiseLike<string> }) =>
					resolve(Buffer.from(response.body)),
				)
				.catch((e: string) => reject(e));
		});
	}
}
