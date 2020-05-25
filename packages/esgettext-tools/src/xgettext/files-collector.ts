import { readFileSync } from 'fs';
import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('esgettext-tools');

export class FilesCollector {
	readonly filenames: Array<string>;

	constructor(filesFrom: Array<string>, args: Array<string>) {
		if (typeof filesFrom === 'undefined' && args.length === 0) {
			throw new Error(gtx._('no input file given'));
		}

		const filenames = new Array<string>();
		if (typeof filesFrom !== 'undefined') {
			filesFrom.forEach(fromFile => {
				this.getFilesFromFile(fromFile).forEach(filename => {
					filenames.push(filename);
				});
			});
		}

		args.forEach(filename => filenames.push(filename));

		// Make filenames unique.
		this.filenames = Array.from(new Set(filenames));
	}

	private getFilesFromFile(filename: string): Array<string> {
		return readFileSync(filename)
			.toString()
			.split('\n')
			.map(line => line.replace(/#.*/, '').trim())
			.filter(line => line.length);
	}
}
