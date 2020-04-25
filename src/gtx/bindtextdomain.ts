import { browser } from './browser';
import { setLocale } from './set-locale';

/**
 * Bind a textdomain to a certain path. The catalog file will be searched
 * in `${path}/LOCALE/LC_MESSAGES/${domainname}.EXT`.
 *
 * @param domainname the textdomain to use, defaults to 'messages'
 * @param path the path where to search, defaults to '/assets/locale'
 *             for the web or 'assets/locale' for the file system.
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
			path = 'assets/locale';
		}
	}

	const paths = expandPath(path, domainname);

	return new Promise((resolve) => {
		resolve(path);
	});
}

function expandPath(path: string, domainname: string): Array<string> {
	let locale = setLocale();
	let paths = new Array<string>();
	const extender = 'json';

	path = path.replace(/[/\\]*$/, '');

	paths.push(`${path}/${locale}/LC_MESSAGES/${domainname}.${extender}`);

	let next;

	next = locale.replace(/\..+$/, '');
	if (next) {
		paths.push(`${path}/${next}/LC_MESSAGES/${domainname}.${extender}`);
		locale = next;
	}

	next = locale.replace(/@.+$/, '');
	if (next) {
		paths.push(`${path}/${next}/LC_MESSAGES/${domainname}.${extender}`);
		locale = next;
	}

	while (true) {
		next = locale.replace(/-.+$/, '');
		if (next) {
			paths.push(`${path}/${next}/LC_MESSAGES/${domainname}.${extender}`);
			locale = next;
		} else {
			break;
		}
	}

	return paths;
}
