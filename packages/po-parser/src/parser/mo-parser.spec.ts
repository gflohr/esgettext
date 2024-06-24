import * as fs from 'fs/promises';
import { MoParser } from './mo-parser';

// This is just a smoke test. The underlying parser is tested in
// @esgettext/runtime.
describe('MO catalogues', () => {
	it('should read a catalogue', async () => {
		const mo = await fs.readFile('src/locale/de/LC_MESSAGES/po-test.mo');
		const rawCatalogue = new MoParser().parse(mo);

		expect(rawCatalogue).toBeDefined();
		expect(rawCatalogue.entries.length).toBe(4);
	});
});
