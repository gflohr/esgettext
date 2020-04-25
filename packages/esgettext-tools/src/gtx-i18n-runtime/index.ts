// Dummy gettext implementation.
interface Placeholder {
	[index: string]: string
};

export class Gtx {
	constructor(textdomain: string) {}

	_(msgid: string) {
		return msgid;
	}

	N_(msgid: string): string {
		return msgid;
	}

	_x(msgid: string, placeholders: Placeholder): string {
		return msgid.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
			if (placeholders.hasOwnProperty(match)) {
				return placeholders[match];
			} else {
				return `{${match}}`;
			}
		});
	}
}
