import { decode, encodingExists } from 'iconv-lite';

export class CharsetConverter {
	decode(buffer: Buffer, encoding: string): string {
		return decode(buffer, encoding);
	}

	encodingExists(encoding: string): boolean {
		return encodingExists(encoding);
	}
}
