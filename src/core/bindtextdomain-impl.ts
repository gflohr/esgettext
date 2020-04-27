import { TransportHttp } from '../transport/http';
import { TransportFs } from '../transport/fs';
import { Transport } from '../transport/transport.interface';
import { parseJsonCatalog, parseMoCatalog } from '../parser';
import { browserEnvironment } from './browser-environment';
import { Catalog, CatalogEntries } from './catalog';
import { setLocale } from './set-locale';
import { splitLocale, SplitLocale } from './split-locale';
import { catalogFormat } from './catalog-format';
import { germanicPlural } from './germanic-plural';
import { CatalogCache } from './catalog-cache';

/* eslint-disable no-console */

interface DomainCache {
	[key: string]: Catalog;
}

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
function loadCatalogWithCharset(
	locale: SplitLocale,
	base: string,
	domainname: string,
	charset?: string,
): Promise<Catalog> {
	return new Promise((resolve) => {
		type CatalogLoader = (url: string) => Promise<Catalog>;
		const tries = new Array<CatalogLoader>();
		let path: string;

		if (typeof charset !== 'undefined') {
			path = assemblePath(base, locale, domainname, charset);
			tries.push(() => loadCatalog(path));
			const ucCharset = charset.toUpperCase();
			if (ucCharset !== charset) {
				path = assemblePath(base, locale, domainname, charset);
				tries.push(() => loadCatalog(path));
			}
		}

		path = assemblePath(base, locale, domainname);
		tries.push(() => loadCatalog(path));

		tries
			.reduce((p, fn: CatalogLoader) => p.catch(fn), Promise.reject())
			.then((value) => resolve(value));
	});
}

function loadDomain(
	locale: SplitLocale,
	base: string,
	domainname: string,
): Promise<Catalog> {
	const promises = new Array<Promise<void>>();
	const entries: CatalogEntries = {};

	const catalog: Catalog = {
		major: 0,
		minor: 0,
		pluralFunction: germanicPlural,
		entries,
	};

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

		const promise = loadCatalogWithCharset(
			partialLocale,
			base,
			domainname,
		).then((result) => {
			catalog.major = result.major;
			catalog.minor = result.minor;
			catalog.entries = { ...catalog.entries, ...result.entries };
		});
		promises.push(promise);
	}

	return new Promise((resolve) => resolve(catalog));
}

export function bindtextdomainImpl(
	domainname: string,
	cache: CatalogCache,
	path?: string,
): Promise<string> {
	// FIXME! Check whether we already have the translations ...

	if (typeof path === 'undefined') {
		if (browserEnvironment()) {
			path = '/assets/locale';
		} else {
			path = 'src/assets/locale';
		}
	}

	const localeIdentifier = setLocale();
	if (localeIdentifier === 'C' || localeIdentifier === 'POSIX') {
		return new Promise((resolve) => resolve('not okay'));
	}

	return new Promise((resolve) => {
		const locale = splitLocale(localeIdentifier);
		loadDomain(locale, path, domainname)
			.then((_catalog) => {
				resolve('okay');
			})
			.catch((e) => resolve(`not okay: ${e}`));
	});
}
