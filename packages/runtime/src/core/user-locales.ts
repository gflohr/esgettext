let userLocalesSelected = ['C'];

/*
 * Force an execution environment. By default, the environment (NodeJS or
 * browser) is auto-detected. You can force the library to assume a certain
 * environment with this function.
 *
 * @param browser - whether to assume a browser or not
 * @returns the new setting.
 */
export function userLocales(locales?: Array<string>): Array<string> {
	if (typeof locales !== 'undefined') {
		userLocalesSelected = locales;
	}

	return userLocalesSelected;
}
