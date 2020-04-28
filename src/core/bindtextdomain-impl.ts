import { TransportHttp } from '../transport/http';
import { TransportFs } from '../transport/fs';
import { Transport } from '../transport/transport.interface';
import {
	parseJsonCatalog,
	parseMoCatalog,
	validateJsonCatalog,
} from '../parser';
import { browserEnvironment } from './browser-environment';
import { Catalog, CatalogEntries } from './catalog';
import { setLocale } from './set-locale';
import { splitLocale, SplitLocale } from './split-locale';
import { catalogFormat } from './catalog-format';
import { germanicPlural } from './germanic-plural';
import { CatalogCache } from './catalog-cache';

/* eslint-disable no-console */

function loadCatalog(url: string): Promise<Catalog> {
	let transport;

	// Check whether this is a valid URL.
	try {
		const parsedURL = new URL(url);
		if (parsedURL.protocol === 'https:' || parsedURL.protocol === 'http:') {
			transport = 'http';
		} else if (parsedURL.protocol === 'file:') {
			transport = 'fs';
		}
	} catch (e) {
		if (browserEnvironment()) {
			transport = 'http';
		} else {
			transport = 'fs';
		}
	}

	let transportInstance: Transport;
	if (transport === 'http') {
		transportInstance = new TransportHttp();
	} else {
		transportInstance = new TransportFs();
	}

	type Validator = (data: string) => Catalog;

	let validator: Validator, encoding: string;
	if ('json' === catalogFormat()) {
		validator = parseJsonCatalog;
		encoding = 'utf-8';
	} else {
		validator = parseMoCatalog;
		encoding = 'binary';
	}
	return new Promise<Catalog>((resolve, reject) => {
		transportInstance
			.loadFile(url, encoding)
			.then((data) => {
				resolve(validator(data));
			})
			.catch((e) => reject(e));
	});
}

function assemblePath(
	base: string,
	locale: SplitLocale,
	domainname: string,
	charset?: string,
): string {
	const extender = catalogFormat();

	base += '/' + locale.tags.join('-');
	if (typeof charset !== 'undefined') {
		base += '.' + charset;
	}
	if (typeof locale.modifier !== 'undefined') {
		base += '@' + locale.modifier;
	}

	base += `/LC_MESSAGES/${domainname}.${extender}`;

	return base;
}

/*
 * First tries to load a catalog with the specified charset, then with the
 * charset converted to uppercase (if it differs from the origina charset),
 * and finally without a charset.
 */
async function loadCatalogWithCharset(
	locale: SplitLocale,
	base: string,
	domainname: string,
): Promise<Catalog> {
	return new Promise((resolve) => {
		type CatalogLoader = (url: string) => Promise<Catalog>;
		const tries = new Array<CatalogLoader>();
		let path: string;

		if (typeof locale.charset !== 'undefined') {
			path = assemblePath(base, locale, domainname, locale.charset);
			tries.push(() => loadCatalog(path));
			const ucCharset = locale.charset.toUpperCase();
			if (ucCharset !== locale.charset) {
				path = assemblePath(base, locale, domainname, locale.charset);
				tries.push(() => loadCatalog(path));
			}
		}

		path = assemblePath(base, locale, domainname);
		tries.push(() => loadCatalog(path));

		tries
			.reduce(
				(promise, fn: CatalogLoader) => promise.catch(fn),
				Promise.reject(),
			)
			.then((value) => {
				resolve(value);
			});
	});
}

async function loadDomain(
	locale: SplitLocale,
	base: string,
	domainname: string,
	cache: CatalogCache,
): Promise<Catalog> {
	const entries: CatalogEntries = {};

	const catalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: germanicPlural,
		entries,
	};

	const localeKey = setLocale();
	const cacheHit = cache.lookup(base, localeKey, domainname);
	if (cacheHit !== null) {
		// Promise?
		if (cacheHit === Object(cacheHit) && typeof cacheHit === 'function') {
			const p = cacheHit as Promise<Catalog>;
			return new Promise((resolve, reject) => {
				p.then((result) => {
					try {
						const valid = validateJsonCatalog(result);
						cache.store(base, localeKey, domainname, valid);
					} catch (e) {
						cache.store(base, localeKey, domainname, catalog);
						reject(e);
					}
				});
			});
		} else {
			// Normal cache hit.
			return new Promise((resolve) => resolve(cacheHit));
		}
	}

	const results = new Array<Promise<void>>();
	for (let i = 0; i < locale.tags.length; ++i) {
		const partialLocale: SplitLocale = {
			tags: locale.tags.slice(0, i + 1),
		};
		if (typeof locale.charset !== 'undefined') {
			partialLocale.charset = locale.charset;
		}
		if (typeof locale.modifier !== 'undefined') {
			partialLocale.modifier = locale.modifier;
		}

		const p = loadCatalogWithCharset(partialLocale, base, domainname)
			.then((result) => {
				catalog.major = result.major;
				catalog.minor = result.minor;
				catalog.entries = { ...catalog.entries, ...result.entries };
			})
			.catch(() => {
				/* ignored */
			});
		results.push(p);
	}

	await Promise.all(results);

	return new Promise((resolve) => resolve(catalog));
}

function pluralExpression(str: string): Function {
	const tokens = str
		.replace(/[ \t\r\013\014]/g, '')
		.replace(/;$/, '')
		// Do NOT allow square brackets here. JSFuck!
		.split(/[<>!=]=|&&|\|\||[-!*/%+<>=?:;]/);

	for (let i = 0; i < tokens.length; ++i) {
		const token = tokens[i].replace(/^\(+/, '').replace(/\)+$/, '');
		if (
			token !== 'nplurals' &&
			token !== 'plural' &&
			token !== 'n' &&
			// Does not catch invalid octal numbers but the compiler
			// takes care of that.
			null === /^[0-9]+$/.exec(token)
		) {
			return germanicPlural;
		}
	}

	const code = 'var nplurals = 1, plural = 0;' + str + '; return 0 + plural';

	// This may throw an exception!
	return new Function('n', code);
}

function setPluralFunction(catalog: Catalog): Catalog {
	const headersRaw = catalog.entries[''][0];
	if (!headersRaw.length) {
		return catalog;
	}

	const headers = headersRaw.split('\n');
	headers.forEach((header) => {
		const tokens = header.split(':');
		if ('plural-forms' === tokens.shift()) {
			const code = tokens.join(':');
			try {
				catalog.pluralFunction = pluralExpression(code);
			} catch (e) {
				// If the plural function was invalid,
				catalog.major = catalog.minor = 0;
				catalog.pluralFunction = germanicPlural;
				catalog.entries = {};
			}
		}
	});

	return catalog;
}

export function bindtextdomainImpl(
	domainname: string,
	cache: CatalogCache,
	path?: string,
): Promise<Catalog> {
	const defaultCatalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: germanicPlural,
		entries: {},
	};

	if (typeof path === 'undefined') {
		if (browserEnvironment()) {
			path = '/assets/locale';
		} else {
			path = 'src/assets/locale';
		}
	}

	const localeIdentifier = setLocale();
	if (localeIdentifier === 'C' || localeIdentifier === 'POSIX') {
		return new Promise((resolve) => resolve(defaultCatalog));
	}

	return new Promise((resolve) => {
		const locale = splitLocale(localeIdentifier);
		loadDomain(locale, path, domainname, cache)
			.then((catalog) => {
				resolve(setPluralFunction(catalog));
			})
			.catch(() => {
				resolve(defaultCatalog);
			});
	});
}
