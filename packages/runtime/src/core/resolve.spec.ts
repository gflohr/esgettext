import mock from 'xhr-mock';
import { TransportFs } from '../transport';
import { Textdomain } from './textdomain';
import { CatalogCache } from './catalog-cache';
import { browserEnvironment } from './browser-environment';
import { germanicPlural } from './germanic-plural';
import { pathSeparator } from './platform';
import { Catalog } from './catalog';

const defaultCatalog: Catalog = {
	major: 0,
	minor: 0,
	pluralFunction: germanicPlural,
	entries: {},
};

describe('resolve', () => {
	beforeEach(() => {
		CatalogCache.clear();
		Textdomain.forgetInstances();
	});

	describe('simple test', () => {
		it('should return something for mytest.json', () => {
			const gtx = Textdomain.getInstance('mytest');

			gtx.catalogFormat = 'json';
			return gtx.resolve().then(catalog => {
				expect(catalog).toBeTruthy();
			});
		});

		it('should return something for mytest.mo', () => {
			const gtx = Textdomain.getInstance('mytest');

			gtx.catalogFormat = 'mo';
			return gtx.resolve().then(catalog => {
				expect(catalog).toBeTruthy();
			});
		});

		it('should also return something for not-exists.mo', () => {
			const gtx = Textdomain.getInstance('not-exists');

			return gtx.resolve().then(catalog => {
				expect(catalog).toBeTruthy();
			});
		});
	});

	describe('load catalog via URLs', () => {
		const gtx = Textdomain.getInstance('http');
		const catalog = {
			major: 0,
			minor: 0,
			pluralFunction: germanicPlural,
			entries: {
				one: ['yksi'],
				two: ['kaksi'],
				three: ['kolme'],
			},
		};

		beforeEach(() => {
			mock.setup();
		});

		afterEach(() => {
			mock.teardown();
		});

		it('should use http transport for the browser', async () => {
			const old = browserEnvironment();
			browserEnvironment(true);

			const body = JSON.stringify(catalog);
			mock.get('/assets/locale/de/LC_MESSAGES/http.json', {
				status: 200,
				body: body,
			});

			return gtx.resolve().then(data => {
				browserEnvironment(old);
				// FIXME! xhr-mock does not implement arraybuffer response types
				// correctly, see https://github.com/jameslnewell/xhr-mock/issues/104
				// expect(data).toEqual(catalog);
				expect(data).toBeDefined();
			});
		});

		it('should use http transport for http URLs', async () => {
			gtx.bindtextdomain('http://example.com/assets/locale');

			const body = JSON.stringify(catalog);
			mock.get('http://example.com/assets/locale/de/LC_MESSAGES/http.json', {
				status: 200,
				body: body,
			});

			return gtx.resolve().then(data => {
				// FIXME! xhr-mock does not implement arraybuffer response types
				// correctly, see https://github.com/jameslnewell/xhr-mock/issues/104
				// expect(data).toEqual(catalog);
				expect(data).toBeDefined();
			});
		});

		it('should use http transport for https URLs', async () => {
			gtx.bindtextdomain('https://example.com/assets/locale');

			const body = JSON.stringify(catalog);
			mock.get('https://example.com/assets/locale/de/LC_MESSAGES/http.json', {
				status: 200,
				body: body,
			});

			return gtx.resolve().then(data => {
				// FIXME! xhr-mock does not implement arraybuffer response types
				// correctly, see https://github.com/jameslnewell/xhr-mock/issues/104
				// expect(data).toEqual(catalog);
				expect(data).toBeDefined();
			});
		});

		it('should use http transport for file URLs', async () => {
			gtx.bindtextdomain('file:///app/assets/locale');

			const body = JSON.stringify(catalog);
			mock.get('file:///app/assets/locale/de/LC_MESSAGES/http.json', {
				status: 200,
				body: body,
			});

			return gtx.resolve().then(data => {
				// FIXME! xhr-mock does not implement arraybuffer response types
				// correctly, see https://github.com/jameslnewell/xhr-mock/issues/104
				// expect(data).toEqual(catalog);
				expect(data).toBeDefined();
			});
		});

		it('should get a catalog from an object', async () => {
			const path = {
				de: {
					LC_MESSAGES: {
						http: catalog,
					},
				},
			};

			gtx.bindtextdomain(path);

			return gtx.resolve().then(data => {
				expect(data).toEqual(catalog);
			});
		});

		it('should fail getting a catalog from an object with an unsupported language', async () => {
			const path = {
				fr: {
					LC_MESSAGES: {
						http: catalog,
					},
				},
			};

			gtx.bindtextdomain(path);

			return gtx.resolve().then(data => {
				expect(data).toEqual(defaultCatalog);
			});
		});

		it('should fail getting a catalog from an object without LC_MESSAGES', async () => {
			const path = {
				de: {
					LC_CURRENCY: {
						http: catalog,
					},
				},
			};

			gtx.bindtextdomain(path);

			return gtx.resolve().then(data => {
				expect(data).toEqual(defaultCatalog);
			});
		});

		it('should fail getting a catalog from an object without textdomain', async () => {
			const path = {
				de: {
					LC_MESSAGES: {
						telnet: catalog,
					},
				},
			};

			gtx.bindtextdomain(path);

			return gtx.resolve().then(data => {
				expect(data).toEqual(defaultCatalog);
			});
		});
	});
});

