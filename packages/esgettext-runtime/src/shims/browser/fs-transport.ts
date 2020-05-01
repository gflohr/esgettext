import { Transport } from '../../core/transport';

export class FsTransport implements Transport {
	get(_url: string): Promise<ArrayBuffer> {
		throw new Error('file system not available in the browser');
	}
}
