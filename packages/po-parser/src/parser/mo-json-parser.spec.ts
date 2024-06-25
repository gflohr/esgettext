import * as fs from 'fs/promises';
import { MoJsonParser } from './mo-json-parser';

// This is just a smoke test. The underlying parser is tested in
// @esgettext/runtime.
describe('MO catalogues', () => {
	it('should read a catalogue', async () => {
		const mo = await fs.readFile('src/locale/de/LC_MESSAGES/po-test.mo.json');
		const rawCatalogue = new MoJsonParser().parse(mo);

		expect(rawCatalogue).toBeDefined();
		expect(rawCatalogue.entries.length).toBe(4);
	});

	it('should handle plural forms', async () => {
		const mo = await fs.readFile('src/locale/de/LC_MESSAGES/po-test.mo.json');
		const rawCatalogue = new MoJsonParser().parse(mo);

		expect(rawCatalogue).toBeDefined();

		const oneYear = rawCatalogue.getEntry('one year');
		expect(oneYear).toBeDefined();
		expect(oneYear?.properties.msgstr).toBeDefined();
		expect(oneYear?.properties.msgstr?.length).toBe(2);
	});

	it('should process message contexts', async () => {
		const mo = await fs.readFile('src/locale/de/LC_MESSAGES/po-test.mo.json');
		const rawCatalogue = new MoJsonParser().parse(mo);

		expect(rawCatalogue).toBeDefined();

		const calendarDate = rawCatalogue.getEntry('date');
		expect(calendarDate).toBeDefined();
		expect(calendarDate?.properties.msgstr?.[0]).toBe('Datum');

		const fruit = rawCatalogue.getEntry('date', 'fruit');
		expect(fruit).toBeDefined();
		expect(fruit?.properties.msgstr?.[0]).toBe('Dattel');
	});
});
