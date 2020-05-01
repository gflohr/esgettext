export class CharsetConverter {
	decode(buffer: Buffer, encoding: string): string {
		if (encoding !== 'utf-8') {
			throw new Error('browser supports only utf-8 encoding');
		}

		return buffer.toString('utf-8');
	}

	encodingExists(encoding: string): boolean {
		return encoding.toLowerCase() === 'utf-8';
	}
}
