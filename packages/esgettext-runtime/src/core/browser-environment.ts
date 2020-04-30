import * as isNode from 'detect-node';
let isBrowser = isNode ? false : true;

/**
 * Force an execution environment. By default, the environment (NodeJS or
 * browser) is auto-detected. You can force the library to assume a certain
 * environment with this function.
 *
 * @param browser - whether to assume a browser or not
 * @returns the new setting.
 */
export function browserEnvironment(browser?: boolean): boolean {
	if (typeof browser !== 'undefined') {
		isBrowser = browser;
	}

	return isBrowser;
}
