import { TransportHttp } from '../transport/http';
import { TransportFs } from '../transport/fs';
import { Transport } from '../transport.interface';
import { browser } from './browser';
import { format } from './format';
import { Catalog } from './catalog';
import { setLocale } from './set-locale';

interface DomainCache {
	[key: string]: Catalog;
}

function loadCatalog(url: string) : Promise<string> {
	let transport;

	// Check whether this is a valid URL.
	try {
		const parsedURL = new URL(url);
		if (parsedURL.protocol === 'https:' || parsedURL.protocol === 'http:') {
			transport = 'http';
		} else if (parsedURL.protocol === 'file:') {
			transport = 'fs';
		}
	} catch(e) {
		if (typeof transport === undefined) {
			if (browser()) {
				transport = 'http';
			} else {
				transport = 'fs';
			}
		}
	}

	let transportInstance: Transport;
	if (transport === 'http') {
		transportInstance = new TransportHttp();
	} else {
		transportInstance = new TransportFs();
	}

	return transportInstance.loadFile(url);
}

function assemblePath(base: string, locale: string,
	                  domainname: string, charset?: string): string {
	const extender = format();
	if (typeof charset === 'undefined') {
		return base + '/' + locale + '/LC_MESSAGES/' + domainname + '.' + extender;
	} else {
		return base + '/' + locale + '.' + charset + '/LC_MESSAGES/' + domainname + '.' + extender;
	}
}

/*
 * First tries to load a catalog with the specified charset, then with the
 * charset converted to uppercase (if it differs from the origina charset),
 * and finally without a charset.
 */
function loadCatalogWithCharset(base: string, locale: string,
	                            domainname: string, charset?: string): Promise<string> {
	return new Promise(resolve => {
		type CatalogLoader = (url: string) => Promise<string>;
		const tries = new Array<CatalogLoader>();
		let path: string;

		if (typeof charset !== undefined) {
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

		tries.reduce((p, fn: CatalogLoader) => p.catch(fn), Promise.reject())
		.then(value => resolve(value));
	});
}

function loadDomain(base: string, domainname: string): Promise<string> {
	const locale = setLocale();

	return new Promise((_resolve, reject) => reject());
}

// function expandPath(path: string, domainname: string): Array<string> {
// 	let locale = setLocale();
// 	const paths = new Array<string>();
// 	const extender = format();

// 	path = path.replace(/[/\\]*$/, '');

// 	paths.push(`${path}/${locale}/LC_MESSAGES/${domainname}.${extender}`);

// 	let next;

// 	next = locale.replace(/\..+$/, '');
// 	if (next) {
// 		paths.push(`${path}/${next}/LC_MESSAGES/${domainname}.${extender}`);
// 		locale = next;
// 	}

// 	next = locale.replace(/@.+$/, '');
// 	if (next) {
// 		paths.push(`${path}/${next}/LC_MESSAGES/${domainname}.${extender}`);
// 		locale = next;
// 	}

// 	next = '';
// 	while (next !== locale) {
// 		next = locale.replace(/-.+$/, '');
// 		if (next !== locale) {
// 			paths.push(`${path}/${next}/LC_MESSAGES/${domainname}.${extender}`);
// 			locale = next;
// 		}
// 	}

// 	return paths;
// }

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

	return new Promise(resolve => resolve(path + '/POSIX/LC_MESSAGES/mytest.json'));

	//return loadDomain(path, domainname);
}
