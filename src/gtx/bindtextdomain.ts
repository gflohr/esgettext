import { TransportHttp } from '../transport/http';
import { TransportFs } from '../transport/fs';
import { Transport } from '../transport.interface';
import { browser } from './browser';
import { format } from './format';
import { Catalog } from './catalog';
import { setLocale } from './set-locale';
import { splitLocale, SplitLocale } from './split-locale';
import { parseMO } from './parse-mo';

/* eslint-disable no-console */

interface DomainCache {
	[key: string]: Catalog;
}

function validateCatalog(json: string): Catalog {
	console.log(json);
	throw new Error('not yet implemented');
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
		if (browser()) {
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
	if ('json' === format()) {
		validator = validateCatalog;
		encoding = 'utf-8';
	} else {
		validator = parseMO;
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
	const extender = format();

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
	// FIXME! For 'de-DE' we have to first load 'de', then 'de-DE'!

	console.log('loadDomain');
	console.log(locale, base, domainname);

	return loadCatalogWithCharset(locale, base, domainname);
}

/**
 * Bind a textdomain to a certain path. The catalog file will be searched
 * in `${path}/LOCALE/LC_MESSAGES/${domainname}.EXT`.
 *
 * @param domainname the textdomain to use, defaults to 'messages'
 * @param path the path where to search, defaults to '/assets/locale'
 *             for the web or 'src/assets/locale' for the file system.
 */
export function bindtextdomain(
	domainname?: string,
	path?: string,
): Promise<string> {
	if (typeof domainname === 'undefined' || domainname === '') {
		domainname = 'messages';
	}

	// FIXME! Check whether we already have the translations ...

	if (typeof path === 'undefined') {
		if (browser()) {
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
			.then((catalog) => {
				console.log(catalog);
				resolve('okay');
			})
			.catch((e) => resolve(`not okay: ${e}`));
	});
}