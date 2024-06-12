import { userLocales } from './core/user-locales';
// FIXME! Windows!
if (typeof process.env.LANGUAGE !== 'undefined') {
	userLocales(process.env.LANGUAGE.split(':'));
} else if (typeof process.env.LC_ALL !== 'undefined') {
	userLocales([process.env.LC_ALL]);
} else if (typeof process.env.LANG !== 'undefined') {
	userLocales([process.env.LANG]);
} else if (typeof process.env.LC_MESSAGES !== 'undefined') {
	userLocales([process.env.LC_MESSAGES]);
}

export * from './core';

export { parseMoCatalog } from './parser';
