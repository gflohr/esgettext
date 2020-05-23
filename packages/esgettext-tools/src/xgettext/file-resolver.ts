import { join } from 'path';
import { existsSync } from 'fs';

export class FileResolver {
	constructor(private readonly directories: Array<string> = ['']) {}

	resolve(filename: string): string {
		for (let i = 0; i < this.directories.length; ++i) {
			const resolved = join(this.directories[i], filename);
			if (existsSync(resolved)) {
				return resolved;
			}
		}

		return null;
	}
}
