import { readFile } from 'fs';
import { promisify } from 'util';
import * as gtx from '../index';

describe('parse MO', () => {
	describe('mytest.mo parsed', () => {
		let catalog: gtx.Catalog;
		const filename = 'src/assets/locale/de/LC_MESSAGES/mytest.mo';

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

		it('should have a translation for "Open ..." with context', () => {
			const trans = ['Öffnen ...'];
			expect(catalog.entries['Menu\u0004Open ...']).toEqual(trans);
		});

		it('should have two translations for "Hello, world!"', () => {
			const trans = ['Hallo, Welt!', 'Hallo, Welten!'];
			expect(catalog.entries['Hello, world!']).toEqual(trans);
		});

		it('should have two translations for "Hello, world!" with context', () => {
			const trans = ['Hallo, Welt!', 'Hallo, Welten!'];
			expect(catalog.entries['duplicate\u0004Hello, world!']).toEqual(trans);
		});
	});

	describe('revision1.mo parsed', () => {
		const filename = 'src/assets/locale/de/LC_MESSAGES/revision1.mo';

		it('should throw an exception', async () => {
			const raw = await promisify(readFile)(filename);
			expect(() => gtx.parseMO(raw)).toThrow('unsupported major revision 1');
		});
	});

	describe('de.po parsed', () => {
		const filename = 'src/assets/locale/de/LC_MESSAGES/mytest.po';

		it('should throw an exception', async () => {
			const raw = await promisify(readFile)(filename);
			expect(() => gtx.parseMO(raw)).toThrow('mo file corrupted');
		});
	});
});
