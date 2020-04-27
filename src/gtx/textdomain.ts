interface Textdomains {
	[key: string]: Textdomain;
}

interface Placeholder {
	[index: string]: string;
}

const domains: Textdomains = {};

export class Textdomain {
	private domain: string;

	private constructor() {
		/* Prevent instantiation. */
	}

	/**
	 * Instantiate a Textdomain object. Textdomain objects are singletons
	 * for each textdomain identifier.
	 *
	 * @param textdomain {string} the textdomain of your application or library.
	 */
	static instance(textdomain: string): Textdomain {
		if (
			typeof textdomain === 'undefined' ||
			textdomain === null ||
			textdomain === ''
		) {
			throw new Error('Cannot instantiate TextDomain without a textdomain');
		}
		if (Object.prototype.hasOwnProperty.call(domains, textdomain)) {
			return domains[textdomain];
		} else {
			const domain = new Textdomain();
			domain.domain = textdomain;
			domains[textdomain] = domain;
			return domain;
		}
	}

	/**
	 * Translate a simple string.
	 *
	 * @param msgid the string to translate
	 *
	 * @returns the translated string
	 */
	_(msgid: string): string {
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
	_x(msgid: string, placeholders: Placeholder): string {
		return this.expand(msgid, placeholders);
	}

	/**
	 * A textdomain is an identifier for your application or library. It is
	 * the basename of your translation files which are either TEXTDOMAIN.json
	 * or TEXTDOMAIN.mo, depending on the format you have chosen.
	 * @returns the textdomain
	 */
	public textdomain(): string {
		return this.domain;
	}

	private expand(msg: string, placeholders: Placeholder): string {
		return msg.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
			if (Object.prototype.hasOwnProperty.call(placeholders, match)) {
				return placeholders[match];
			} else {
				return `{${match}}`;
			}
		});
	}
}
