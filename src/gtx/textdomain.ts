interface TextDomains {
	[key: string]: TextDomain;
}

const domains: TextDomains = {};

export class TextDomain {
	private domain: string;

	private constructor() {
		/* Empty. */
	}

	public textdomain(): string {
		return this.domain;
	}

	static instance(textdomain: string): TextDomain {
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
			const domain = new TextDomain();
			domain.domain = textdomain;
			domains[textdomain] = domain;
			return domain;
		}
	}
}
