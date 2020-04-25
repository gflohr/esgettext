let useJSONCatalog = true;

interface Placeholder {
	[index: string]: string
};

function expand(msg: string, placeholders: Placeholder): string {
	return msg.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
		if (placeholders.hasOwnProperty(match)) {
				return placeholders[match];
		} else {
				return `{${match}}`;
		}
	});
}

/**
 * Set the preferred message format.
 *
 * @param json true if json should preferred over mo files.
 *
 * The library can either load message catalogs in GtxI18N JSON or
 * in mo format.
 */
export function useJSON(json: boolean) {
	useJSONCatalog = json;
}

export function bindtextdomain(domainname: string, path?: string): Promise {
	return new Promise(resolve => {
		resolve();
	});
}

/**
 * Translate a simple string.
 *
 * @param msgid the string to translate
 *
 * @returns the translated string
 */
export function _(msgid: string) {
	return msgid;
}

/**
 * Translate a string with placeholders.
 *
 * Placeholder names must begin with an ASCII alphabetic character (a-z, A-Z)
 * and can be followed by an arbitrary number of ASCII alphabetic characters
 * or ASCII digits (a-z, A-Z).
 *
 * @param msgid
 * @param placeholders
 */
export function _x(msgid: string, placeholders: Placeholder): string {
	return expand(msgid, placeholders);
}
