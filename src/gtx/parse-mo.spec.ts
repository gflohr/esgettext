import { readFile } from 'fs';
import { promisify } from 'util';
import * as gtx from '../index';

describe('parse MO', () => {
	describe('de.mo parsed', () => {
		let catalog: gtx.Catalog;
		const filename = 'src/assets/po/de.mo';

		beforeAll(async () => {
			const raw = await promisify(readFile)(filename);
			catalog = gtx.parseMO(raw);
		});

		it('should not be null', () => {
			expect(catalog).not.toBeNull();
		});

		it('should have be of major revision 0', () => {
			expect(catalog.major).toEqual(0);
		});

		it('should have be of minor revision 0', () => {
			expect(catalog.minor).toEqual(0);
		});
	});
});
