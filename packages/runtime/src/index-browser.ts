import { browserEnvironment } from './core/browser-environment';
browserEnvironment(true);

import { pathSeparator } from './core/path-separator';
pathSeparator('/');

/* eslint-disable @typescript-eslint/no-explicit-any */

import { userLocales } from './core/user-locales';
const locales = new Array<string>();
if (window.navigator.languages) {
	locales.push(...window.navigator.languages);
}
if (typeof window.navigator.language !== 'undefined') {
	locales.push(window.navigator.language);
}
if (typeof (window.navigator as any).userLanguage !== 'undefined') {
	locales.push((window.navigator as any).userLanguage);
}
if (typeof (window.navigator as any).browserLanguage !== 'undefined') {
	locales.push((window.navigator as any).browserLanguage);
}
if (typeof (window.navigator as any).systemLanguage !== 'undefined') {
	locales.push((window.navigator as any).systemLanguage);
}
userLocales(locales);

export * from './core';
export { parseMoCatalog } from './parser';
