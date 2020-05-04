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
import { splitLocale, SplitLocale } from './split-locale';
import { germanicPlural } from './germanic-plural';
import { CatalogCache } from './catalog-cache';

/* eslint-disable no-console */

type PluralFunction = (numItems: number) => number;

function loadCatalog(url: string, format: string): Promise<Catalog> {
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

	type Validator = (data: ArrayBuffer) => Catalog;
	let validator: Validator;
	if ('json' === format) {
		validator = parseJsonCatalog;
	} else {
		validator = parseMoCatalog;
	}
	return new Promise<Catalog>((resolve, reject) => {
		transportInstance
			.loadFile(url)
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
	extender: string,
	charset?: string,
): string {
	const separator = locale.underscoreSeparator ? '_' : '-';
	base += '/' + locale.tags.join(separator);
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
	format: string,
): Promise<Catalog> {
	return new Promise((resolve, reject) => {
		type CatalogLoader = (url: string) => Promise<Catalog>;
		const tries = new Array<CatalogLoader>();
		let path: string;

		if (typeof locale.charset !== 'undefined') {
			path = assemblePath(base, locale, domainname, format, locale.charset);
			tries.push(() => loadCatalog(path, format));
			const ucCharset = locale.charset.toUpperCase();
			if (ucCharset !== locale.charset) {
				path = assemblePath(base, locale, domainname, format, locale.charset);
				tries.push(() => loadCatalog(path, format));
			}
		}

		path = assemblePath(base, locale, domainname, format);
		tries.push(() => loadCatalog(path, format));

		tries
			.reduce(
				(promise, fn: CatalogLoader) => promise.catch(fn),
				Promise.reject(),
			)
			.then((value) => resolve(value))
			.catch(() => reject());
	});
}

async function loadDomain(
	locale: SplitLocale,
	localeKey: string,
	base: string,
	domainname: string,
	format: string,
	cache: CatalogCache,
): Promise<Catalog> {
	const entries: CatalogEntries = {};

	const catalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: germanicPlural,
		entries,
	};

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

	const promises = new Array<Promise<void | Catalog>>();
	const results = new Array<Catalog>();
	for (let i = 0; i < locale.tags.length; ++i) {
		const partialLocale: SplitLocale = {
			tags: locale.tags.slice(0, i + 1),
			underscoreSeparator: locale.underscoreSeparator,
		};
		if (typeof locale.charset !== 'undefined') {
			partialLocale.charset = locale.charset;
		}
		if (typeof locale.modifier !== 'undefined') {
			partialLocale.modifier = locale.modifier;
		}

		const p = loadCatalogWithCharset(partialLocale, base, domainname, format)
			.then((result) => (results[i] = result))
			.catch(() => {
				/* ignored */
			});
		promises.push(p);
	}

	await Promise.all(promises);

	for (let i = 0; i < locale.tags.length; ++i) {
		const result = results[i];
		if (!result) {
			continue;
		}

		catalog.major = result.major;
		catalog.minor = result.minor;
		catalog.entries = { ...catalog.entries, ...result.entries };
	}

	return new Promise((resolve) => resolve(catalog));
}

function pluralExpression(str: string): PluralFunction {
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
	return new Function('n', code) as PluralFunction;
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

export function resolveImpl(
	domainname: string,
	cache: CatalogCache,
	path: string,
	format: string,
	localeKey: string,
): Promise<Catalog> {
	const defaultCatalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: germanicPlural,
		entries: {},
	};

	if (localeKey === 'C' || localeKey === 'POSIX') {
		return new Promise((resolve) => resolve(defaultCatalog));
	}

	return new Promise((resolve) => {
		const locale = splitLocale(localeKey);
		loadDomain(locale, localeKey, path, domainname, format, cache)
			.then((catalog) => {
				setPluralFunction(catalog);
				cache.store(path, localeKey, domainname, catalog);
				resolve(catalog);
			})
			.catch(() => {
				cache.store(path, localeKey, domainname, null);
				resolve(defaultCatalog);
			});
	});
}
