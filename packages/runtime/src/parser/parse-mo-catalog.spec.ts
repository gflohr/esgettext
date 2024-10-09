import { TransportFs } from '../transport';
import { parseMoCatalog } from './parse-mo-catalog';

const transport = new TransportFs();

describe('MO catalogs', () => {
	it('should read little-endian catalogs', async () => {
		return transport
			.loadFile('src/locale/de_AT/LC_MESSAGES/additional.mo')
			.then(buffer => {
				const catalog = parseMoCatalog(buffer);
				expect(catalog).toBeDefined();
				expect(catalog.entries).toBeDefined();
				expect(catalog.entries['']).toBeDefined();
				expect(catalog.entries['Saturday']).toEqual(['Sonnabend']);
			});
	});
	it('should read big-endian catalogs', async () => {
		return transport
			.loadFile('src/locale/xy/LC_MESSAGES/big-endian.mo')
			.then(buffer => {
				const catalog = parseMoCatalog(buffer);
				expect(catalog).toBeDefined();
				expect(catalog.entries).toBeDefined();
				expect(catalog.entries['']).toBeDefined();
				expect(catalog.entries['Saturday']).toEqual(['Sonnabend']);
			});
	});
	it('should reject catalogs with wrong magic', async () => {
		return transport
			.loadFile('src/locale/xy/LC_MESSAGES/wrong-magic.mo')
			.then(buffer => {
				expect(() => parseMoCatalog(buffer)).toThrow();
			});
	});
	it('should reject catalogs with major > 0', async () => {
		return transport
			.loadFile('src/locale/xy/LC_MESSAGES/major1.mo')
			.then(buffer => {
				expect(() => parseMoCatalog(buffer)).toThrow();
			});
	});
	it('should reject catalogs with invalid charsets', async () => {
		return transport
			.loadFile('src/locale/xy/LC_MESSAGES/invalid-charset.mo')
			.then(buffer => {
				expect(() => parseMoCatalog(buffer)).toThrow();
			});
	});
	it('should accept catalogs without content-type', async () => {
		return transport
			.loadFile('src/locale/xy/LC_MESSAGES/no-content-type.mo')
			.then(buffer => {
				expect(parseMoCatalog(buffer)).toBeDefined();
			});
	});
	it('should accept catalogs without charset', async () => {
		return transport
			.loadFile('src/locale/xy/LC_MESSAGES/no-charset.mo')
			.then(buffer => {
				expect(parseMoCatalog(buffer)).toBeDefined();
			});
	});
});