describe('preload cache', () => {
	beforeEach(() => {
		CatalogCache.clear();
		Textdomain.forgetInstances();
	});

	it('should load', async () => {
		Textdomain.locale = 'de';
		const gtx = Textdomain.getInstance('precached');
		const catalog: Catalog = {
			major: 0,
			minor: 0,
			pluralFunction: germanicPlural,
			entries: {
				something: ['jotain'],
			},
		};

		CatalogCache.store(
			'de',
			'precached',
			new Promise(resolve => resolve(catalog)),
		);

		return gtx.resolve().then(loaded => {
			expect(loaded).toEqual(catalog);
		});
	});
});

describe('special cases', () => {
	beforeEach(() => {
		CatalogCache.clear();
		Textdomain.forgetInstances();
	});

	describe('unsupported URL protocols', () => {
		const gtx = Textdomain.getInstance('mailto');
		Textdomain.locale = 'de';

		const url = 'mailto:guido.flohr@cantanea.com';

		const path = [url, 'de', 'LC_MESSAGES', 'mailto.json'].join(pathSeparator);

		it('should use the fs transport', async () => {
			const loadFile = jest.fn();
			const oldLoadFile = TransportFs.prototype.loadFile;
			TransportFs.prototype.loadFile = loadFile;

			gtx.bindtextdomain('mailto:guido.flohr@cantanea.com');

			return gtx.resolve().then(() => {
				TransportFs.prototype.loadFile = oldLoadFile;
				expect(loadFile).toHaveBeenCalledTimes(1);
				expect(loadFile).toHaveBeenCalledWith(path);
			});
		});
	});

	describe('invalid plural function', () => {
		it('should fall back to germanic plural', async () => {
			const catalog: Catalog = {
				major: 0,
				minor: 0,
				pluralFunction: () => 0,
				entries: {
					'': [
						// Square brackets are not allowed.
						'Plural-Forms: nplurals = [42]; plural = nplurals[0]',
					],
				},
			};

			CatalogCache.store(
				'de',
				'invalid-plural',
				new Promise(resolve => resolve(catalog)),
			);

			const gtx = Textdomain.getInstance('invalid-plural');
			Textdomain.locale = 'de';

			return gtx.resolve().then(catalog => {
				expect(catalog.pluralFunction).toEqual(germanicPlural);
			});
		});
	});

	describe('C and POSIX locale', () => {
		it('should return a catalog for the C locale', async () => {
			Textdomain.locale = 'C';
			const gtx = Textdomain.getInstance('c-locale');

			return gtx.resolve().then(catalog => {
				expect(catalog.pluralFunction).toEqual(germanicPlural);
			});
		});
		it('should return a catalog for the POSIX locale', async () => {
			Textdomain.locale = 'POSIX';
			const gtx = Textdomain.getInstance('posix-locale');

			return gtx.resolve().then(catalog => {
				expect(catalog.pluralFunction).toEqual(germanicPlural);
			});
		});
	});

	describe('missing locale', () => {
		it('should return a catalog a missing locale', async () => {
			Textdomain.locale = 'de_DE.utf-8@ksh';
			const gtx = Textdomain.getInstance('missing');

			return gtx.resolve().then(catalog => {
				expect(catalog.pluralFunction).toEqual(germanicPlural);
			});
		});
	});

	describe('partly missing locale', () => {
		it('should return a catalog for fi_FI', async () => {
			Textdomain.locale = 'fi_FI';
			const gtx = Textdomain.getInstance('existing');

			return gtx.resolve().then(catalog => {
				expect(catalog.entries).toBeDefined();
				expect(catalog.entries['January']).toEqual(['Tammikuu']);
			});
		});
	});
});
