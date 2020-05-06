import { TransportFs } from '../transport';
import { parseMoCatalog } from './parse-mo-catalog';

const transport = new TransportFs();

describe('MO catalogs', () => {
	it('should read little-endian catalogs', async () => {
		return transport
			.loadFile('src/assets/locale/de_AT/LC_MESSAGES/additional.mo')
			.then((buffer) => {
				const catalog = parseMoCatalog(Buffer.from(buffer));
				expect(catalog).toBeDefined();
				expect(catalog.entries).toBeDefined();
				expect(catalog.entries['']).toBeDefined();
				expect(catalog.entries['Saturday']).toEqual(['Sonnabend']);
			});
	});
});
