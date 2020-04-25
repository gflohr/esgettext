// Dummy gettext implementation.
interface Placeholder {
	[index: string]: string
};

export function _(msgid: string) {
	return msgid;
}

function expand(msg: string, placeholders: Placeholder): string {
	return msg.replace(/\{([a-zA-Z][0-9a-zA-Z]*)\}/g, (_, match) => {
		if (placeholders.hasOwnProperty(match)) {
				return placeholders[match];
		} else {
				return `{${match}}`;
		}
	});
}

export function _x(msgid: string, placeholders: Placeholder): string {
	return expand(msgid, placeholders);
}
