import { TransportHttp } from '../transport/http';
import { TransportFs } from '../transport/fs';
import { Transport } from '../transport/transport.interface';
import { parseJsonCatalog, parseMoCatalog } from '../parser';
import { browserEnvironment } from './browser-environment';
import { Catalog, CatalogEntries } from './catalog';
import { splitLocale } from './split-locale';
import { germanicPlural } from './germanic-plural';
import { CatalogCache } from './catalog-cache';
import { explodeLocale, ExplodedLocale } from './explode-locale';

/* eslint-disable no-console */

type PluralFunction = (numItems: number) => number;

function loadCatalog(url: string, format: string): Promise<Catalog> {
	let transport;

	// Check whether this is a valid URL.
	try {
		const parsedURL = new URL(url);
		if (
			parsedURL.protocol === 'https:' ||
			parsedURL.protocol === 'http:' ||
			parsedURL.protocol === 'file:'
		) {
			transport = 'http';
		} else {
			throw new Error(`unsupported scheme ${parsedURL.protocol}`);
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
	id: string,
	domainname: string,
	extender: string,
): string {
	return `${base}/${id}/LC_MESSAGES/${domainname}.${extender}`;
}

/*
 * First tries to load a catalog with the specified charset, then with the
 * charset converted to uppercase (if it differs from the origina charset),
 * and finally without a charset.
 */
async function loadLanguage(
	ids: Array<string>,
	base: string,
	domainname: string,
	format: string,
): Promise<Catalog> {
	return new Promise((resolve, reject) => {
		type CatalogLoader = (url: string) => Promise<Catalog>;

		const tries = new Array<CatalogLoader>();

		ids.forEach((id) => {
			tries.push(() =>
				loadCatalog(assemblePath(base, id, domainname, format), format),
			);
		});

		tries
			.reduce(
				(promise, fn: CatalogLoader) => promise.catch(fn),
				Promise.reject(),
			)
			.then((value) => resolve(value))
			.catch((e) => reject(e));
	});
}

async function loadDomain(
	exploded: ExplodedLocale,
	localeKey: string,
	base: string,
	domainname: string,
	format: string,
): Promise<Catalog> {
	const entries: CatalogEntries = {};

	const catalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: germanicPlural,
		entries,
	};

	const cacheHit = CatalogCache.lookup(localeKey, domainname);
	if (cacheHit !== null) {
		// Promise?
		if (Promise.resolve(cacheHit) === cacheHit) {
			return cacheHit;
		} else {
			// Normal cache hit.
			return new Promise((resolve) => resolve(cacheHit));
		}
	}

	const promises = new Array<Promise<void | Catalog>>();
	const results = new Array<Catalog>();

	exploded.forEach((tries, i) => {
		const p = loadLanguage(tries, base, domainname, format)
			.then((catalog) => (results[i] = catalog))
			.catch(() => {
				/* ignore */
			});
		promises.push(p);
	});

	await Promise.all(promises);

	results.forEach((result) => {
		if (typeof result !== 'undefined') {
			catalog.major = result.major;
			catalog.minor = result.minor;
			catalog.entries = { ...catalog.entries, ...result.entries };
		}
	});

	return new Promise((resolve) => {
		resolve(catalog);
	});
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
	if (!Object.prototype.hasOwnProperty.call(catalog.entries, '')) {
		catalog.pluralFunction = germanicPlural;
		return catalog;
	}

	const headersRaw = catalog.entries[''][0];
	if (!headersRaw.length) {
		catalog.pluralFunction = germanicPlural;
		return catalog;
	}

	const headers = headersRaw.split('\n');
	headers.forEach((header) => {
		const tokens = header.split(':');
		if ('plural-forms' === tokens.shift().toLowerCase()) {
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
		const exploded = explodeLocale(splitLocale(localeKey), true);
		loadDomain(exploded, localeKey, path, domainname, format)
			.then((catalog) => {
				setPluralFunction(catalog);
				CatalogCache.store(localeKey, domainname, catalog);
				resolve(catalog);
			})
			.catch(() => {
				CatalogCache.store(localeKey, domainname, defaultCatalog);
				resolve(defaultCatalog);
			});
	});
}
