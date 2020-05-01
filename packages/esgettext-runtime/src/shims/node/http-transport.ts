import Axios from 'axios';
import { Transport } from '../../core/transport';

export class HttpTransport implements Transport {
	get(url: string): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			Axios.get(url, {
				responseType: 'arraybuffer',
			})
				.then((response) => resolve(response.data as ArrayBuffer))
				.catch((err) => reject(err));
		});
	}
}
