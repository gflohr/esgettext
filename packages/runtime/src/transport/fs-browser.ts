import { Transport } from './transport.interface';

export class TransportFs implements Transport {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	loadFile(_: string): Promise<ArrayBuffer> {
		return new Promise((_, reject) => {
			reject();
		});
	}
}
