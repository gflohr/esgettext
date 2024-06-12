import { browserEnvironment } from './core/browser-environment';
browserEnvironment(true);

/* eslint-disable @typescript-eslint/no-explicit-any */

import { userLocales } from './core/user-locales';
const locales = new Array<string>();
if (window.navigator.languages) {
	locales.push(...window.navigator.languages);
}
if (typeof window.navigator.language !== 'undefined') {
	locales.push(window.navigator.language);
}
const nav: { [key: string]: string } = window.navigator as unknown as {
	[key: string]: string;
};

if (
	Object.prototype.hasOwnProperty.call(nav, 'userLanguage') &&
	nav.userLanguage
) {
	locales.push(nav.userLanguage);
}
if (
	Object.prototype.hasOwnProperty.call(nav, 'browserLanguage') &&
	nav['browserLanguage']
) {
	locales.push(nav.browserLanguage);
}
if (
	Object.prototype.hasOwnProperty.call(nav, 'systemLanguage') &&
	nav['systemLanguage']
) {
	locales.push(nav.systemLanguage);
}
userLocales(locales);

export * from './core';
export { parseMoCatalog } from './parser';
