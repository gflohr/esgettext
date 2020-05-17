import { Catalog } from '../pot/catalog';
import { Parser } from './parser';

export class JavaScriptParser extends Parser {
	private catalog: Catalog;

	constructor(private readonly warner: (msg: string) => void) {
		super();
	}

	parse(buf: Buffer, filename: string, encoding?: string): Catalog {
		// Reset.
		this.catalog = new Catalog({ fromCode: encoding, noHeader: true });

		return this.catalog;
	}
}
