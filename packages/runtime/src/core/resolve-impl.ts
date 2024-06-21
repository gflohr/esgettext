import { TransportHttp } from '../transport/http';
import { TransportFs } from '../transport/fs';
import { Transport } from '../transport/transport.interface';
import {
	parseMoJsonCatalog,
	parseJsonCatalog,
	parseMoCatalog,
} from '../parser';
import { browserEnvironment } from './browser-environment';
import { Catalog, CatalogEntries } from './catalog';
import { SplitLocale, splitLocale } from './split-locale';
import { germanicPlural } from './germanic-plural';
import { CatalogCache } from './catalog-cache';
import { explodeLocale, ExplodedLocale } from './explode-locale';
import { LocaleContainer } from './locale-container';

type PluralFunction = (numItems: number) => number;

const isBrowser = process.env.BROWSER_ENV;

function loadCatalog(url: string, format: string): Promise<Catalog> {
	let transportInstance: Transport;

	if (!isBrowser) {
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

		if (transport === 'http') {
			transportInstance = new TransportHttp();
		} else {
			transportInstance = new TransportFs();
		}
	} else {
		transportInstance = new TransportHttp();
	}

	type Validator = (data: ArrayBuffer) => Catalog;
	let validator: Validator;
	if ('mo.json' === format) {
		validator = parseMoJsonCatalog;
	} else if ('.json' === format) {
		validator = parseJsonCatalog;
	} else {
		validator = parseMoCatalog;
	}

	return new Promise<Catalog>((resolve, reject) => {
		transportInstance
			.loadFile(url)
			.then(data => {
				resolve(validator(data));
			})
			.catch(e => reject(e));
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

function loadLanguageFromObject(
	ids: Array<string>,
	base: LocaleContainer,
	domainname: string,
): Promise<Catalog> {
	let catalog: Catalog;

	for (let i = 0; i < ids.length; ++i) {
		const id = ids[0];
		// Language exists?
		if (!Object.prototype.hasOwnProperty.call(base, id)) {
			continue;
		}
		// LC_MESSAGES?
		if (!Object.prototype.hasOwnProperty.call(base[id], 'LC_MESSAGES')) {
			continue;
		}
		// Textdomain?
		if (
			!Object.prototype.hasOwnProperty.call(base[id].LC_MESSAGES, domainname)
		) {
			continue;
		}

		catalog = base[id].LC_MESSAGES[domainname];
	}

	return new Promise<Catalog>((resolve, reject) => {
		if (catalog) {
			resolve(catalog);
		} else {
			reject();
		}
	});
}

/*
 * First tries to load a catalog with the specified charset, then with the
 * charset converted to uppercase (if it differs from the original charset),
 * and finally without a charset.
 */
async function loadLanguage(
	ids: Array<string>,
	base: string | LocaleContainer,
	domainname: string,
	format: string,
): Promise<Catalog> {
	// Check if `base` is an object (LocaleContainer).
	if (typeof base === 'object' && base !== null) {
		return loadLanguageFromObject(ids, base, domainname);
	}

	const loaders: Array<() => Promise<Catalog>> = ids.map(id => {
		return () => loadCatalog(assemblePath(base as string, id, domainname, format), format);
	});

	return loaders.reduce(async (previousPromise, loader) => {
		try {
			return await previousPromise.catch(loader);
		} catch (error) {
			/* Ignore. */
		}

		// Return the previous promise in case of failure to ensure proper chaining.
		return previousPromise;
	}, Promise.reject());
}

async function loadDomain(
	exploded: ExplodedLocale,
	localeKey: string,
	base: string | LocaleContainer,
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
			return new Promise(resolve => resolve(cacheHit));
		}
	}

	const promises = new Array<Promise<void | Catalog>>();
	const results = new Array<Catalog>();

	exploded.forEach((tries, i) => {
		const p = loadLanguage(tries, base, domainname, format)
			.then(catalog => (results[i] = catalog))
			.catch(() => {
				/* ignore */
			});
		promises.push(p);
	});

	await Promise.all(promises);

	results.forEach(result => {
		catalog.major = result.major;
		catalog.minor = result.minor;
		catalog.entries = { ...catalog.entries, ...result.entries };
	});

	return new Promise(resolve => {
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
			throw new Error('invalid plural function');
		}
	}

	const code = 'var nplurals = 1, plural = 0;' + str + '; return 0 + plural';

	// This may throw an exception!
	/* eslint-disable @typescript-eslint/no-implied-eval */
	return new Function('n', code) as PluralFunction;
}

function setPluralFunction(catalog: Catalog): Catalog {
	if (!Object.prototype.hasOwnProperty.call(catalog.entries, '')) {
		return catalog;
	}

	const headers = catalog.entries[''][0].split('\n');
	headers.forEach(header => {
		const tokens = header.split(':');
		if ('plural-forms' === (tokens.shift() as string).toLowerCase()) {
			const code = tokens.join(':');
			catalog.pluralFunction = pluralExpression(code);
		}
	});

	return catalog;
}

export function resolveImpl(
	domainname: string,
	path: string | LocaleContainer,
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
		return new Promise(resolve => resolve(defaultCatalog));
	}

	return new Promise(resolve => {
		const exploded = explodeLocale(splitLocale(localeKey) as SplitLocale, true);
		loadDomain(exploded, localeKey, path, domainname, format)
			.then(catalog => {
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
